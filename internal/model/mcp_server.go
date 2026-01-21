package model

import (
	"crypto/rand"
	"database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// StringArray is a custom type for storing string arrays in the database
type StringArray []string

// Value implements driver.Valuer interface
func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}

// Scan implements sql.Scanner interface
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to scan StringArray")
	}

	if len(bytes) == 0 {
		*s = nil
		return nil
	}

	return json.Unmarshal(bytes, s)
}

// ServerConfig represents MCP server configuration
type ServerConfig struct {
	TimeoutSeconds  int    `json:"timeout_seconds"`
	RateLimitPerMin int    `json:"rate_limit_per_min"`
	LogLevel        string `json:"log_level"`
	EnableCaching   bool   `json:"enable_caching"`
}

// ServerConfigJSON is a custom type for storing ServerConfig in the database
type ServerConfigJSON struct {
	ServerConfig
}

// Value implements driver.Valuer interface
func (c ServerConfigJSON) Value() (driver.Value, error) {
	return json.Marshal(c.ServerConfig)
}

// Scan implements sql.Scanner interface
func (c *ServerConfigJSON) Scan(value interface{}) error {
	if value == nil {
		c.ServerConfig = ServerConfig{}
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to scan ServerConfigJSON")
	}

	if len(bytes) == 0 {
		c.ServerConfig = ServerConfig{}
		return nil
	}

	return json.Unmarshal(bytes, &c.ServerConfig)
}

// McpServerStatus represents the status of an MCP server
type McpServerStatus string

const (
	McpServerStatusDraft     McpServerStatus = "draft"
	McpServerStatusPublished McpServerStatus = "published"
	McpServerStatusArchived  McpServerStatus = "archived"
)

// McpServer represents an MCP server instance
type McpServer struct {
	ID          string           `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uint             `gorm:"index;not null" json:"user_id"`
	Name        string           `gorm:"size:100;not null" json:"name"`
	Description string           `gorm:"type:text" json:"description"`
	Version     string           `gorm:"size:20;default:'1.0.0'" json:"version"`
	ToolIDs     StringArray      `gorm:"type:jsonb" json:"tool_ids"`
	Config      ServerConfigJSON `gorm:"type:jsonb" json:"config"`
	Status      string           `gorm:"size:20;default:'draft'" json:"status"`
	Endpoint    string           `gorm:"size:500" json:"endpoint"`
	ApiKey      string           `gorm:"size:100" json:"api_key"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `gorm:"index" json:"-"`

	// Preloaded relationships
	Tools []ToolV2 `gorm:"-" json:"tools,omitempty"`
}

func (McpServer) TableName() string {
	return "mcp_servers"
}

// GenerateApiKey generates a new API key for the MCP server
func GenerateApiKey() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "sk_live_" + hex.EncodeToString(bytes), nil
}

// GenerateEndpoint generates the endpoint URL for the MCP server
func GenerateEndpoint(serverID, baseURL string) string {
	return fmt.Sprintf("%s/mcp/%s", baseURL, serverID)
}

// McpLogStatus represents the status of an MCP log entry
type McpLogStatus string

const (
	McpLogStatusSuccess McpLogStatus = "success"
	McpLogStatusError   McpLogStatus = "error"
)

// McpLogParameters is a custom type for storing log parameters
type McpLogParameters map[string]interface{}

// Value implements driver.Valuer interface
func (p McpLogParameters) Value() (driver.Value, error) {
	if p == nil {
		return nil, nil
	}
	return json.Marshal(p)
}

// Scan implements sql.Scanner interface
func (p *McpLogParameters) Scan(value interface{}) error {
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
		return errors.New("failed to scan McpLogParameters")
	}

	if len(bytes) == 0 {
		*p = nil
		return nil
	}

	return json.Unmarshal(bytes, p)
}

// McpLog represents a log entry for MCP tool calls
type McpLog struct {
	ID             string           `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	McpServerID    string           `gorm:"type:uuid;not null;index" json:"mcp_server_id"`
	ToolID         string           `gorm:"type:uuid" json:"tool_id"`
	ToolName       string           `gorm:"size:100" json:"tool_name"`
	Parameters     McpLogParameters `gorm:"type:jsonb" json:"parameters"`
	ResponseTimeMs int64            `gorm:"default:0" json:"response_time_ms"`
	Status         string           `gorm:"size:20" json:"status"`
	ErrorMessage   string           `gorm:"type:text" json:"error_message"`
	RowCount       int              `gorm:"default:0" json:"row_count"`
	Timestamp      time.Time        `gorm:"index" json:"timestamp"`
}

func (McpLog) TableName() string {
	return "mcp_logs"
}

// Request/Response DTOs

// CreateMcpServerRequest represents the request body for creating an MCP server
type CreateMcpServerRequest struct {
	Name        string       `json:"name" binding:"required,min=1,max=100"`
	Description string       `json:"description"`
	ToolIDs     []string     `json:"tool_ids"`
	Config      ServerConfig `json:"config"`
}

// UpdateMcpServerRequest represents the request body for updating an MCP server
type UpdateMcpServerRequest struct {
	Name        *string       `json:"name" binding:"omitempty,min=1,max=100"`
	Description *string       `json:"description"`
	ToolIDs     []string      `json:"tool_ids"`
	Config      *ServerConfig `json:"config"`
	Status      *string       `json:"status" binding:"omitempty,oneof=draft published archived"`
}

// McpServerResponse represents the response body for an MCP server
type McpServerResponse struct {
	ID          string       `json:"id"`
	UserID      uint         `json:"user_id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Version     string       `json:"version"`
	ToolIDs     []string     `json:"tool_ids"`
	Config      ServerConfig `json:"config"`
	Status      string       `json:"status"`
	Endpoint    string       `json:"endpoint,omitempty"`
	ApiKey      string       `json:"api_key,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	Tools       []ToolInfo   `json:"tools,omitempty"`
}

// ToolInfo represents minimal tool info in MCP server response
type ToolInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
}

// ToResponse converts McpServer to McpServerResponse
func (s *McpServer) ToResponse() *McpServerResponse {
	toolIDs := []string(s.ToolIDs)
	if toolIDs == nil {
		toolIDs = []string{}
	}

	resp := &McpServerResponse{
		ID:          s.ID,
		UserID:      s.UserID,
		Name:        s.Name,
		Description: s.Description,
		Version:     s.Version,
		ToolIDs:     toolIDs,
		Config:      s.Config.ServerConfig,
		Status:      s.Status,
		Endpoint:    s.Endpoint,
		CreatedAt:   s.CreatedAt,
		UpdatedAt:   s.UpdatedAt,
	}

	// Only include API key if published
	if s.Status == string(McpServerStatusPublished) {
		resp.ApiKey = s.ApiKey
	}

	// Include tool info if loaded
	if len(s.Tools) > 0 {
		resp.Tools = make([]ToolInfo, len(s.Tools))
		for i, t := range s.Tools {
			resp.Tools[i] = ToolInfo{
				ID:          t.ID,
				Name:        t.Name,
				DisplayName: t.DisplayName,
				Description: t.Description,
			}
		}
	}

	return resp
}

// PublishMcpServerResponse represents the response after publishing an MCP server
type PublishMcpServerResponse struct {
	Server    *McpServerResponse     `json:"server"`
	McpConfig map[string]interface{} `json:"mcp_config"`
}

// McpConfigOutput represents the MCP configuration file format
type McpConfigOutput struct {
	McpServers map[string]McpServerConfig `json:"mcpServers"`
}

// McpServerConfig represents a single MCP server configuration
type McpServerConfig struct {
	Command string            `json:"command"`
	Args    []string          `json:"args"`
	Env     map[string]string `json:"env"`
}

// McpLogResponse represents the response body for an MCP log entry
type McpLogResponse struct {
	ID             string                 `json:"id"`
	McpServerID    string                 `json:"mcp_server_id"`
	ToolID         string                 `json:"tool_id"`
	ToolName       string                 `json:"tool_name"`
	Parameters     map[string]interface{} `json:"parameters"`
	ResponseTimeMs int64                  `json:"response_time_ms"`
	Status         string                 `json:"status"`
	ErrorMessage   string                 `json:"error_message,omitempty"`
	RowCount       int                    `json:"row_count"`
	Timestamp      time.Time              `json:"timestamp"`
}

// ToResponse converts McpLog to McpLogResponse
func (l *McpLog) ToResponse() *McpLogResponse {
	params := map[string]interface{}(l.Parameters)
	if params == nil {
		params = map[string]interface{}{}
	}

	return &McpLogResponse{
		ID:             l.ID,
		McpServerID:    l.McpServerID,
		ToolID:         l.ToolID,
		ToolName:       l.ToolName,
		Parameters:     params,
		ResponseTimeMs: l.ResponseTimeMs,
		Status:         l.Status,
		ErrorMessage:   l.ErrorMessage,
		RowCount:       l.RowCount,
		Timestamp:      l.Timestamp,
	}
}

// MCP Protocol Types

// McpRequest represents an incoming MCP protocol request
type McpRequest struct {
	JsonRPC string                 `json:"jsonrpc"`
	ID      interface{}            `json:"id"`
	Method  string                 `json:"method"`
	Params  map[string]interface{} `json:"params,omitempty"`
}

// McpResponse represents an MCP protocol response
type McpResponse struct {
	JsonRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *McpError   `json:"error,omitempty"`
}

// McpError represents an MCP protocol error
type McpError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// MCP Error Codes
const (
	McpErrorCodeParseError     = -32700
	McpErrorCodeInvalidRequest = -32600
	McpErrorCodeMethodNotFound = -32601
	McpErrorCodeInvalidParams  = -32602
	McpErrorCodeInternalError  = -32603
)

// McpToolCallParams represents parameters for tools/call method
type McpToolCallParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// McpToolCallResult represents the result of a tool call
type McpToolCallResult struct {
	Content []McpContent `json:"content"`
	IsError bool         `json:"isError,omitempty"`
}

// McpContent represents content in MCP response
type McpContent struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

// McpToolDefinition represents a tool definition in MCP format
type McpToolDefinition struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"inputSchema"`
}
