package service

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/pkg/crypto"
	"github.com/yourusername/dataweaver/pkg/dbconnector"
	"github.com/yourusername/dataweaver/pkg/sqlparser"
)

var (
	ErrToolNotFound    = errors.New("tool not found")
	ErrToolNameExists  = errors.New("tool name already exists")
	ErrQueryRequired   = errors.New("query is required to create tool")
	ErrInvalidToolName = errors.New("invalid tool name format")
)

// ToolService handles business logic for tools
type ToolService interface {
	Create(userID uint, req *model.CreateToolRequest) (*model.ToolResponse, error)
	CreateFromQuery(userID uint, queryID string, req *model.CreateToolFromQueryRequest) (*model.ToolResponse, error)
	List(userID uint, page, size int, keyword string) ([]model.ToolResponse, int64, error)
	Get(id string, userID uint) (*model.ToolResponse, error)
	Update(id string, userID uint, req *model.UpdateToolRequest) (*model.ToolResponse, error)
	Delete(id string, userID uint) error
	TestTool(id string, userID uint, req *model.TestToolRequest) (*model.TestToolResponse, error)
	Export(id string, userID uint) (*model.MCPToolDefinition, error)
	ExportAll(userID uint) ([]*model.MCPToolDefinition, error)
	GenerateDescription(id string, userID uint, req *model.GenerateDescriptionRequest) (*model.GenerateDescriptionResponse, error)
}

type toolService struct {
	toolRepo  repository.ToolRepository
	queryRepo repository.QueryRepository
	dsRepo    repository.DataSourceRepository
}

// NewToolService creates a new ToolService
func NewToolService(
	toolRepo repository.ToolRepository,
	queryRepo repository.QueryRepository,
	dsRepo repository.DataSourceRepository,
) ToolService {
	return &toolService{
		toolRepo:  toolRepo,
		queryRepo: queryRepo,
		dsRepo:    dsRepo,
	}
}

// Create creates a new tool
func (s *toolService) Create(userID uint, req *model.CreateToolRequest) (*model.ToolResponse, error) {
	// Validate tool name format (snake_case, lowercase, alphanumeric with underscores)
	if !isValidToolName(req.Name) {
		return nil, ErrInvalidToolName
	}

	// Validate the query exists and belongs to the user
	query, err := s.queryRepo.FindByIDAndUserID(req.QueryID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrQueryNotFound) {
			return nil, ErrQueryRequired
		}
		return nil, err
	}

	// Create tool
	tool := &model.Tool{
		UserID:       userID,
		Name:         req.Name,
		DisplayName:  req.DisplayName,
		Description:  req.Description,
		QueryID:      req.QueryID,
		Parameters:   model.ToolParameters(req.Parameters),
		OutputSchema: model.OutputSchema(req.OutputSchema),
		Status:       "active",
	}

	if err := s.toolRepo.Create(tool); err != nil {
		if errors.Is(err, repository.ErrToolNameExists) {
			return nil, ErrToolNameExists
		}
		return nil, err
	}

	// Set Query for response
	tool.Query = *query

	return tool.ToResponse(), nil
}

// CreateFromQuery creates a tool from an existing query with auto-generated settings
func (s *toolService) CreateFromQuery(userID uint, queryID string, req *model.CreateToolFromQueryRequest) (*model.ToolResponse, error) {
	// Get the query with DataSource
	query, err := s.queryRepo.FindByIDWithDataSource(queryID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrQueryNotFound) {
			return nil, ErrQueryRequired
		}
		return nil, err
	}

	// Generate tool name (snake_case from query name or custom)
	var toolName string
	if req.CustomName != "" {
		toolName = toSnakeCase(req.CustomName)
	} else {
		toolName = toSnakeCase(query.Name)
	}

	// Validate tool name
	if !isValidToolName(toolName) {
		return nil, ErrInvalidToolName
	}

	// Generate display name
	displayName := req.DisplayName
	if displayName == "" {
		displayName = query.Name
	}

	// Generate description
	description := req.Description
	if description == "" {
		description = generateToolDescription(query)
	}

	// Convert query parameters to tool parameters
	queryParams, err := query.GetParameters()
	if err != nil {
		return nil, fmt.Errorf("failed to get query parameters: %w", err)
	}

	toolParams := make([]model.ToolParameter, len(queryParams))
	for i, qp := range queryParams {
		toolParams[i] = model.ToolParameter{
			Name:        qp.Name,
			Type:        qp.Type,
			Required:    qp.Required,
			Default:     qp.Default,
			Description: qp.Description,
		}
	}

	// Infer output schema from query (basic inference)
	outputSchema := inferOutputSchema(query)

	// Create tool
	tool := &model.Tool{
		UserID:       userID,
		Name:         toolName,
		DisplayName:  displayName,
		Description:  description,
		QueryID:      queryID,
		Parameters:   model.ToolParameters(toolParams),
		OutputSchema: model.OutputSchema(outputSchema),
		Status:       "active",
	}

	if err := s.toolRepo.Create(tool); err != nil {
		if errors.Is(err, repository.ErrToolNameExists) {
			return nil, ErrToolNameExists
		}
		return nil, err
	}

	// Set Query for response
	tool.Query = *query

	return tool.ToResponse(), nil
}

// List returns all tools for a user with optional search
func (s *toolService) List(userID uint, page, size int, keyword string) ([]model.ToolResponse, int64, error) {
	// Set defaults
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	var tools []model.Tool
	var total int64
	var err error

	if keyword != "" {
		tools, total, err = s.toolRepo.Search(userID, keyword, page, size)
	} else {
		tools, total, err = s.toolRepo.FindAll(userID, page, size)
	}

	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.ToolResponse, len(tools))
	for i, t := range tools {
		responses[i] = *t.ToResponse()
	}

	return responses, total, nil
}

// Get returns a tool by ID
func (s *toolService) Get(id string, userID uint) (*model.ToolResponse, error) {
	tool, err := s.toolRepo.FindByIDWithQuery(id, userID)
	if err != nil {
		return nil, err
	}
	return tool.ToResponse(), nil
}

// Update updates a tool
func (s *toolService) Update(id string, userID uint, req *model.UpdateToolRequest) (*model.ToolResponse, error) {
	tool, err := s.toolRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		if !isValidToolName(*req.Name) {
			return nil, ErrInvalidToolName
		}
		tool.Name = *req.Name
	}
	if req.DisplayName != nil {
		tool.DisplayName = *req.DisplayName
	}
	if req.Description != nil {
		tool.Description = *req.Description
	}
	if req.QueryID != nil {
		// Validate the new query exists and belongs to the user
		_, err := s.queryRepo.FindByIDAndUserID(*req.QueryID, userID)
		if err != nil {
			if errors.Is(err, repository.ErrQueryNotFound) {
				return nil, ErrQueryRequired
			}
			return nil, err
		}
		tool.QueryID = *req.QueryID
	}
	if req.Parameters != nil {
		tool.Parameters = model.ToolParameters(req.Parameters)
	}
	if req.OutputSchema != nil {
		tool.OutputSchema = model.OutputSchema(req.OutputSchema)
	}
	if req.Status != nil {
		tool.Status = *req.Status
	}

	// Increment version on update
	tool.Version++

	if err := s.toolRepo.Update(tool); err != nil {
		return nil, err
	}

	// Reload with Query
	tool, err = s.toolRepo.FindByIDWithQuery(id, userID)
	if err != nil {
		return nil, err
	}

	return tool.ToResponse(), nil
}

// Delete deletes a tool
func (s *toolService) Delete(id string, userID uint) error {
	return s.toolRepo.Delete(id, userID)
}

// TestTool tests a tool by executing its associated query
func (s *toolService) TestTool(id string, userID uint, req *model.TestToolRequest) (*model.TestToolResponse, error) {
	// Get tool with query and datasource
	tool, err := s.toolRepo.FindByIDWithQuery(id, userID)
	if err != nil {
		return nil, err
	}

	// Validate parameters against tool definition
	if err := validateToolParameters(tool.Parameters, req.Parameters); err != nil {
		return &model.TestToolResponse{
			Success: false,
			Message: fmt.Sprintf("Parameter validation failed: %v", err),
		}, nil
	}

	// Get the query with DataSource
	query, err := s.queryRepo.FindByIDWithDataSource(tool.QueryID, userID)
	if err != nil {
		return &model.TestToolResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to get query: %v", err),
		}, nil
	}

	// Validate SQL parameters
	if err := sqlparser.ValidateParameters(query.SQLTemplate, req.Parameters); err != nil {
		return &model.TestToolResponse{
			Success: false,
			Message: fmt.Sprintf("Missing parameters: %v", err),
		}, nil
	}

	// Get DataSource with decrypted password
	ds, err := s.dsRepo.FindByIDAndUserID(query.DataSourceID, userID)
	if err != nil {
		return &model.TestToolResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to get datasource: %v", err),
		}, nil
	}

	// Decrypt password
	password, err := crypto.Decrypt(ds.Password)
	if err != nil {
		return &model.TestToolResponse{
			Success: false,
			Message: "Failed to decrypt datasource password",
		}, nil
	}

	// Create database connection
	config := &dbconnector.ConnectionConfig{
		Type:     dbconnector.DBType(ds.Type),
		Host:     ds.Host,
		Port:     ds.Port,
		Username: ds.Username,
		Password: password,
		Database: ds.Database,
		SSLMode:  ds.SSLMode,
	}

	connector := dbconnector.NewConnector(config)
	if err := connector.Connect(); err != nil {
		return &model.TestToolResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to connect to datasource: %v", err),
		}, nil
	}
	defer connector.Close()

	// Execute query
	start := time.Now()
	result, err := connector.ExecuteQueryWithColumns(query.SQLTemplate, req.Parameters)
	executionTime := time.Since(start).Milliseconds()

	if err != nil {
		return &model.TestToolResponse{
			Success:         false,
			Message:         fmt.Sprintf("Query execution failed: %v", err),
			ExecutionTimeMs: executionTime,
		}, nil
	}

	return &model.TestToolResponse{
		Success:         true,
		Message:         "Tool executed successfully",
		ExecutionTimeMs: executionTime,
		RowCount:        len(result.Data),
		Data:            result.Data,
		Columns:         result.Columns,
	}, nil
}

// Export exports a tool in MCP tool definition format
func (s *toolService) Export(id string, userID uint) (*model.MCPToolDefinition, error) {
	tool, err := s.toolRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	return tool.ToMCPDefinition(), nil
}

// ExportAll exports all active tools for a user in MCP format
func (s *toolService) ExportAll(userID uint) ([]*model.MCPToolDefinition, error) {
	// Get all tools (first page with large size)
	tools, _, err := s.toolRepo.FindAll(userID, 1, 1000)
	if err != nil {
		return nil, err
	}

	definitions := make([]*model.MCPToolDefinition, 0, len(tools))
	for _, tool := range tools {
		if tool.Status == "active" {
			definitions = append(definitions, tool.ToMCPDefinition())
		}
	}

	return definitions, nil
}

// GenerateDescription generates a description for a tool
func (s *toolService) GenerateDescription(id string, userID uint, req *model.GenerateDescriptionRequest) (*model.GenerateDescriptionResponse, error) {
	tool, err := s.toolRepo.FindByIDWithQuery(id, userID)
	if err != nil {
		return nil, err
	}

	var description string
	var generated bool

	if req.UseAI {
		// TODO: Implement AI-powered description generation
		// For now, fall back to template-based generation
		description = generateToolDescriptionFromTool(tool)
		generated = false
	} else {
		description = generateToolDescriptionFromTool(tool)
		generated = true
	}

	return &model.GenerateDescriptionResponse{
		Description: description,
		Generated:   generated,
	}, nil
}

// Helper functions

// isValidToolName validates tool name format (snake_case)
func isValidToolName(name string) bool {
	if name == "" {
		return false
	}
	// Must be lowercase, alphanumeric, underscores only, not starting/ending with underscore
	matched, _ := regexp.MatchString(`^[a-z][a-z0-9_]*[a-z0-9]$|^[a-z]$`, name)
	return matched
}

// toSnakeCase converts a string to snake_case
func toSnakeCase(s string) string {
	var result strings.Builder
	s = strings.TrimSpace(s)

	for i, r := range s {
		if unicode.IsUpper(r) {
			if i > 0 {
				result.WriteRune('_')
			}
			result.WriteRune(unicode.ToLower(r))
		} else if unicode.IsLetter(r) || unicode.IsDigit(r) {
			result.WriteRune(unicode.ToLower(r))
		} else if r == ' ' || r == '-' || r == '_' {
			if i > 0 && result.Len() > 0 {
				lastChar := result.String()[result.Len()-1]
				if lastChar != '_' {
					result.WriteRune('_')
				}
			}
		}
	}

	// Remove leading/trailing underscores
	str := result.String()
	str = strings.Trim(str, "_")

	// Replace multiple consecutive underscores with single
	for strings.Contains(str, "__") {
		str = strings.ReplaceAll(str, "__", "_")
	}

	return str
}

// generateToolDescription generates a description from query
func generateToolDescription(query *model.Query) string {
	params, _ := query.GetParameters()

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Execute %s query", query.Name))

	if query.Description != "" {
		sb.WriteString(fmt.Sprintf(": %s", query.Description))
	}

	if len(params) > 0 {
		sb.WriteString(". Parameters: ")
		paramNames := make([]string, len(params))
		for i, p := range params {
			paramNames[i] = p.Name
		}
		sb.WriteString(strings.Join(paramNames, ", "))
	}

	return sb.String()
}

// generateToolDescriptionFromTool generates a description from tool and its query
func generateToolDescriptionFromTool(tool *model.Tool) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Tool '%s' executes database query", tool.DisplayName))

	if tool.Query.ID != "" {
		sb.WriteString(fmt.Sprintf(" '%s'", tool.Query.Name))
		if tool.Query.Description != "" {
			sb.WriteString(fmt.Sprintf(": %s", tool.Query.Description))
		}
	}

	if len(tool.Parameters) > 0 {
		sb.WriteString(". Accepts parameters: ")
		paramDescs := make([]string, len(tool.Parameters))
		for i, p := range tool.Parameters {
			paramDescs[i] = fmt.Sprintf("%s (%s)", p.Name, p.Type)
		}
		sb.WriteString(strings.Join(paramDescs, ", "))
	}

	return sb.String()
}

// inferOutputSchema infers output schema from query (basic implementation)
func inferOutputSchema(query *model.Query) map[string]interface{} {
	// Basic output schema - in a real implementation, this could analyze
	// the SQL to determine column types or execute a test query
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"columns": map[string]interface{}{
				"type":        "array",
				"description": "Column names from the query result",
				"items": map[string]interface{}{
					"type": "string",
				},
			},
			"data": map[string]interface{}{
				"type":        "array",
				"description": "Query result rows",
				"items": map[string]interface{}{
					"type": "object",
				},
			},
			"row_count": map[string]interface{}{
				"type":        "integer",
				"description": "Number of rows returned",
			},
		},
	}
}

// validateToolParameters validates input parameters against tool definition
func validateToolParameters(toolParams model.ToolParameters, inputParams map[string]interface{}) error {
	// Check required parameters
	for _, param := range toolParams {
		if param.Required {
			if _, exists := inputParams[param.Name]; !exists {
				// Check if there's a default value
				if param.Default == nil {
					return fmt.Errorf("missing required parameter: %s", param.Name)
				}
			}
		}
	}

	// Validate parameter types (basic validation)
	for _, param := range toolParams {
		if value, exists := inputParams[param.Name]; exists {
			if err := validateParameterType(param.Name, param.Type, value); err != nil {
				return err
			}
		}
	}

	return nil
}

// validateParameterType validates parameter type
func validateParameterType(name, expectedType string, value interface{}) error {
	if value == nil {
		return nil
	}

	switch expectedType {
	case "string", "date", "datetime":
		if _, ok := value.(string); !ok {
			return fmt.Errorf("parameter %s must be a string", name)
		}
	case "number":
		switch value.(type) {
		case float64, float32, int, int64, int32:
			// Valid number types
		default:
			return fmt.Errorf("parameter %s must be a number", name)
		}
	case "integer":
		switch v := value.(type) {
		case float64:
			// JSON numbers are float64, check if it's a whole number
			if v != float64(int64(v)) {
				return fmt.Errorf("parameter %s must be an integer", name)
			}
		case int, int64, int32:
			// Valid integer types
		default:
			return fmt.Errorf("parameter %s must be an integer", name)
		}
	case "boolean":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("parameter %s must be a boolean", name)
		}
	}

	return nil
}
