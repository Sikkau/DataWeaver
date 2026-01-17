package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/response"
	"github.com/yourusername/dataweaver/internal/service"
)

// Handler handles authentication API requests
type Handler struct {
	authService service.AuthService
}

// NewHandler creates a new auth Handler
func NewHandler(authService service.AuthService) *Handler {
	return &Handler{
		authService: authService,
	}
}

// Login godoc
// @Summary User login
// @Description Authenticate user and return JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body model.LoginRequest true "Login credentials"
// @Success 200 {object} response.Response{data=model.AuthResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	authResp, err := h.authService.Login(&req)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			response.Unauthorized(c, "Invalid username or password")
			return
		}
		if err == service.ErrUserNotActive {
			response.Forbidden(c, "User account is not active")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, authResp)
}

// Register godoc
// @Summary User registration
// @Description Register a new user account
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body model.RegisterRequest true "Registration information"
// @Success 201 {object} response.Response{data=model.AuthResponse}
// @Failure 400 {object} response.Response
// @Failure 409 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	authResp, err := h.authService.Register(&req)
	if err != nil {
		if err == service.ErrUserExists {
			response.Error(c, 409, "User with this username or email already exists")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Created(c, authResp)
}
