package model

import (
	"time"

	"gorm.io/gorm"
)

// DataSourceType represents the supported database types
type DataSourceType string

const (
	DataSourceTypeMySQL      DataSourceType = "mysql"
	DataSourceTypePostgreSQL DataSourceType = "postgresql"
	DataSourceTypeSQLServer  DataSourceType = "sqlserver"
	DataSourceTypeOracle     DataSourceType = "oracle"
)

// DataSourceV2 is the enhanced DataSource model with UUID primary key
type DataSourceV2 struct {
	ID          string         `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uint           `gorm:"index;not null" json:"user_id"`
	Name        string         `gorm:"size:100;not null" json:"name" binding:"required,min=1,max=100"`
	Description string         `gorm:"size:500" json:"description"`
	Type        string         `gorm:"size:20;not null" json:"type" binding:"required,oneof=mysql postgresql sqlserver oracle"`
	Host        string         `gorm:"size:255;not null" json:"host" binding:"required"`
	Port        int            `gorm:"not null" json:"port" binding:"required,min=1,max=65535"`
	Database    string         `gorm:"size:100;not null" json:"database" binding:"required"`
	Username    string         `gorm:"size:100;not null" json:"username" binding:"required"`
	Password    string         `gorm:"size:500;not null" json:"-"` // encrypted, not returned in JSON
	SSLMode     string         `gorm:"size:20;default:'disable'" json:"ssl_mode"`
	Status      string         `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (DataSourceV2) TableName() string {
	return "data_sources_v2"
}

// CreateDataSourceRequest represents the request body for creating a datasource
type CreateDataSourceRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100"`
	Description string `json:"description" binding:"max=500"`
	Type        string `json:"type" binding:"required,oneof=mysql postgresql sqlserver oracle"`
	Host        string `json:"host" binding:"required"`
	Port        int    `json:"port" binding:"required,min=1,max=65535"`
	Database    string `json:"database" binding:"required"`
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password" binding:"required"`
	SSLMode     string `json:"ssl_mode"`
}

// UpdateDataSourceRequest represents the request body for updating a datasource
type UpdateDataSourceRequest struct {
	Name        *string `json:"name" binding:"omitempty,min=1,max=100"`
	Description *string `json:"description" binding:"omitempty,max=500"`
	Type        *string `json:"type" binding:"omitempty,oneof=mysql postgresql sqlserver oracle"`
	Host        *string `json:"host"`
	Port        *int    `json:"port" binding:"omitempty,min=1,max=65535"`
	Database    *string `json:"database"`
	Username    *string `json:"username"`
	Password    *string `json:"password"`
	SSLMode     *string `json:"ssl_mode"`
	Status      *string `json:"status" binding:"omitempty,oneof=active inactive"`
}

// DataSourceResponse represents the response body for a datasource (without password)
type DataSourceResponse struct {
	ID          string    `json:"id"`
	UserID      uint      `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	Host        string    `json:"host"`
	Port        int       `json:"port"`
	Database    string    `json:"database"`
	Username    string    `json:"username"`
	SSLMode     string    `json:"ssl_mode"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ToResponse converts DataSourceV2 to DataSourceResponse
func (ds *DataSourceV2) ToResponse() *DataSourceResponse {
	return &DataSourceResponse{
		ID:          ds.ID,
		UserID:      ds.UserID,
		Name:        ds.Name,
		Description: ds.Description,
		Type:        ds.Type,
		Host:        ds.Host,
		Port:        ds.Port,
		Database:    ds.Database,
		Username:    ds.Username,
		SSLMode:     ds.SSLMode,
		Status:      ds.Status,
		CreatedAt:   ds.CreatedAt,
		UpdatedAt:   ds.UpdatedAt,
	}
}

// TestConnectionResult represents the result of a connection test
type TestConnectionResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Latency int64  `json:"latency_ms"`
}

// TableInfoResponse represents table information from a datasource
type TableInfoResponse struct {
	Name     string               `json:"name"`
	Schema   string               `json:"schema"`
	RowCount int64                `json:"row_count,omitempty"`
	Columns  []ColumnInfoResponse `json:"columns,omitempty"`
}

// ColumnInfoResponse represents column information
type ColumnInfoResponse struct {
	Name       string `json:"name"`
	Type       string `json:"type"`
	Nullable   bool   `json:"nullable"`
	PrimaryKey bool   `json:"primary_key"`
}
