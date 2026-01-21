package mcpserver

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/internal/response"
	"github.com/yourusername/dataweaver/internal/service"
)

// Handler handles MCP server API requests
type Handler struct {
	mcpService service.McpServerService
	baseURL    string
}

// NewHandler creates a new MCP server handler
func NewHandler(mcpService service.McpServerService, baseURL string) *Handler {
	return &Handler{
		mcpService: mcpService,
		baseURL:    baseURL,
	}
}

// getUserID extracts user ID from context
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

// Create creates a new MCP server
// @Summary Create MCP server
// @Description Create a new MCP server
// @Tags mcp-servers
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body model.CreateMcpServerRequest true "Create MCP server request"
// @Success 201 {object} response.Response{data=model.McpServerResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 409 {object} response.Response
// @Router /mcp-servers [post]
func (h *Handler) Create(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var req model.CreateMcpServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	server, err := h.mcpService.Create(userID, &req)
	if err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Created(c, server)
}

// List returns all MCP servers for the current user
// @Summary List MCP servers
// @Description Get all MCP servers for the current user with pagination
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(20)
// @Param keyword query string false "Search keyword"
// @Success 200 {object} response.PagedResponse{data=[]model.McpServerResponse}
// @Failure 401 {object} response.Response
// @Router /mcp-servers [get]
func (h *Handler) List(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	keyword := c.Query("keyword")

	servers, total, err := h.mcpService.List(userID, page, size, keyword)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	response.SuccessPaged(c, servers, total, page, size)
}

// Get returns an MCP server by ID
// @Summary Get MCP server
// @Description Get an MCP server by ID
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Success 200 {object} response.Response{data=model.McpServerResponse}
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id} [get]
func (h *Handler) Get(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")

	server, err := h.mcpService.Get(id, userID)
	if err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Success(c, server)
}

// Update updates an MCP server
// @Summary Update MCP server
// @Description Update an MCP server by ID
// @Tags mcp-servers
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Param request body model.UpdateMcpServerRequest true "Update MCP server request"
// @Success 200 {object} response.Response{data=model.McpServerResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id} [put]
func (h *Handler) Update(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")

	var req model.UpdateMcpServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	server, err := h.mcpService.Update(id, userID, &req)
	if err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Success(c, server)
}

// Delete deletes an MCP server
// @Summary Delete MCP server
// @Description Delete an MCP server by ID
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id} [delete]
func (h *Handler) Delete(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")

	if err := h.mcpService.Delete(id, userID); err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Success(c, nil)
}

// Publish publishes an MCP server
// @Summary Publish MCP server
// @Description Publish an MCP server to make it available
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Success 200 {object} response.Response{data=model.PublishMcpServerResponse}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id}/publish [post]
func (h *Handler) Publish(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")

	result, err := h.mcpService.Publish(id, userID, h.baseURL)
	if err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Success(c, result)
}

// Unpublish unpublishes an MCP server
// @Summary Unpublish MCP server
// @Description Unpublish an MCP server
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Success 200 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id}/unpublish [post]
func (h *Handler) Unpublish(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")

	if err := h.mcpService.Unpublish(id, userID); err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Success(c, nil)
}

// GetConfig returns the MCP configuration for a server
// @Summary Get MCP config
// @Description Get MCP configuration file for a server
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Success 200 {object} response.Response{data=model.McpConfigOutput}
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id}/config [get]
func (h *Handler) GetConfig(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")

	config, err := h.mcpService.GenerateMcpConfig(id, userID, h.baseURL)
	if err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Success(c, config)
}

// GetLogs returns logs for an MCP server
// @Summary Get MCP server logs
// @Description Get logs for an MCP server with pagination
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(20)
// @Success 200 {object} response.PagedResponse{data=[]model.McpLogResponse}
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id}/logs [get]
func (h *Handler) GetLogs(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	logs, total, err := h.mcpService.GetLogs(id, userID, page, size)
	if err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.SuccessPaged(c, logs, total, page, size)
}

// GetStatistics returns statistics for an MCP server
// @Summary Get MCP server statistics
// @Description Get statistics for an MCP server
// @Tags mcp-servers
// @Produce json
// @Security Bearer
// @Param id path string true "MCP Server ID"
// @Param days query int false "Number of days" default(30)
// @Success 200 {object} response.Response{data=analytics.Statistics}
// @Failure 401 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /mcp-servers/{id}/statistics [get]
func (h *Handler) GetStatistics(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "unauthorized")
		return
	}

	id := c.Param("id")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	stats, err := h.mcpService.GetStatistics(id, userID, days)
	if err != nil {
		handleMcpServerError(c, err)
		return
	}

	response.Success(c, stats)
}

// handleMcpServerError handles MCP server-specific errors
func handleMcpServerError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrMcpServerNotFound):
		response.NotFound(c, "MCP server not found")
	case errors.Is(err, repository.ErrMcpServerNameExists):
		response.Error(c, http.StatusConflict, "MCP server name already exists")
	case errors.Is(err, service.ErrMcpServerNameExists):
		response.Error(c, http.StatusConflict, "MCP server name already exists")
	case errors.Is(err, service.ErrServerNotPublished):
		response.BadRequest(c, "Server is not published")
	case errors.Is(err, service.ErrNoToolsToPublish):
		response.BadRequest(c, "At least one tool is required to publish")
	case errors.Is(err, service.ErrInvalidApiKey):
		response.Unauthorized(c, "Invalid API key")
	default:
		response.InternalError(c, err.Error())
	}
}
