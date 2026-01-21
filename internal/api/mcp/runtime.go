package mcp

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/service"
	"github.com/yourusername/dataweaver/pkg/analytics"
)

// RuntimeHandler handles MCP protocol requests
type RuntimeHandler struct {
	mcpService   service.McpServerService
	rateLimiters map[string]*analytics.RateLimiter
	mu           sync.RWMutex
}

// NewRuntimeHandler creates a new MCP runtime handler
func NewRuntimeHandler(mcpService service.McpServerService) *RuntimeHandler {
	return &RuntimeHandler{
		mcpService:   mcpService,
		rateLimiters: make(map[string]*analytics.RateLimiter),
	}
}

// HandleMcpRequest handles incoming MCP protocol requests
// @Summary Handle MCP request
// @Description Process MCP protocol requests (tools/list, tools/call)
// @Tags mcp-runtime
// @Accept json
// @Produce json
// @Param serverId path string true "Server ID"
// @Param X-API-Key header string true "API Key"
// @Param request body model.McpRequest true "MCP Request"
// @Success 200 {object} model.McpResponse
// @Failure 400 {object} model.McpResponse
// @Failure 401 {object} model.McpResponse
// @Failure 404 {object} model.McpResponse
// @Failure 429 {object} model.McpResponse
// @Router /mcp/{serverId} [post]
func (h *RuntimeHandler) HandleMcpRequest(c *gin.Context) {
	serverID := c.Param("serverId")

	// Get API key from header
	apiKey := c.GetHeader("X-API-Key")
	if apiKey == "" {
		// Also check Authorization header
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			apiKey = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if apiKey == "" {
		h.sendError(c, nil, model.McpErrorCodeInvalidRequest, "Missing API key")
		return
	}

	// Validate API key and get server
	server, err := h.mcpService.GetServerByApiKey(apiKey)
	if err != nil {
		h.sendError(c, nil, model.McpErrorCodeInvalidRequest, "Invalid API key")
		return
	}

	// Verify server ID matches
	if server.ID != serverID {
		h.sendError(c, nil, model.McpErrorCodeInvalidRequest, "Server ID mismatch")
		return
	}

	// Check rate limit
	if !h.checkRateLimit(serverID, server.Config.RateLimitPerMin) {
		h.sendError(c, nil, model.McpErrorCodeInternalError, "Rate limit exceeded")
		c.Status(http.StatusTooManyRequests)
		return
	}

	// Parse MCP request
	var req model.McpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.sendError(c, nil, model.McpErrorCodeParseError, "Invalid JSON")
		return
	}

	// Validate JSON-RPC version
	if req.JsonRPC != "2.0" {
		h.sendError(c, req.ID, model.McpErrorCodeInvalidRequest, "Invalid JSON-RPC version")
		return
	}

	// Route to appropriate handler
	switch req.Method {
	case "tools/list":
		h.handleToolsList(c, server, &req)
	case "tools/call":
		h.handleToolsCall(c, server, &req)
	case "initialize":
		h.handleInitialize(c, server, &req)
	case "ping":
		h.handlePing(c, &req)
	default:
		h.sendError(c, req.ID, model.McpErrorCodeMethodNotFound, "Method not found: "+req.Method)
	}
}

// handleInitialize handles the initialize method
func (h *RuntimeHandler) handleInitialize(c *gin.Context, server *model.McpServer, req *model.McpRequest) {
	result := map[string]interface{}{
		"protocolVersion": "2024-11-05",
		"capabilities": map[string]interface{}{
			"tools": map[string]interface{}{},
		},
		"serverInfo": map[string]interface{}{
			"name":    "dataweaver-" + server.Name,
			"version": server.Version,
		},
	}

	h.sendResult(c, req.ID, result)
}

// handlePing handles the ping method
func (h *RuntimeHandler) handlePing(c *gin.Context, req *model.McpRequest) {
	h.sendResult(c, req.ID, map[string]interface{}{})
}

// handleToolsList handles the tools/list method
func (h *RuntimeHandler) handleToolsList(c *gin.Context, server *model.McpServer, req *model.McpRequest) {
	tools, err := h.mcpService.GetServerTools(server.ID)
	if err != nil {
		h.sendError(c, req.ID, model.McpErrorCodeInternalError, err.Error())
		return
	}

	// Convert to MCP tool definitions
	toolDefs := make([]model.McpToolDefinition, len(tools))
	for i, tool := range tools {
		toolDefs[i] = model.McpToolDefinition{
			Name:        tool.Name,
			Description: tool.Description,
			InputSchema: tool.ToMCPDefinition().InputSchema,
		}
	}

	result := map[string]interface{}{
		"tools": toolDefs,
	}

	h.sendResult(c, req.ID, result)
}

// handleToolsCall handles the tools/call method
func (h *RuntimeHandler) handleToolsCall(c *gin.Context, server *model.McpServer, req *model.McpRequest) {
	// Parse params
	paramsBytes, err := json.Marshal(req.Params)
	if err != nil {
		h.sendError(c, req.ID, model.McpErrorCodeInvalidParams, "Invalid params")
		return
	}

	var callParams model.McpToolCallParams
	if err := json.Unmarshal(paramsBytes, &callParams); err != nil {
		h.sendError(c, req.ID, model.McpErrorCodeInvalidParams, "Invalid params format")
		return
	}

	if callParams.Name == "" {
		h.sendError(c, req.ID, model.McpErrorCodeInvalidParams, "Missing tool name")
		return
	}

	// Execute tool
	result, log, err := h.mcpService.ExecuteTool(server.ID, callParams.Name, callParams.Arguments)
	if err != nil {
		h.sendError(c, req.ID, model.McpErrorCodeInternalError, err.Error())
		return
	}

	// Log the call asynchronously
	if log != nil {
		go func() {
			_ = h.mcpService.LogToolCall(log)
		}()
	}

	h.sendResult(c, req.ID, result)
}

// checkRateLimit checks if the request is within rate limit
func (h *RuntimeHandler) checkRateLimit(serverID string, limitPerMin int) bool {
	if limitPerMin <= 0 {
		return true // No limit
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	limiter, exists := h.rateLimiters[serverID]
	if !exists {
		limiter = analytics.NewRateLimiter(limitPerMin, time.Minute)
		h.rateLimiters[serverID] = limiter
	}

	return limiter.Allow(serverID)
}

// sendResult sends a successful MCP response
func (h *RuntimeHandler) sendResult(c *gin.Context, id interface{}, result interface{}) {
	c.JSON(http.StatusOK, model.McpResponse{
		JsonRPC: "2.0",
		ID:      id,
		Result:  result,
	})
}

// sendError sends an MCP error response
func (h *RuntimeHandler) sendError(c *gin.Context, id interface{}, code int, message string) {
	c.JSON(http.StatusOK, model.McpResponse{
		JsonRPC: "2.0",
		ID:      id,
		Error: &model.McpError{
			Code:    code,
			Message: message,
		},
	})
}

// SSE Support for MCP Streaming

// HandleMcpSSE handles Server-Sent Events for MCP streaming
// @Summary Handle MCP SSE connection
// @Description Establish SSE connection for MCP streaming
// @Tags mcp-runtime
// @Produce text/event-stream
// @Param serverId path string true "Server ID"
// @Param X-API-Key header string true "API Key"
// @Router /mcp/{serverId}/sse [get]
func (h *RuntimeHandler) HandleMcpSSE(c *gin.Context) {
	serverID := c.Param("serverId")

	// Get API key from header or query
	apiKey := c.GetHeader("X-API-Key")
	if apiKey == "" {
		apiKey = c.Query("api_key")
	}

	if apiKey == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing API key"})
		return
	}

	// Validate API key
	server, err := h.mcpService.GetServerByApiKey(apiKey)
	if err != nil || server.ID != serverID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// Send initial connection event
	c.SSEvent("connected", map[string]string{
		"server_id": serverID,
		"version":   server.Version,
	})
	c.Writer.Flush()

	// Keep connection alive with heartbeat
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	clientGone := c.Request.Context().Done()

	for {
		select {
		case <-clientGone:
			return
		case <-ticker.C:
			c.SSEvent("heartbeat", map[string]int64{"timestamp": time.Now().Unix()})
			c.Writer.Flush()
		}
	}
}

// Health check endpoint for MCP server
// @Summary MCP Server health check
// @Description Check if MCP server is healthy
// @Tags mcp-runtime
// @Produce json
// @Param serverId path string true "Server ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /mcp/{serverId}/health [get]
func (h *RuntimeHandler) HandleHealthCheck(c *gin.Context) {
	serverID := c.Param("serverId")

	// Try to get server (without auth for health check)
	tools, err := h.mcpService.GetServerTools(serverID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Server not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "healthy",
		"server_id":   serverID,
		"tools_count": len(tools),
		"timestamp":   time.Now().Unix(),
	})
}
