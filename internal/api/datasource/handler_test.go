package datasource

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/internal/service"
)

// MockDataSourceService is a mock implementation of DataSourceService
type MockDataSourceService struct {
	mock.Mock
}

func (m *MockDataSourceService) Create(userID uint, req *model.CreateDataSourceRequest) (*model.DataSourceResponse, error) {
	args := m.Called(userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.DataSourceResponse), args.Error(1)
}

func (m *MockDataSourceService) List(userID uint, page, size int, keyword string) ([]model.DataSourceResponse, int64, error) {
	args := m.Called(userID, page, size, keyword)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]model.DataSourceResponse), args.Get(1).(int64), args.Error(2)
}

func (m *MockDataSourceService) Get(id string, userID uint) (*model.DataSourceResponse, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.DataSourceResponse), args.Error(1)
}

func (m *MockDataSourceService) GetWithPassword(id string, userID uint) (*model.DataSource, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.DataSource), args.Error(1)
}

func (m *MockDataSourceService) Update(id string, userID uint, req *model.UpdateDataSourceRequest) (*model.DataSourceResponse, error) {
	args := m.Called(id, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.DataSourceResponse), args.Error(1)
}

func (m *MockDataSourceService) Delete(id string, userID uint) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockDataSourceService) TestConnection(id string, userID uint) (*model.TestConnectionResult, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.TestConnectionResult), args.Error(1)
}

func (m *MockDataSourceService) TestConnectionDirect(req *model.CreateDataSourceRequest) (*model.TestConnectionResult, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.TestConnectionResult), args.Error(1)
}

func (m *MockDataSourceService) GetTables(id string, userID uint) ([]model.TableInfoResponse, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]model.TableInfoResponse), args.Error(1)
}

func setupRouter(handler *Handler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Add middleware to set user_id in context
	r.Use(func(c *gin.Context) {
		c.Set("user_id", uint(1))
		c.Next()
	})

	r.GET("/datasources", handler.List)
	r.POST("/datasources", handler.Create)
	r.POST("/datasources/test", handler.TestConnectionDirect)
	r.GET("/datasources/:id", handler.Get)
	r.PUT("/datasources/:id", handler.Update)
	r.DELETE("/datasources/:id", handler.Delete)
	r.POST("/datasources/:id/test", handler.TestConnection)
	r.GET("/datasources/:id/tables", handler.GetTables)

	return r
}

func TestHandler_List(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	datasources := []model.DataSourceResponse{
		{
			ID:       "uuid-1",
			UserID:   1,
			Name:     "Test DB",
			Type:     "postgresql",
			Host:     "localhost",
			Port:     5432,
			Database: "testdb",
			Username: "user",
			Status:   "active",
		},
	}

	mockSvc.On("List", uint(1), 1, 20, "").Return(datasources, int64(1), nil)

	req, _ := http.NewRequest("GET", "/datasources", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(0), response["code"])
	assert.Equal(t, float64(1), response["total"])

	mockSvc.AssertExpectations(t)
}

func TestHandler_Create(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	reqBody := model.CreateDataSourceRequest{
		Name:     "Test DB",
		Type:     "postgresql",
		Host:     "localhost",
		Port:     5432,
		Database: "testdb",
		Username: "user",
		Password: "password",
	}

	respData := &model.DataSourceResponse{
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

	mockSvc.On("Create", uint(1), mock.AnythingOfType("*model.CreateDataSourceRequest")).Return(respData, nil)

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/datasources", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(0), response["code"])

	mockSvc.AssertExpectations(t)
}

func TestHandler_Create_InvalidType(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	reqBody := model.CreateDataSourceRequest{
		Name:     "Test DB",
		Type:     "invalid",
		Host:     "localhost",
		Port:     5432,
		Database: "testdb",
		Username: "user",
		Password: "password",
	}

	mockSvc.On("Create", uint(1), mock.AnythingOfType("*model.CreateDataSourceRequest")).Return(nil, service.ErrInvalidDataSourceType)

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/datasources", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	mockSvc.AssertExpectations(t)
}

func TestHandler_Get(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	respData := &model.DataSourceResponse{
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

	mockSvc.On("Get", "uuid-1", uint(1)).Return(respData, nil)

	req, _ := http.NewRequest("GET", "/datasources/uuid-1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(0), response["code"])

	mockSvc.AssertExpectations(t)
}

func TestHandler_Get_NotFound(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	mockSvc.On("Get", "uuid-not-found", uint(1)).Return(nil, repository.ErrDataSourceNotFound)

	req, _ := http.NewRequest("GET", "/datasources/uuid-not-found", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	mockSvc.AssertExpectations(t)
}

func TestHandler_Update(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	newName := "Updated Name"
	reqBody := model.UpdateDataSourceRequest{
		Name: &newName,
	}

	respData := &model.DataSourceResponse{
		ID:       "uuid-1",
		UserID:   1,
		Name:     "Updated Name",
		Type:     "postgresql",
		Host:     "localhost",
		Port:     5432,
		Database: "testdb",
		Username: "user",
		Status:   "active",
	}

	mockSvc.On("Update", "uuid-1", uint(1), mock.AnythingOfType("*model.UpdateDataSourceRequest")).Return(respData, nil)

	body, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("PUT", "/datasources/uuid-1", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(0), response["code"])

	mockSvc.AssertExpectations(t)
}

func TestHandler_Delete(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	mockSvc.On("Delete", "uuid-1", uint(1)).Return(nil)

	req, _ := http.NewRequest("DELETE", "/datasources/uuid-1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)

	mockSvc.AssertExpectations(t)
}

func TestHandler_Delete_InUse(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	mockSvc.On("Delete", "uuid-1", uint(1)).Return(service.ErrDataSourceInUse)

	req, _ := http.NewRequest("DELETE", "/datasources/uuid-1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)

	mockSvc.AssertExpectations(t)
}

func TestHandler_TestConnection(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	result := &model.TestConnectionResult{
		Success: true,
		Message: "Connection successful",
		Latency: 50,
	}

	mockSvc.On("TestConnection", "uuid-1", uint(1)).Return(result, nil)

	req, _ := http.NewRequest("POST", "/datasources/uuid-1/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(0), response["code"])

	mockSvc.AssertExpectations(t)
}

func TestHandler_GetTables(t *testing.T) {
	mockSvc := new(MockDataSourceService)
	handler := NewHandler(mockSvc)
	router := setupRouter(handler)

	tables := []model.TableInfoResponse{
		{
			Name:   "users",
			Schema: "public",
			Columns: []model.ColumnInfoResponse{
				{Name: "id", Type: "integer", Nullable: false, PrimaryKey: true},
				{Name: "name", Type: "varchar", Nullable: true, PrimaryKey: false},
			},
		},
	}

	mockSvc.On("GetTables", "uuid-1", uint(1)).Return(tables, nil)

	req, _ := http.NewRequest("GET", "/datasources/uuid-1/tables", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(0), response["code"])

	mockSvc.AssertExpectations(t)
}
