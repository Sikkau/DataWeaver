package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// JSONParameters is a custom type for storing JSON parameters in the database
type JSONParameters []QueryParameter

// Value implements driver.Valuer interface
func (p JSONParameters) Value() (driver.Value, error) {
	if p == nil {
		return nil, nil
	}
	return json.Marshal(p)
}

// Scan implements sql.Scanner interface
func (p *JSONParameters) Scan(value interface{}) error {
	if value == nil {
		*p = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to scan JSONParameters")
	}

	if len(bytes) == 0 {
		*p = nil
		return nil
	}

	return json.Unmarshal(bytes, p)
}

// Query is the main Query model with UUID primary key
type Query struct {
	ID           string         `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID       uint           `gorm:"index;not null" json:"user_id"`
	Name         string         `gorm:"size:100;not null" json:"name" binding:"required,min=1,max=100"`
	Description  string         `gorm:"size:500" json:"description"`
	DataSourceID string         `gorm:"type:uuid;not null" json:"data_source_id" binding:"required"`
	SQLTemplate  string         `gorm:"type:text;not null" json:"sql_template" binding:"required"`
	Parameters   JSONParameters `gorm:"type:jsonb" json:"parameters"`
	Status       string         `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	User       User       `gorm:"foreignKey:UserID" json:"-"`
	DataSource DataSource `gorm:"foreignKey:DataSourceID" json:"data_source,omitempty"`
}

func (Query) TableName() string {
	return "queries"
}

// QueryParameter represents a parameter definition for a query
type QueryParameter struct {
	Name        string      `json:"name"`
	Type        string      `json:"type"` // string, number, boolean, date
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
	Description string      `json:"description"`
}

// GetParameters returns the parameters slice
func (q *Query) GetParameters() ([]QueryParameter, error) {
	if q.Parameters == nil {
		return nil, nil
	}
	return []QueryParameter(q.Parameters), nil
}

// SetParameters sets the parameters
func (q *Query) SetParameters(params []QueryParameter) error {
	q.Parameters = JSONParameters(params)
	return nil
}

// CreateQueryRequest represents the request body for creating a query
type CreateQueryRequest struct {
	Name         string           `json:"name" binding:"required,min=1,max=100"`
	Description  string           `json:"description" binding:"max=500"`
	DataSourceID string           `json:"data_source_id" binding:"required,uuid"`
	SQLTemplate  string           `json:"sql_template" binding:"required"`
	Parameters   []QueryParameter `json:"parameters"`
}

// UpdateQueryRequest represents the request body for updating a query
type UpdateQueryRequest struct {
	Name         *string          `json:"name" binding:"omitempty,min=1,max=100"`
	Description  *string          `json:"description" binding:"omitempty,max=500"`
	DataSourceID *string          `json:"data_source_id" binding:"omitempty,uuid"`
	SQLTemplate  *string          `json:"sql_template"`
	Parameters   []QueryParameter `json:"parameters"`
	Status       *string          `json:"status" binding:"omitempty,oneof=active inactive"`
}

// QueryResponse represents the response body for a query
type QueryResponse struct {
	ID           string           `json:"id"`
	UserID       uint             `json:"user_id"`
	Name         string           `json:"name"`
	Description  string           `json:"description"`
	DataSourceID string           `json:"data_source_id"`
	SQLTemplate  string           `json:"sql_template"`
	Parameters   []QueryParameter `json:"parameters"`
	Status       string           `json:"status"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	DataSource   *DataSourceInfo  `json:"data_source,omitempty"`
}

// DataSourceInfo represents minimal datasource info in query response
type DataSourceInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// ToResponse converts Query to QueryResponse
func (q *Query) ToResponse() *QueryResponse {
	params, _ := q.GetParameters()
	if params == nil {
		params = []QueryParameter{}
	}

	resp := &QueryResponse{
		ID:           q.ID,
		UserID:       q.UserID,
		Name:         q.Name,
		Description:  q.Description,
		DataSourceID: q.DataSourceID,
		SQLTemplate:  q.SQLTemplate,
		Parameters:   params,
		Status:       q.Status,
		CreatedAt:    q.CreatedAt,
		UpdatedAt:    q.UpdatedAt,
	}

	// Include DataSource info if loaded
	if q.DataSource.ID != "" {
		resp.DataSource = &DataSourceInfo{
			ID:   q.DataSource.ID,
			Name: q.DataSource.Name,
			Type: q.DataSource.Type,
		}
	}

	return resp
}

// ExecuteQueryRequest represents the request body for executing a query
type ExecuteQueryRequest struct {
	Parameters map[string]interface{} `json:"parameters"`
}

// ExecuteQueryResponse represents the response of a query execution
type ExecuteQueryResponse struct {
	Columns         []string                 `json:"columns"`
	Data            []map[string]interface{} `json:"data"`
	RowCount        int                      `json:"row_count"`
	ExecutionTimeMs int64                    `json:"execution_time_ms"`
}

// ValidateSQLRequest represents the request body for SQL validation
type ValidateSQLRequest struct {
	SQLTemplate string `json:"sql_template" binding:"required"`
}

// ValidateSQLResponse represents the response of SQL validation
type ValidateSQLResponse struct {
	Valid      bool             `json:"valid"`
	Message    string           `json:"message"`
	Parameters []QueryParameter `json:"parameters,omitempty"`
}

// QueryExecution represents a query execution history record
type QueryExecution struct {
	ID              string    `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID          uint      `gorm:"index;not null" json:"user_id"`
	QueryID         string    `gorm:"type:uuid;not null;index" json:"query_id"`
	Parameters      string    `gorm:"type:jsonb" json:"parameters"`
	RowCount        int       `json:"row_count"`
	ExecutionTimeMs int64     `json:"execution_time_ms"`
	Status          string    `gorm:"size:20;not null" json:"status"` // success, error
	ErrorMessage    string    `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt       time.Time `json:"created_at"`

	Query Query `gorm:"foreignKey:QueryID" json:"query,omitempty"`
}

func (QueryExecution) TableName() string {
	return "query_executions"
}

// QueryExecutionResponse represents a query execution history item
type QueryExecutionResponse struct {
	ID              string                 `json:"id"`
	QueryID         string                 `json:"query_id"`
	QueryName       string                 `json:"query_name,omitempty"`
	Parameters      map[string]interface{} `json:"parameters"`
	RowCount        int                    `json:"row_count"`
	ExecutionTimeMs int64                  `json:"execution_time_ms"`
	Status          string                 `json:"status"`
	ErrorMessage    string                 `json:"error_message,omitempty"`
	CreatedAt       time.Time              `json:"created_at"`
}
