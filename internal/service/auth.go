package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/dataweaver/config"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserExists         = errors.New("user with this username or email already exists")
	ErrUserNotActive      = errors.New("user account is not active")
)

type AuthService interface {
	Login(req *model.LoginRequest) (*model.AuthResponse, error)
	Register(req *model.RegisterRequest) (*model.AuthResponse, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{
		userRepo: userRepo,
	}
}

func (s *authService) Login(req *model.LoginRequest) (*model.AuthResponse, error) {
	// Find user by username
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Check if user is active
	if !user.IsActive {
		return nil, ErrUserNotActive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Generate JWT token
	token, expiresAt, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User: model.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			IsActive: user.IsActive,
		},
	}, nil
}

func (s *authService) Register(req *model.RegisterRequest) (*model.AuthResponse, error) {
	// Check if user already exists
	if _, err := s.userRepo.FindByUsername(req.Username); err == nil {
		return nil, ErrUserExists
	}
	if _, err := s.userRepo.FindByEmail(req.Email); err == nil {
		return nil, ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &model.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		IsActive: true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Generate JWT token
	token, expiresAt, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User: model.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			IsActive: user.IsActive,
		},
	}, nil
}

func (s *authService) generateToken(user *model.User) (string, time.Time, error) {
	expiresAt := time.Now().Add(time.Duration(config.AppConfig.JWT.ExpireHours) * time.Hour)

	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWT.Secret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}
