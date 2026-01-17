package datasource

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/internal/response"
	"github.com/yourusername/dataweaver/internal/service"
)

// Handler handles datasource API requests
type Handler struct {
	service service.DataSourceService
}

// NewHandler creates a new Handler
func NewHandler(svc service.DataSourceService) *Handler {
	return &Handler{service: svc}
}

// getUserID extracts user ID from context (set by JWT middleware)
func getUserID(c *gin.Context) uint {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	if id, ok := userID.(uint); ok {
		return id
	}
	if id, ok := userID.(float64); ok {
		return uint(id)
	}
	return 0
}

// List godoc
// @Summary List datasources
// @Description Get a paginated list of datasources for the current user
// @Tags DataSources
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(20)
// @Param keyword query string false "Search keyword"
// @Security BearerAuth
// @Success 200 {object} response.PagedResponse{data=[]model.DataSourceResponse}
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources [get]
func (h *Handler) List(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	keyword := c.Query("keyword")

	datasources, total, err := h.service.List(userID, page, size, keyword)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessPaged(c, datasources, total, page, size)
}

// Create godoc
// @Summary Create datasource
// @Description Create a new datasource
// @Tags DataSources
// @Accept json
// @Produce json
// @Param request body model.CreateDataSourceRequest true "Datasource info"
// @Security BearerAuth
// @Success 201 {object} response.Response{data=model.DataSourceResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources [post]
func (h *Handler) Create(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req model.CreateDataSourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	ds, err := h.service.Create(userID, &req)
	if err != nil {
		if err == service.ErrInvalidDataSourceType {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Created(c, ds)
}

// Get godoc
// @Summary Get datasource
// @Description Get a datasource by ID
// @Tags DataSources
// @Accept json
// @Produce json
// @Param id path string true "Datasource ID"
// @Security BearerAuth
// @Success 200 {object} response.Response{data=model.DataSourceResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources/{id} [get]
func (h *Handler) Get(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "datasource id is required")
		return
	}

	ds, err := h.service.Get(id, userID)
	if err != nil {
		if err == repository.ErrDataSourceNotFound {
			response.NotFound(c, "datasource not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, ds)
}

// Update godoc
// @Summary Update datasource
// @Description Update a datasource by ID
// @Tags DataSources
// @Accept json
// @Produce json
// @Param id path string true "Datasource ID"
// @Param request body model.UpdateDataSourceRequest true "Datasource info"
// @Security BearerAuth
// @Success 200 {object} response.Response{data=model.DataSourceResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources/{id} [put]
func (h *Handler) Update(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "datasource id is required")
		return
	}

	var req model.UpdateDataSourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	ds, err := h.service.Update(id, userID, &req)
	if err != nil {
		if err == repository.ErrDataSourceNotFound {
			response.NotFound(c, "datasource not found")
			return
		}
		if err == service.ErrInvalidDataSourceType {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, ds)
}

// Delete godoc
// @Summary Delete datasource
// @Description Delete a datasource by ID
// @Tags DataSources
// @Accept json
// @Produce json
// @Param id path string true "Datasource ID"
// @Security BearerAuth
// @Success 204
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 409 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources/{id} [delete]
func (h *Handler) Delete(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "datasource id is required")
		return
	}

	err := h.service.Delete(id, userID)
	if err != nil {
		if err == repository.ErrDataSourceNotFound {
			response.NotFound(c, "datasource not found")
			return
		}
		if err == service.ErrDataSourceInUse {
			response.Error(c, 409, "datasource is in use by queries")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.NoContent(c)
}

// TestConnection godoc
// @Summary Test datasource connection
// @Description Test the connection to a datasource
// @Tags DataSources
// @Accept json
// @Produce json
// @Param id path string true "Datasource ID"
// @Security BearerAuth
// @Success 200 {object} response.Response{data=model.TestConnectionResult}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources/{id}/test [post]
func (h *Handler) TestConnection(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "datasource id is required")
		return
	}

	result, err := h.service.TestConnection(id, userID)
	if err != nil {
		if err == repository.ErrDataSourceNotFound {
			response.NotFound(c, "datasource not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// TestConnectionDirect godoc
// @Summary Test connection directly
// @Description Test database connection without saving
// @Tags DataSources
// @Accept json
// @Produce json
// @Param request body model.CreateDataSourceRequest true "Connection info"
// @Security BearerAuth
// @Success 200 {object} response.Response{data=model.TestConnectionResult}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources/test [post]
func (h *Handler) TestConnectionDirect(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req model.CreateDataSourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.service.TestConnectionDirect(&req)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, result)
}

// GetTables godoc
// @Summary Get datasource tables
// @Description Get the list of tables in a datasource
// @Tags DataSources
// @Accept json
// @Produce json
// @Param id path string true "Datasource ID"
// @Security BearerAuth
// @Success 200 {object} response.Response{data=[]model.TableInfoResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Failure 500 {object} response.Response
// @Router /api/v1/datasources/{id}/tables [get]
func (h *Handler) GetTables(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "datasource id is required")
		return
	}

	tables, err := h.service.GetTables(id, userID)
	if err != nil {
		if err == repository.ErrDataSourceNotFound {
			response.NotFound(c, "datasource not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}

	response.Success(c, tables)
}
