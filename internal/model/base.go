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

// Note: DataSource, Query, and Tool models are defined in their respective files
// with UUID primary keys (datasource.go, query.go, tool.go)
