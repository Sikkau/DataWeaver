package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/pkg/crypto"
)

func init() {
	// Initialize crypto with a test key
	_ = crypto.Init("12345678901234567890123456789012")
}

func TestDataSourceService_Create(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	req := &model.CreateDataSourceRequest{
		Name:     "Test DB",
		Type:     "postgresql",
		Host:     "localhost",
		Port:     5432,
		Database: "testdb",
		Username: "user",
		Password: "password",
	}

	mockRepo.On("Create", mock.AnythingOfType("*model.DataSource")).Return(nil)

	result, err := svc.Create(1, req)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Test DB", result.Name)
	assert.Equal(t, "postgresql", result.Type)
	assert.Equal(t, "localhost", result.Host)
	assert.Equal(t, 5432, result.Port)
	assert.Equal(t, "testdb", result.Database)
	assert.Equal(t, "active", result.Status)

	mockRepo.AssertExpectations(t)
}

func TestDataSourceService_Create_InvalidType(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	req := &model.CreateDataSourceRequest{
		Name:     "Test DB",
		Type:     "invalid",
		Host:     "localhost",
		Port:     5432,
		Database: "testdb",
		Username: "user",
		Password: "password",
	}

	result, err := svc.Create(1, req)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, ErrInvalidDataSourceType, err)
}

func TestDataSourceService_List(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	datasources := []model.DataSource{
		{
			ID:       "uuid-1",
			UserID:   1,
			Name:     "DB 1",
			Type:     "postgresql",
			Host:     "localhost",
			Port:     5432,
			Database: "db1",
			Username: "user",
			Status:   "active",
		},
		{
			ID:       "uuid-2",
			UserID:   1,
			Name:     "DB 2",
			Type:     "mysql",
			Host:     "localhost",
			Port:     3306,
			Database: "db2",
			Username: "user",
			Status:   "active",
		},
	}

	mockRepo.On("FindAll", uint(1), 1, 20).Return(datasources, int64(2), nil)

	result, total, err := svc.List(1, 1, 20, "")

	assert.NoError(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, int64(2), total)
	assert.Equal(t, "DB 1", result[0].Name)
	assert.Equal(t, "DB 2", result[1].Name)

	mockRepo.AssertExpectations(t)
}

func TestDataSourceService_List_WithSearch(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	datasources := []model.DataSource{
		{
			ID:       "uuid-1",
			UserID:   1,
			Name:     "Production DB",
			Type:     "postgresql",
			Host:     "localhost",
			Port:     5432,
			Database: "prod",
			Username: "user",
			Status:   "active",
		},
	}

	mockRepo.On("Search", uint(1), "Production", 1, 20).Return(datasources, int64(1), nil)

	result, total, err := svc.List(1, 1, 20, "Production")

	assert.NoError(t, err)
	assert.Equal(t, 1, len(result))
	assert.Equal(t, int64(1), total)
	assert.Equal(t, "Production DB", result[0].Name)

	mockRepo.AssertExpectations(t)
}

func TestDataSourceService_Get(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	ds := &model.DataSource{
		ID:       "uuid-1",
		UserID:   1,
		Name:     "Test DB",
		Type:     "postgresql",
		Host:     "localhost",
		Port:     5432,
		Database: "testdb",
		Username: "user",
		Status:   "active",
	}

	mockRepo.On("FindByIDAndUserID", "uuid-1", uint(1)).Return(ds, nil)

	result, err := svc.Get("uuid-1", 1)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "uuid-1", result.ID)
	assert.Equal(t, "Test DB", result.Name)

	mockRepo.AssertExpectations(t)
}

func TestDataSourceService_Get_NotFound(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	mockRepo.On("FindByIDAndUserID", "uuid-not-found", uint(1)).Return(nil, repository.ErrDataSourceNotFound)

	result, err := svc.Get("uuid-not-found", 1)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, repository.ErrDataSourceNotFound, err)

	mockRepo.AssertExpectations(t)
}

func TestDataSourceService_Update(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	ds := &model.DataSource{
		ID:       "uuid-1",
		UserID:   1,
		Name:     "Old Name",
		Type:     "postgresql",
		Host:     "localhost",
		Port:     5432,
		Database: "testdb",
		Username: "user",
		Password: "encrypted",
		Status:   "active",
	}

	newName := "New Name"
	req := &model.UpdateDataSourceRequest{
		Name: &newName,
	}

	mockRepo.On("FindByIDAndUserID", "uuid-1", uint(1)).Return(ds, nil)
	mockRepo.On("Update", mock.AnythingOfType("*model.DataSource")).Return(nil)

	result, err := svc.Update("uuid-1", 1, req)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "New Name", result.Name)

	mockRepo.AssertExpectations(t)
}

func TestDataSourceService_Delete(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	mockRepo.On("HasAssociatedQueries", "uuid-1").Return(false, nil)
	mockRepo.On("Delete", "uuid-1", uint(1)).Return(nil)

	err := svc.Delete("uuid-1", 1)

	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}

func TestDataSourceService_Delete_WithAssociatedQueries(t *testing.T) {
	mockRepo := new(repository.MockDataSourceRepository)
	svc := NewDataSourceService(mockRepo)

	mockRepo.On("HasAssociatedQueries", "uuid-1").Return(true, nil)

	err := svc.Delete("uuid-1", 1)

	assert.Error(t, err)
	assert.Equal(t, ErrDataSourceInUse, err)

	mockRepo.AssertExpectations(t)
}

func TestIsValidType(t *testing.T) {
	tests := []struct {
		name     string
		dbType   string
		expected bool
	}{
		{"mysql", "mysql", true},
		{"postgresql", "postgresql", true},
		{"sqlserver", "sqlserver", true},
		{"oracle", "oracle", true},
		{"invalid", "invalid", false},
		{"empty", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidType(tt.dbType)
			assert.Equal(t, tt.expected, result)
		})
	}
}
