package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/pkg/crypto"
	"github.com/yourusername/dataweaver/pkg/dbconnector"
	"github.com/yourusername/dataweaver/pkg/sqlparser"
)

var (
	ErrInvalidSQL         = errors.New("invalid SQL syntax")
	ErrNonReadOnlySQL     = errors.New("only SELECT queries are allowed")
	ErrDataSourceNotFound = errors.New("data source not found")
	ErrMissingParameters  = errors.New("missing required parameters")
	ErrQueryExecution     = errors.New("query execution failed")
)

// QueryService handles business logic for queries
type QueryService interface {
	Create(userID uint, req *model.CreateQueryRequest) (*model.QueryResponse, error)
	List(userID uint, page, size int, keyword string) ([]model.QueryResponse, int64, error)
	Get(id string, userID uint) (*model.QueryResponse, error)
	Update(id string, userID uint, req *model.UpdateQueryRequest) (*model.QueryResponse, error)
	Delete(id string, userID uint) error
	Execute(id string, userID uint, req *model.ExecuteQueryRequest) (*model.ExecuteQueryResponse, error)
	ValidateSQL(sqlTemplate string) (*model.ValidateSQLResponse, error)
	GetParameters(id string, userID uint) ([]model.QueryParameter, error)
	ExtractParameters(sqlTemplate string) ([]model.QueryParameter, error)
	// Execution history
	GetExecutionHistory(userID uint, queryID string, page, size int) ([]model.QueryExecutionResponse, int64, error)
}

type queryService struct {
	queryRepo repository.QueryRepository
	dsRepo    repository.DataSourceRepository
}

// NewQueryService creates a new QueryService
func NewQueryService(queryRepo repository.QueryRepository, dsRepo repository.DataSourceRepository) QueryService {
	return &queryService{
		queryRepo: queryRepo,
		dsRepo:    dsRepo,
	}
}

// Create creates a new query
func (s *queryService) Create(userID uint, req *model.CreateQueryRequest) (*model.QueryResponse, error) {
	// Validate the data source exists and belongs to the user
	ds, err := s.dsRepo.FindByIDAndUserID(req.DataSourceID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrDataSourceNotFound) {
			return nil, ErrDataSourceNotFound
		}
		return nil, err
	}

	// Validate SQL syntax
	if err := sqlparser.ValidateSQLSyntax(req.SQLTemplate); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidSQL, err)
	}

	// Validate SQL is read-only
	if err := sqlparser.ValidateReadOnlySQL(req.SQLTemplate); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrNonReadOnlySQL, err)
	}

	// Extract parameters from SQL if not provided
	params := req.Parameters
	if len(params) == 0 {
		params = s.extractParametersFromSQL(req.SQLTemplate)
	}

	query := &model.Query{
		UserID:       userID,
		Name:         req.Name,
		Description:  req.Description,
		DataSourceID: req.DataSourceID,
		SQLTemplate:  req.SQLTemplate,
		Status:       "active",
	}

	if err := query.SetParameters(params); err != nil {
		return nil, fmt.Errorf("failed to set parameters: %w", err)
	}

	if err := s.queryRepo.Create(query); err != nil {
		return nil, err
	}

	// Set DataSource for response
	query.DataSource = *ds

	return query.ToResponse(), nil
}

// List returns all queries for a user with optional search
func (s *queryService) List(userID uint, page, size int, keyword string) ([]model.QueryResponse, int64, error) {
	// Set defaults
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	var queries []model.Query
	var total int64
	var err error

	if keyword != "" {
		queries, total, err = s.queryRepo.Search(userID, keyword, page, size)
	} else {
		queries, total, err = s.queryRepo.FindAll(userID, page, size)
	}

	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.QueryResponse, len(queries))
	for i, q := range queries {
		responses[i] = *q.ToResponse()
	}

	return responses, total, nil
}

// Get returns a query by ID
func (s *queryService) Get(id string, userID uint) (*model.QueryResponse, error) {
	q, err := s.queryRepo.FindByIDWithDataSource(id, userID)
	if err != nil {
		return nil, err
	}
	return q.ToResponse(), nil
}

// Update updates a query
func (s *queryService) Update(id string, userID uint, req *model.UpdateQueryRequest) (*model.QueryResponse, error) {
	q, err := s.queryRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		q.Name = *req.Name
	}
	if req.Description != nil {
		q.Description = *req.Description
	}
	if req.DataSourceID != nil {
		// Validate the new data source exists and belongs to the user
		_, err := s.dsRepo.FindByIDAndUserID(*req.DataSourceID, userID)
		if err != nil {
			if errors.Is(err, repository.ErrDataSourceNotFound) {
				return nil, ErrDataSourceNotFound
			}
			return nil, err
		}
		q.DataSourceID = *req.DataSourceID
	}
	if req.SQLTemplate != nil {
		// Validate SQL syntax
		if err := sqlparser.ValidateSQLSyntax(*req.SQLTemplate); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrInvalidSQL, err)
		}

		// Validate SQL is read-only
		if err := sqlparser.ValidateReadOnlySQL(*req.SQLTemplate); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrNonReadOnlySQL, err)
		}

		q.SQLTemplate = *req.SQLTemplate

		// Re-extract parameters if SQL template changed and no new parameters provided
		if req.Parameters == nil {
			params := s.extractParametersFromSQL(*req.SQLTemplate)
			if err := q.SetParameters(params); err != nil {
				return nil, fmt.Errorf("failed to set parameters: %w", err)
			}
		}
	}
	if req.Parameters != nil {
		if err := q.SetParameters(req.Parameters); err != nil {
			return nil, fmt.Errorf("failed to set parameters: %w", err)
		}
	}
	if req.Status != nil {
		q.Status = *req.Status
	}

	if err := s.queryRepo.Update(q); err != nil {
		return nil, err
	}

	// Reload with DataSource
	q, err = s.queryRepo.FindByIDWithDataSource(id, userID)
	if err != nil {
		return nil, err
	}

	return q.ToResponse(), nil
}

// Delete deletes a query
func (s *queryService) Delete(id string, userID uint) error {
	return s.queryRepo.Delete(id, userID)
}

// Execute executes a query with the provided parameters
func (s *queryService) Execute(id string, userID uint, req *model.ExecuteQueryRequest) (*model.ExecuteQueryResponse, error) {
	// Get the query with DataSource
	q, err := s.queryRepo.FindByIDWithDataSource(id, userID)
	if err != nil {
		return nil, err
	}

	// Validate parameters
	if err := sqlparser.ValidateParameters(q.SQLTemplate, req.Parameters); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrMissingParameters, err)
	}

	// Get DataSource with decrypted password
	ds, err := s.dsRepo.FindByIDAndUserID(q.DataSourceID, userID)
	if err != nil {
		return nil, err
	}

	// Decrypt password
	password, err := crypto.Decrypt(ds.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt datasource password: %w", err)
	}

	// Create database connection
	config := &dbconnector.ConnectionConfig{
		Type:     dbconnector.DBType(ds.Type),
		Host:     ds.Host,
		Port:     ds.Port,
		Username: ds.Username,
		Password: password,
		Database: ds.Database,
		SSLMode:  ds.SSLMode,
	}

	connector := dbconnector.NewConnector(config)
	if err := connector.Connect(); err != nil {
		return nil, fmt.Errorf("failed to connect to datasource: %w", err)
	}
	defer connector.Close()

	// Serialize parameters for history
	paramsJSON, _ := serializeParams(req.Parameters)

	// Execute query with ordered columns
	start := time.Now()
	queryResult, execErr := connector.ExecuteQueryWithColumns(q.SQLTemplate, req.Parameters)
	executionTime := time.Since(start).Milliseconds()

	// Save execution history
	execution := &model.QueryExecution{
		UserID:          userID,
		QueryID:         id,
		Parameters:      paramsJSON,
		ExecutionTimeMs: executionTime,
	}

	if execErr != nil {
		execution.Status = "error"
		execution.ErrorMessage = execErr.Error()
		execution.RowCount = 0
	} else {
		execution.Status = "success"
		execution.RowCount = len(queryResult.Data)
	}

	// Save execution record (ignore errors, don't affect main flow)
	_ = s.queryRepo.CreateExecution(execution)

	if execErr != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryExecution, execErr)
	}

	return &model.ExecuteQueryResponse{
		Columns:         queryResult.Columns, // Use ordered columns from database
		Data:            queryResult.Data,
		RowCount:        len(queryResult.Data),
		ExecutionTimeMs: executionTime,
	}, nil
}

// ValidateSQL validates SQL syntax and checks if it's read-only
func (s *queryService) ValidateSQL(sqlTemplate string) (*model.ValidateSQLResponse, error) {
	response := &model.ValidateSQLResponse{
		Valid: true,
	}

	// Validate syntax
	if err := sqlparser.ValidateSQLSyntax(sqlTemplate); err != nil {
		response.Valid = false
		response.Message = fmt.Sprintf("Syntax error: %v", err)
		return response, nil
	}

	// Validate read-only
	if err := sqlparser.ValidateReadOnlySQL(sqlTemplate); err != nil {
		response.Valid = false
		response.Message = fmt.Sprintf("Security error: %v", err)
		return response, nil
	}

	// Extract parameters
	response.Parameters = s.extractParametersFromSQL(sqlTemplate)
	response.Message = "SQL is valid"

	return response, nil
}

// GetParameters returns the parameters for a query
func (s *queryService) GetParameters(id string, userID uint) ([]model.QueryParameter, error) {
	q, err := s.queryRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	params, err := q.GetParameters()
	if err != nil {
		return nil, fmt.Errorf("failed to get parameters: %w", err)
	}

	if params == nil {
		params = []model.QueryParameter{}
	}

	return params, nil
}

// ExtractParameters extracts parameters from SQL template
func (s *queryService) ExtractParameters(sqlTemplate string) ([]model.QueryParameter, error) {
	return s.extractParametersFromSQL(sqlTemplate), nil
}

// extractParametersFromSQL extracts and converts parameters from SQL template
func (s *queryService) extractParametersFromSQL(sqlTemplate string) []model.QueryParameter {
	paramInfos := sqlparser.ExtractParametersWithInfo(sqlTemplate)

	params := make([]model.QueryParameter, len(paramInfos))
	for i, info := range paramInfos {
		params[i] = model.QueryParameter{
			Name:        info.Name,
			Type:        info.Type,
			Required:    true,
			Description: fmt.Sprintf("Parameter %s", info.Name),
		}
	}

	return params
}

// ExecuteRawQuery executes a raw SQL query against a datasource (for testing/preview)
func (s *queryService) ExecuteRawQuery(userID uint, dataSourceID, sqlTemplate string, params map[string]interface{}) (*model.ExecuteQueryResponse, error) {
	// Validate SQL
	if err := sqlparser.ValidateSQLSyntax(sqlTemplate); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidSQL, err)
	}

	if err := sqlparser.ValidateReadOnlySQL(sqlTemplate); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrNonReadOnlySQL, err)
	}

	// Validate parameters
	if err := sqlparser.ValidateParameters(sqlTemplate, params); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrMissingParameters, err)
	}

	// Get DataSource
	ds, err := s.dsRepo.FindByIDAndUserID(dataSourceID, userID)
	if err != nil {
		return nil, err
	}

	// Decrypt password
	password, err := crypto.Decrypt(ds.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt datasource password: %w", err)
	}

	// Create database connection
	config := &dbconnector.ConnectionConfig{
		Type:     dbconnector.DBType(ds.Type),
		Host:     ds.Host,
		Port:     ds.Port,
		Username: ds.Username,
		Password: password,
		Database: ds.Database,
		SSLMode:  ds.SSLMode,
	}

	connector := dbconnector.NewConnector(config)
	if err := connector.Connect(); err != nil {
		return nil, fmt.Errorf("failed to connect to datasource: %w", err)
	}
	defer connector.Close()

	// Execute query with ordered columns
	start := time.Now()
	queryResult, err := connector.ExecuteQueryWithColumns(sqlTemplate, params)
	executionTime := time.Since(start).Milliseconds()

	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryExecution, err)
	}

	return &model.ExecuteQueryResponse{
		Columns:         queryResult.Columns,
		Data:            queryResult.Data,
		RowCount:        len(queryResult.Data),
		ExecutionTimeMs: executionTime,
	}, nil
}

// serializeParams converts parameters map to JSON string
func serializeParams(params map[string]interface{}) (string, error) {
	if params == nil || len(params) == 0 {
		return "{}", nil
	}
	data, err := json.Marshal(params)
	if err != nil {
		return "{}", err
	}
	return string(data), nil
}

// deserializeParams converts JSON string to parameters map
func deserializeParams(paramsJSON string) map[string]interface{} {
	if paramsJSON == "" || paramsJSON == "{}" {
		return make(map[string]interface{})
	}
	var params map[string]interface{}
	if err := json.Unmarshal([]byte(paramsJSON), &params); err != nil {
		return make(map[string]interface{})
	}
	return params
}

// GetExecutionHistory returns execution history for queries
func (s *queryService) GetExecutionHistory(userID uint, queryID string, page, size int) ([]model.QueryExecutionResponse, int64, error) {
	// Set defaults
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	var executions []model.QueryExecution
	var total int64
	var err error

	if queryID != "" {
		executions, total, err = s.queryRepo.FindExecutionsByQueryID(queryID, userID, page, size)
	} else {
		executions, total, err = s.queryRepo.FindExecutionsByUserID(userID, page, size)
	}

	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.QueryExecutionResponse, len(executions))
	for i, exec := range executions {
		responses[i] = model.QueryExecutionResponse{
			ID:              exec.ID,
			QueryID:         exec.QueryID,
			Parameters:      deserializeParams(exec.Parameters),
			RowCount:        exec.RowCount,
			ExecutionTimeMs: exec.ExecutionTimeMs,
			Status:          exec.Status,
			ErrorMessage:    exec.ErrorMessage,
			CreatedAt:       exec.CreatedAt,
		}
		if exec.Query.ID != "" {
			responses[i].QueryName = exec.Query.Name
		}
	}

	return responses, total, nil
}
