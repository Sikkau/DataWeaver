package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/pkg/crypto"
	"github.com/yourusername/dataweaver/pkg/dbconnector"
)

var (
	ErrInvalidDataSourceType = errors.New("invalid datasource type")
	ErrDataSourceInUse       = errors.New("datasource is in use by queries")
	ErrConnectionFailed      = errors.New("connection test failed")
)

// DataSourceService handles business logic for datasources
type DataSourceService interface {
	Create(userID uint, req *model.CreateDataSourceRequest) (*model.DataSourceResponse, error)
	List(userID uint, page, size int, keyword string) ([]model.DataSourceResponse, int64, error)
	Get(id string, userID uint) (*model.DataSourceResponse, error)
	GetWithPassword(id string, userID uint) (*model.DataSource, error)
	Update(id string, userID uint, req *model.UpdateDataSourceRequest) (*model.DataSourceResponse, error)
	Delete(id string, userID uint) error
	TestConnection(id string, userID uint) (*model.TestConnectionResult, error)
	TestConnectionDirect(req *model.CreateDataSourceRequest) (*model.TestConnectionResult, error)
	GetTables(id string, userID uint) ([]model.TableInfoResponse, error)
}

type dataSourceService struct {
	repo repository.DataSourceRepository
}

// NewDataSourceService creates a new DataSourceService
func NewDataSourceService(repo repository.DataSourceRepository) DataSourceService {
	return &dataSourceService{repo: repo}
}

// Create creates a new datasource
func (s *dataSourceService) Create(userID uint, req *model.CreateDataSourceRequest) (*model.DataSourceResponse, error) {
	// Validate type
	if !isValidType(req.Type) {
		return nil, ErrInvalidDataSourceType
	}

	// Encrypt password
	encryptedPassword, err := crypto.Encrypt(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt password: %w", err)
	}

	// Set default SSL mode
	sslMode := req.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}

	ds := &model.DataSource{
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Host:        req.Host,
		Port:        req.Port,
		Database:    req.Database,
		Username:    req.Username,
		Password:    encryptedPassword,
		SSLMode:     sslMode,
		Status:      "active",
	}

	if err := s.repo.Create(ds); err != nil {
		return nil, err
	}

	return ds.ToResponse(), nil
}

// List returns all datasources for a user with optional search
func (s *dataSourceService) List(userID uint, page, size int, keyword string) ([]model.DataSourceResponse, int64, error) {
	// Set defaults
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	var datasources []model.DataSource
	var total int64
	var err error

	if keyword != "" {
		datasources, total, err = s.repo.Search(userID, keyword, page, size)
	} else {
		datasources, total, err = s.repo.FindAll(userID, page, size)
	}

	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.DataSourceResponse, len(datasources))
	for i, ds := range datasources {
		responses[i] = *ds.ToResponse()
	}

	return responses, total, nil
}

// Get returns a datasource by ID
func (s *dataSourceService) Get(id string, userID uint) (*model.DataSourceResponse, error) {
	ds, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}
	return ds.ToResponse(), nil
}

// GetWithPassword returns a datasource with decrypted password (for internal use)
func (s *dataSourceService) GetWithPassword(id string, userID uint) (*model.DataSource, error) {
	ds, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	// Decrypt password
	decryptedPassword, err := crypto.Decrypt(ds.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt password: %w", err)
	}
	ds.Password = decryptedPassword

	return ds, nil
}

// Update updates a datasource
func (s *dataSourceService) Update(id string, userID uint, req *model.UpdateDataSourceRequest) (*model.DataSourceResponse, error) {
	ds, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		ds.Name = *req.Name
	}
	if req.Description != nil {
		ds.Description = *req.Description
	}
	if req.Type != nil {
		if !isValidType(*req.Type) {
			return nil, ErrInvalidDataSourceType
		}
		ds.Type = *req.Type
	}
	if req.Host != nil {
		ds.Host = *req.Host
	}
	if req.Port != nil {
		ds.Port = *req.Port
	}
	if req.Database != nil {
		ds.Database = *req.Database
	}
	if req.Username != nil {
		ds.Username = *req.Username
	}
	if req.Password != nil {
		encryptedPassword, err := crypto.Encrypt(*req.Password)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt password: %w", err)
		}
		ds.Password = encryptedPassword
	}
	if req.SSLMode != nil {
		ds.SSLMode = *req.SSLMode
	}
	if req.Status != nil {
		ds.Status = *req.Status
	}

	if err := s.repo.Update(ds); err != nil {
		return nil, err
	}

	return ds.ToResponse(), nil
}

// Delete deletes a datasource
func (s *dataSourceService) Delete(id string, userID uint) error {
	// Check if datasource has associated queries
	hasQueries, err := s.repo.HasAssociatedQueries(id)
	if err != nil {
		return err
	}
	if hasQueries {
		return ErrDataSourceInUse
	}

	return s.repo.Delete(id, userID)
}

// TestConnection tests the connection to a datasource
func (s *dataSourceService) TestConnection(id string, userID uint) (*model.TestConnectionResult, error) {
	ds, err := s.GetWithPassword(id, userID)
	if err != nil {
		return &model.TestConnectionResult{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	return s.testConnection(ds.Type, ds.Host, ds.Port, ds.Username, ds.Password, ds.Database, ds.SSLMode)
}

// TestConnectionDirect tests connection without saving to database
func (s *dataSourceService) TestConnectionDirect(req *model.CreateDataSourceRequest) (*model.TestConnectionResult, error) {
	sslMode := req.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}

	return s.testConnection(req.Type, req.Host, req.Port, req.Username, req.Password, req.Database, sslMode)
}

func (s *dataSourceService) testConnection(dbType, host string, port int, username, password, database, sslMode string) (*model.TestConnectionResult, error) {
	start := time.Now()

	config := &dbconnector.ConnectionConfig{
		Type:     dbconnector.DBType(dbType),
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		Database: database,
		SSLMode:  sslMode,
	}

	connector := dbconnector.NewConnector(config)
	err := connector.TestConnection()
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return &model.TestConnectionResult{
			Success: false,
			Message: err.Error(),
			Latency: latency,
		}, nil
	}

	return &model.TestConnectionResult{
		Success: true,
		Message: "Connection successful",
		Latency: latency,
	}, nil
}

// GetTables returns the list of tables in a datasource
func (s *dataSourceService) GetTables(id string, userID uint) ([]model.TableInfoResponse, error) {
	ds, err := s.GetWithPassword(id, userID)
	if err != nil {
		return nil, err
	}

	config := &dbconnector.ConnectionConfig{
		Type:     dbconnector.DBType(ds.Type),
		Host:     ds.Host,
		Port:     ds.Port,
		Username: ds.Username,
		Password: ds.Password,
		Database: ds.Database,
		SSLMode:  ds.SSLMode,
	}

	connector := dbconnector.NewConnector(config)
	if err := connector.Connect(); err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer connector.Close()

	tables, err := connector.GetSchema()
	if err != nil {
		return nil, fmt.Errorf("failed to get schema: %w", err)
	}

	responses := make([]model.TableInfoResponse, len(tables))
	for i, t := range tables {
		columns := make([]model.ColumnInfoResponse, len(t.Columns))
		for j, c := range t.Columns {
			columns[j] = model.ColumnInfoResponse{
				Name:       c.Name,
				Type:       c.Type,
				Nullable:   c.Nullable,
				PrimaryKey: c.PrimaryKey,
			}
		}
		responses[i] = model.TableInfoResponse{
			Name:    t.Name,
			Schema:  t.Schema,
			Columns: columns,
		}
	}

	return responses, nil
}

func isValidType(t string) bool {
	switch t {
	case "mysql", "postgresql", "sqlserver", "oracle":
		return true
	default:
		return false
	}
}
