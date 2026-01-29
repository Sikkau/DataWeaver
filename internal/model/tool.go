package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// ToolParameters is a custom type for storing tool parameters in the database
type ToolParameters []ToolParameter

// Value implements driver.Valuer interface
func (p ToolParameters) Value() (driver.Value, error) {
	if p == nil {
		return nil, nil
	}
	return json.Marshal(p)
}

// Scan implements sql.Scanner interface
func (p *ToolParameters) Scan(value interface{}) error {
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
		return errors.New("failed to scan ToolParameters")
	}

	if len(bytes) == 0 {
		*p = nil
		return nil
	}

	return json.Unmarshal(bytes, p)
}

// OutputSchema is a custom type for storing output schema in the database
type OutputSchema map[string]interface{}

// Value implements driver.Valuer interface
func (s OutputSchema) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}

// Scan implements sql.Scanner interface
func (s *OutputSchema) Scan(value interface{}) error {
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
		return errors.New("failed to scan OutputSchema")
	}

	if len(bytes) == 0 {
		*s = nil
		return nil
	}

	return json.Unmarshal(bytes, s)
}

// Tool is the main Tool model with UUID primary key
type Tool struct {
	ID           string         `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID       uint           `gorm:"index;not null" json:"user_id"`
	Name         string         `gorm:"size:100;not null" json:"name" binding:"required"`
	DisplayName  string         `gorm:"size:200;not null" json:"display_name" binding:"required"`
	Description  string         `gorm:"type:text;not null" json:"description"`
	QueryID      string         `gorm:"type:uuid;not null" json:"query_id"`
	Parameters   ToolParameters `gorm:"type:jsonb" json:"parameters"`
	OutputSchema OutputSchema   `gorm:"type:jsonb" json:"output_schema"`
	Version      int            `gorm:"default:1" json:"version"`
	McpServerID  *string        `gorm:"type:uuid" json:"mcp_server_id,omitempty"`
	Status       string         `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Query Query `gorm:"foreignKey:QueryID" json:"query,omitempty"`
}

func (Tool) TableName() string {
	return "tools"
}

// ToolParameter represents a parameter definition for a tool
type ToolParameter struct {
	Name        string      `json:"name"`
	Type        string      `json:"type"` // string, number, boolean, date, integer
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
	Description string      `json:"description"`
	Format      string      `json:"format,omitempty"` // date, date-time, email, etc.
}

// CreateToolRequest represents the request body for creating a tool
type CreateToolRequest struct {
	Name         string                 `json:"name" binding:"required,min=1,max=100"`
	DisplayName  string                 `json:"display_name" binding:"required,min=1,max=200"`
	Description  string                 `json:"description" binding:"required"`
	QueryID      string                 `json:"query_id" binding:"required,uuid"`
	Parameters   []ToolParameter        `json:"parameters"`
	OutputSchema map[string]interface{} `json:"output_schema"`
}

// CreateToolFromQueryRequest represents the request body for creating a tool from a query
type CreateToolFromQueryRequest struct {
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	CustomName  string `json:"custom_name"`
}

// UpdateToolRequest represents the request body for updating a tool
type UpdateToolRequest struct {
	Name         *string                `json:"name" binding:"omitempty,min=1,max=100"`
	DisplayName  *string                `json:"display_name" binding:"omitempty,min=1,max=200"`
	Description  *string                `json:"description"`
	QueryID      *string                `json:"query_id" binding:"omitempty,uuid"`
	Parameters   []ToolParameter        `json:"parameters"`
	OutputSchema map[string]interface{} `json:"output_schema"`
	Status       *string                `json:"status" binding:"omitempty,oneof=active inactive"`
}

// ToolResponse represents the response body for a tool
type ToolResponse struct {
	ID           string                 `json:"id"`
	UserID       uint                   `json:"user_id"`
	Name         string                 `json:"name"`
	DisplayName  string                 `json:"display_name"`
	Description  string                 `json:"description"`
	QueryID      string                 `json:"query_id"`
	Parameters   []ToolParameter        `json:"parameters"`
	OutputSchema map[string]interface{} `json:"output_schema"`
	Version      int                    `json:"version"`
	McpServerID  *string                `json:"mcp_server_id,omitempty"`
	Status       string                 `json:"status"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
	Query        *QueryInfo             `json:"query,omitempty"`
}

// QueryInfo represents minimal query info in tool response
type QueryInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// ToResponse converts Tool to ToolResponse
func (t *Tool) ToResponse() *ToolResponse {
	params := []ToolParameter(t.Parameters)
	if params == nil {
		params = []ToolParameter{}
	}

	outputSchema := map[string]interface{}(t.OutputSchema)
	if outputSchema == nil {
		outputSchema = map[string]interface{}{}
	}

	resp := &ToolResponse{
		ID:           t.ID,
		UserID:       t.UserID,
		Name:         t.Name,
		DisplayName:  t.DisplayName,
		Description:  t.Description,
		QueryID:      t.QueryID,
		Parameters:   params,
		OutputSchema: outputSchema,
		Version:      t.Version,
		McpServerID:  t.McpServerID,
		Status:       t.Status,
		CreatedAt:    t.CreatedAt,
		UpdatedAt:    t.UpdatedAt,
	}

	// Include Query info if loaded
	if t.Query.ID != "" {
		resp.Query = &QueryInfo{
			ID:          t.Query.ID,
			Name:        t.Query.Name,
			Description: t.Query.Description,
		}
	}

	return resp
}

// TestToolRequest represents the request body for testing a tool
type TestToolRequest struct {
	Parameters map[string]interface{} `json:"parameters"`
}

// TestToolResponse represents the response of a tool test
type TestToolResponse struct {
	Success         bool                     `json:"success"`
	Message         string                   `json:"message"`
	ExecutionTimeMs int64                    `json:"execution_time_ms"`
	RowCount        int                      `json:"row_count"`
	Data            []map[string]interface{} `json:"data,omitempty"`
	Columns         []string                 `json:"columns,omitempty"`
}

// MCPToolDefinition represents the MCP tool format for export
type MCPToolDefinition struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"input_schema"`
}

// ToMCPDefinition converts Tool to MCP tool definition format
func (t *Tool) ToMCPDefinition() *MCPToolDefinition {
	// Build input schema from parameters
	properties := make(map[string]interface{})
	required := make([]string, 0)

	for _, param := range t.Parameters {
		propDef := map[string]interface{}{
			"type":        convertToJSONSchemaType(param.Type),
			"description": param.Description,
		}

		if param.Format != "" {
			propDef["format"] = param.Format
		}

		if param.Default != nil {
			propDef["default"] = param.Default
		}

		properties[param.Name] = propDef

		if param.Required {
			required = append(required, param.Name)
		}
	}

	inputSchema := map[string]interface{}{
		"type":       "object",
		"properties": properties,
	}

	if len(required) > 0 {
		inputSchema["required"] = required
	}

	return &MCPToolDefinition{
		Name:        t.Name,
		Description: t.Description,
		InputSchema: inputSchema,
	}
}

// convertToJSONSchemaType converts internal type to JSON Schema type
func convertToJSONSchemaType(internalType string) string {
	switch internalType {
	case "number":
		return "number"
	case "integer":
		return "integer"
	case "boolean":
		return "boolean"
	case "date":
		return "string" // with format: date
	case "datetime":
		return "string" // with format: date-time
	default:
		return "string"
	}
}

// GenerateDescriptionRequest represents request for generating description
type GenerateDescriptionRequest struct {
	UseAI bool `json:"use_ai"`
}

// GenerateDescriptionResponse represents response for generated description
type GenerateDescriptionResponse struct {
	Description string `json:"description"`
	Generated   bool   `json:"generated"`
}
