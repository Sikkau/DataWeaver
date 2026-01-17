package model

import "time"

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username" binding:"required" example:"admin"`
	Password string `json:"password" binding:"required" example:"password123"`
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50" example:"newuser"`
	Email    string `json:"email" binding:"required,email,max=100" example:"user@example.com"`
	Password string `json:"password" binding:"required,min=6,max=100" example:"password123"`
}

// AuthResponse represents an authentication response with token
type AuthResponse struct {
	Token     string    `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	ExpiresAt time.Time `json:"expires_at" example:"2024-01-01T00:00:00Z"`
	User      UserInfo  `json:"user"`
}

// UserInfo represents basic user information
type UserInfo struct {
	ID       uint   `json:"id" example:"1"`
	Username string `json:"username" example:"admin"`
	Email    string `json:"email" example:"admin@example.com"`
	IsActive bool   `json:"is_active" example:"true"`
}
