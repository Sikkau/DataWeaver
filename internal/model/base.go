package model

import (
	"time"

	"gorm.io/gorm"
)

type BaseModel struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type User struct {
	BaseModel
	Username string `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email    string `gorm:"uniqueIndex;size:100;not null" json:"email"`
	Password string `gorm:"size:100;not null" json:"-"`
	IsActive bool   `gorm:"default:true" json:"is_active"`
}

func (User) TableName() string {
	return "users"
}

type DataSource struct {
	BaseModel
	UserID      uint   `gorm:"index;not null" json:"user_id"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Description string `gorm:"size:500" json:"description"`
	Type        string `gorm:"size:20;not null" json:"type"` // postgresql, mysql, mssql
	Host        string `gorm:"size:255;not null" json:"host"`
	Port        int    `gorm:"not null" json:"port"`
	Database    string `gorm:"size:100;not null" json:"database"`
	Username    string `gorm:"size:100;not null" json:"username"`
	Password    string `gorm:"size:500;not null" json:"-"` // encrypted
	SSLMode     string `gorm:"size:20" json:"ssl_mode"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`

	User    User    `gorm:"foreignKey:UserID" json:"-"`
	Queries []Query `gorm:"foreignKey:DataSourceID" json:"-"`
}

func (DataSource) TableName() string {
	return "data_sources"
}

type Query struct {
	BaseModel
	UserID       uint   `gorm:"index;not null" json:"user_id"`
	DataSourceID uint   `gorm:"index;not null" json:"data_source_id"`
	Name         string `gorm:"size:100;not null" json:"name"`
	Description  string `gorm:"size:500" json:"description"`
	SQL          string `gorm:"type:text;not null" json:"sql"`
	IsActive     bool   `gorm:"default:true" json:"is_active"`

	User       User       `gorm:"foreignKey:UserID" json:"-"`
	DataSource DataSource `gorm:"foreignKey:DataSourceID" json:"-"`
}

func (Query) TableName() string {
	return "queries"
}

type Tool struct {
	BaseModel
	UserID      uint   `gorm:"index;not null" json:"user_id"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Description string `gorm:"size:500" json:"description"`
	Type        string `gorm:"size:50;not null" json:"type"` // query, rest_api, etc.
	Config      string `gorm:"type:text" json:"config"`      // JSON config
	IsActive    bool   `gorm:"default:true" json:"is_active"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (Tool) TableName() string {
	return "tools"
}

type MCPServer struct {
	BaseModel
	UserID      uint   `gorm:"index;not null" json:"user_id"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Description string `gorm:"size:500" json:"description"`
	Port        int    `gorm:"not null" json:"port"`
	Status      string `gorm:"size:20;default:'stopped'" json:"status"` // running, stopped
	Config      string `gorm:"type:text" json:"config"`                 // JSON config
	IsActive    bool   `gorm:"default:true" json:"is_active"`

	User  User   `gorm:"foreignKey:UserID" json:"-"`
	Tools []Tool `gorm:"many2many:mcp_server_tools" json:"-"`
}

func (MCPServer) TableName() string {
	return "mcp_servers"
}
