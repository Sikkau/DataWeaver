package service

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/pkg/analytics"
	"github.com/yourusername/dataweaver/pkg/crypto"
	"github.com/yourusername/dataweaver/pkg/dbconnector"
	"github.com/yourusername/dataweaver/pkg/sqlparser"
)

var (
	ErrMcpServerNotFound   = errors.New("mcp server not found")
	ErrMcpServerNameExists = errors.New("mcp server name already exists")
	ErrInvalidServerStatus = errors.New("invalid server status")
	ErrServerNotPublished  = errors.New("server is not published")
	ErrToolNotInServer     = errors.New("tool not found in server")
	ErrInvalidApiKey       = errors.New("invalid api key")
	ErrNoToolsToPublish    = errors.New("at least one tool is required to publish")
)

// McpServerService handles business logic for MCP servers
type McpServerService interface {
	Create(userID uint, req *model.CreateMcpServerRequest) (*model.McpServerResponse, error)
	List(userID uint, page, size int, keyword string) ([]model.McpServerResponse, int64, error)
	Get(id string, userID uint) (*model.McpServerResponse, error)
	Update(id string, userID uint, req *model.UpdateMcpServerRequest) (*model.McpServerResponse, error)
	Delete(id string, userID uint) error

	// Publishing
	Publish(id string, userID uint, baseURL string) (*model.PublishMcpServerResponse, error)
	Unpublish(id string, userID uint) error
	GenerateMcpConfig(id string, userID uint, baseURL string) (*model.McpConfigOutput, error)

	// Logging
	LogToolCall(log *model.McpLog) error
	GetLogs(serverID string, userID uint, page, size int) ([]model.McpLogResponse, int64, error)

	// Statistics
	GetStatistics(serverID string, userID uint, days int) (*analytics.Statistics, error)

	// Runtime operations
	GetServerByApiKey(apiKey string) (*model.McpServer, error)
	GetServerTools(serverID string) ([]model.ToolV2, error)
	ExecuteTool(serverID, toolName string, params map[string]interface{}) (*model.McpToolCallResult, *model.McpLog, error)
}

type mcpServerService struct {
	mcpRepo    repository.McpServerRepository
	toolRepo   repository.ToolRepository
	queryRepo  repository.QueryRepository
	dsRepo     repository.DataSourceRepository
	logChannel chan *model.McpLog
	logWg      sync.WaitGroup
}

// NewMcpServerService creates a new McpServerService
func NewMcpServerService(
	mcpRepo repository.McpServerRepository,
	toolRepo repository.ToolRepository,
	queryRepo repository.QueryRepository,
	dsRepo repository.DataSourceRepository,
) McpServerService {
	svc := &mcpServerService{
		mcpRepo:    mcpRepo,
		toolRepo:   toolRepo,
		queryRepo:  queryRepo,
		dsRepo:     dsRepo,
		logChannel: make(chan *model.McpLog, 1000),
	}

	// Start async log writer
	svc.startLogWriter()

	return svc
}

// startLogWriter starts the async log writer goroutine
func (s *mcpServerService) startLogWriter() {
	s.logWg.Add(1)
	go func() {
		defer s.logWg.Done()
		for log := range s.logChannel {
			_ = s.mcpRepo.CreateLog(log)
		}
	}()
}

// Create creates a new MCP server
func (s *mcpServerService) Create(userID uint, req *model.CreateMcpServerRequest) (*model.McpServerResponse, error) {
	// Validate all tools exist and belong to the user
	for _, toolID := range req.ToolIDs {
		_, err := s.toolRepo.FindByIDAndUserID(toolID, userID)
		if err != nil {
			if errors.Is(err, repository.ErrToolNotFound) {
				return nil, fmt.Errorf("tool %s not found", toolID)
			}
			return nil, err
		}
	}

	// Set default config if not provided
	config := req.Config
	if config.TimeoutSeconds == 0 {
		config.TimeoutSeconds = 30
	}
	if config.RateLimitPerMin == 0 {
		config.RateLimitPerMin = 60
	}
	if config.LogLevel == "" {
		config.LogLevel = "info"
	}

	server := &model.McpServer{
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		ToolIDs:     model.StringArray(req.ToolIDs),
		Config:      model.ServerConfigJSON{ServerConfig: config},
		Status:      string(model.McpServerStatusDraft),
	}

	if err := s.mcpRepo.Create(server); err != nil {
		if errors.Is(err, repository.ErrMcpServerNameExists) {
			return nil, ErrMcpServerNameExists
		}
		return nil, err
	}

	// Load tools for response
	server.Tools = s.loadTools(req.ToolIDs, userID)

	return server.ToResponse(), nil
}

// List returns all MCP servers for a user
func (s *mcpServerService) List(userID uint, page, size int, keyword string) ([]model.McpServerResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	var servers []model.McpServer
	var total int64
	var err error

	if keyword != "" {
		servers, total, err = s.mcpRepo.Search(userID, keyword, page, size)
	} else {
		servers, total, err = s.mcpRepo.FindAll(userID, page, size)
	}

	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.McpServerResponse, len(servers))
	for i, srv := range servers {
		responses[i] = *srv.ToResponse()
	}

	return responses, total, nil
}

// Get returns an MCP server by ID
func (s *mcpServerService) Get(id string, userID uint) (*model.McpServerResponse, error) {
	server, err := s.mcpRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	// Load tools
	server.Tools = s.loadTools([]string(server.ToolIDs), userID)

	return server.ToResponse(), nil
}

// Update updates an MCP server
func (s *mcpServerService) Update(id string, userID uint, req *model.UpdateMcpServerRequest) (*model.McpServerResponse, error) {
	server, err := s.mcpRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		server.Name = *req.Name
	}
	if req.Description != nil {
		server.Description = *req.Description
	}
	if req.ToolIDs != nil {
		// Validate all tools exist
		for _, toolID := range req.ToolIDs {
			_, err := s.toolRepo.FindByIDAndUserID(toolID, userID)
			if err != nil {
				if errors.Is(err, repository.ErrToolNotFound) {
					return nil, fmt.Errorf("tool %s not found", toolID)
				}
				return nil, err
			}
		}
		server.ToolIDs = model.StringArray(req.ToolIDs)
	}
	if req.Config != nil {
		server.Config = model.ServerConfigJSON{ServerConfig: *req.Config}
	}
	if req.Status != nil {
		server.Status = *req.Status
	}

	// Increment version
	server.Version = incrementVersion(server.Version)

	if err := s.mcpRepo.Update(server); err != nil {
		return nil, err
	}

	// Load tools for response
	server.Tools = s.loadTools([]string(server.ToolIDs), userID)

	return server.ToResponse(), nil
}

// Delete deletes an MCP server
func (s *mcpServerService) Delete(id string, userID uint) error {
	return s.mcpRepo.Delete(id, userID)
}

// Publish publishes an MCP server
func (s *mcpServerService) Publish(id string, userID uint, baseURL string) (*model.PublishMcpServerResponse, error) {
	server, err := s.mcpRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	// Validate at least one tool is configured
	if len(server.ToolIDs) == 0 {
		return nil, ErrNoToolsToPublish
	}

	// Validate all tools are still available
	for _, toolID := range server.ToolIDs {
		tool, err := s.toolRepo.FindByIDAndUserID(toolID, userID)
		if err != nil {
			return nil, fmt.Errorf("tool %s is not available: %w", toolID, err)
		}
		if tool.Status != "active" {
			return nil, fmt.Errorf("tool %s is not active", tool.Name)
		}
	}

	// Generate endpoint and API key if not already set
	if server.Endpoint == "" {
		server.Endpoint = model.GenerateEndpoint(server.ID, baseURL)
	}
	if server.ApiKey == "" {
		apiKey, err := model.GenerateApiKey()
		if err != nil {
			return nil, fmt.Errorf("failed to generate api key: %w", err)
		}
		server.ApiKey = apiKey
	}

	// Update status
	server.Status = string(model.McpServerStatusPublished)
	server.Version = incrementVersion(server.Version)

	if err := s.mcpRepo.Update(server); err != nil {
		return nil, err
	}

	// Generate MCP config
	mcpConfig := s.generateMcpConfigInternal(server, baseURL)

	// Load tools for response
	server.Tools = s.loadTools([]string(server.ToolIDs), userID)

	return &model.PublishMcpServerResponse{
		Server:    server.ToResponse(),
		McpConfig: mcpConfig,
	}, nil
}

// Unpublish unpublishes an MCP server
func (s *mcpServerService) Unpublish(id string, userID uint) error {
	server, err := s.mcpRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return err
	}

	server.Status = string(model.McpServerStatusDraft)
	return s.mcpRepo.Update(server)
}

// GenerateMcpConfig generates MCP configuration for a server
func (s *mcpServerService) GenerateMcpConfig(id string, userID uint, baseURL string) (*model.McpConfigOutput, error) {
	server, err := s.mcpRepo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}

	if server.Status != string(model.McpServerStatusPublished) {
		return nil, ErrServerNotPublished
	}

	config := s.generateMcpConfigInternal(server, baseURL)

	return &model.McpConfigOutput{
		McpServers: map[string]model.McpServerConfig{
			"dataweaver-" + server.Name: {
				Command: "node",
				Args:    []string{"/path/to/mcp-client.js"},
				Env: map[string]string{
					"DATAWEAVER_ENDPOINT": config["mcpServers"].(map[string]interface{})["dataweaver-"+server.Name].(map[string]interface{})["env"].(map[string]string)["DATAWEAVER_ENDPOINT"],
					"DATAWEAVER_API_KEY":  config["mcpServers"].(map[string]interface{})["dataweaver-"+server.Name].(map[string]interface{})["env"].(map[string]string)["DATAWEAVER_API_KEY"],
				},
			},
		},
	}, nil
}

// generateMcpConfigInternal generates MCP config as a map
func (s *mcpServerService) generateMcpConfigInternal(server *model.McpServer, baseURL string) map[string]interface{} {
	endpoint := server.Endpoint
	if endpoint == "" {
		endpoint = model.GenerateEndpoint(server.ID, baseURL)
	}

	return map[string]interface{}{
		"mcpServers": map[string]interface{}{
			"dataweaver-" + server.Name: map[string]interface{}{
				"command": "node",
				"args":    []string{"/path/to/mcp-client.js"},
				"env": map[string]string{
					"DATAWEAVER_ENDPOINT": endpoint,
					"DATAWEAVER_API_KEY":  server.ApiKey,
				},
			},
		},
	}
}

// LogToolCall logs a tool call asynchronously
func (s *mcpServerService) LogToolCall(log *model.McpLog) error {
	log.Timestamp = time.Now()

	// Send to async channel (non-blocking)
	select {
	case s.logChannel <- log:
		return nil
	default:
		// Channel full, log synchronously
		return s.mcpRepo.CreateLog(log)
	}
}

// GetLogs returns logs for an MCP server
func (s *mcpServerService) GetLogs(serverID string, userID uint, page, size int) ([]model.McpLogResponse, int64, error) {
	// Verify ownership
	_, err := s.mcpRepo.FindByIDAndUserID(serverID, userID)
	if err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}

	logs, total, err := s.mcpRepo.FindLogsByServerID(serverID, page, size)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.McpLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *log.ToResponse()
	}

	return responses, total, nil
}

// GetStatistics returns statistics for an MCP server
func (s *mcpServerService) GetStatistics(serverID string, userID uint, days int) (*analytics.Statistics, error) {
	// Verify ownership
	_, err := s.mcpRepo.FindByIDAndUserID(serverID, userID)
	if err != nil {
		return nil, err
	}

	if days <= 0 {
		days = 30
	}

	// Get statistics
	totalCalls, err := s.mcpRepo.CountLogsByServerID(serverID)
	if err != nil {
		return nil, err
	}

	successCalls, err := s.mcpRepo.CountLogsByStatus(serverID, string(model.McpLogStatusSuccess))
	if err != nil {
		return nil, err
	}

	errorCalls, err := s.mcpRepo.CountLogsByStatus(serverID, string(model.McpLogStatusError))
	if err != nil {
		return nil, err
	}

	avgResponseTime, err := s.mcpRepo.GetAvgResponseTime(serverID)
	if err != nil {
		return nil, err
	}

	toolStats, err := s.mcpRepo.GetLogStatsByTool(serverID)
	if err != nil {
		return nil, err
	}

	dayStats, err := s.mcpRepo.GetLogStatsByDay(serverID, days)
	if err != nil {
		return nil, err
	}

	// Convert to analytics types
	topTools := make([]analytics.ToolStats, len(toolStats))
	for i, ts := range toolStats {
		topTools[i] = analytics.ToolStats{
			ToolID:        ts.ToolID,
			ToolName:      ts.ToolName,
			CallCount:     ts.CallCount,
			SuccessCount:  ts.SuccessCount,
			ErrorCount:    ts.ErrorCount,
			AvgResponseMs: ts.AvgResponseMs,
		}
	}

	callsByDay := make([]analytics.DayStats, len(dayStats))
	for i, ds := range dayStats {
		callsByDay[i] = analytics.DayStats{
			Date:         ds.Date,
			CallCount:    ds.CallCount,
			SuccessCount: ds.SuccessCount,
			ErrorCount:   ds.ErrorCount,
		}
	}

	// Build statistics
	timeRange := analytics.TimeRange{
		Start: time.Now().AddDate(0, 0, -days),
		End:   time.Now(),
	}

	stats := analytics.NewStatisticsBuilder(serverID, timeRange).
		SetTotalCalls(totalCalls).
		SetSuccessfulCalls(successCalls).
		SetFailedCalls(errorCalls).
		SetAvgResponseTime(avgResponseTime).
		SetTopTools(topTools).
		SetCallsByDay(callsByDay).
		Build()

	return &stats, nil
}

// GetServerByApiKey returns a server by API key (for runtime)
func (s *mcpServerService) GetServerByApiKey(apiKey string) (*model.McpServer, error) {
	server, err := s.mcpRepo.FindByApiKey(apiKey)
	if err != nil {
		if errors.Is(err, repository.ErrMcpServerNotFound) {
			return nil, ErrInvalidApiKey
		}
		return nil, err
	}
	return server, nil
}

// GetServerTools returns all tools for a server
func (s *mcpServerService) GetServerTools(serverID string) ([]model.ToolV2, error) {
	server, err := s.mcpRepo.FindByID(serverID)
	if err != nil {
		return nil, err
	}

	tools := make([]model.ToolV2, 0, len(server.ToolIDs))
	for _, toolID := range server.ToolIDs {
		tool, err := s.toolRepo.FindByID(toolID)
		if err != nil {
			continue // Skip unavailable tools
		}
		tools = append(tools, *tool)
	}

	return tools, nil
}

// ExecuteTool executes a tool and returns the result
func (s *mcpServerService) ExecuteTool(serverID, toolName string, params map[string]interface{}) (*model.McpToolCallResult, *model.McpLog, error) {
	server, err := s.mcpRepo.FindByID(serverID)
	if err != nil {
		return nil, nil, err
	}

	// Find the tool by name
	var tool *model.ToolV2
	for _, toolID := range server.ToolIDs {
		t, err := s.toolRepo.FindByID(toolID)
		if err != nil {
			continue
		}
		if t.Name == toolName {
			tool = t
			break
		}
	}

	if tool == nil {
		return nil, nil, ErrToolNotInServer
	}

	// Create log entry
	log := &model.McpLog{
		McpServerID: serverID,
		ToolID:      tool.ID,
		ToolName:    tool.Name,
		Parameters:  model.McpLogParameters(params),
		Status:      string(model.McpLogStatusSuccess),
		Timestamp:   time.Now(),
	}

	start := time.Now()

	// Get the query
	query, err := s.queryRepo.FindByID(tool.QueryID)
	if err != nil {
		log.Status = string(model.McpLogStatusError)
		log.ErrorMessage = fmt.Sprintf("Query not found: %v", err)
		log.ResponseTimeMs = time.Since(start).Milliseconds()
		return &model.McpToolCallResult{
			Content: []model.McpContent{{Type: "text", Text: log.ErrorMessage}},
			IsError: true,
		}, log, nil
	}

	// Validate parameters
	if err := sqlparser.ValidateParameters(query.SQLTemplate, params); err != nil {
		log.Status = string(model.McpLogStatusError)
		log.ErrorMessage = fmt.Sprintf("Parameter validation failed: %v", err)
		log.ResponseTimeMs = time.Since(start).Milliseconds()
		return &model.McpToolCallResult{
			Content: []model.McpContent{{Type: "text", Text: log.ErrorMessage}},
			IsError: true,
		}, log, nil
	}

	// Get DataSource
	ds, err := s.dsRepo.FindByID(query.DataSourceID)
	if err != nil {
		log.Status = string(model.McpLogStatusError)
		log.ErrorMessage = fmt.Sprintf("DataSource not found: %v", err)
		log.ResponseTimeMs = time.Since(start).Milliseconds()
		return &model.McpToolCallResult{
			Content: []model.McpContent{{Type: "text", Text: log.ErrorMessage}},
			IsError: true,
		}, log, nil
	}

	// Decrypt password
	password, err := crypto.Decrypt(ds.Password)
	if err != nil {
		log.Status = string(model.McpLogStatusError)
		log.ErrorMessage = "Failed to decrypt datasource password"
		log.ResponseTimeMs = time.Since(start).Milliseconds()
		return &model.McpToolCallResult{
			Content: []model.McpContent{{Type: "text", Text: log.ErrorMessage}},
			IsError: true,
		}, log, nil
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
		log.Status = string(model.McpLogStatusError)
		log.ErrorMessage = fmt.Sprintf("Failed to connect to datasource: %v", err)
		log.ResponseTimeMs = time.Since(start).Milliseconds()
		return &model.McpToolCallResult{
			Content: []model.McpContent{{Type: "text", Text: log.ErrorMessage}},
			IsError: true,
		}, log, nil
	}
	defer connector.Close()

	// Execute query
	result, err := connector.ExecuteQueryWithColumns(query.SQLTemplate, params)
	log.ResponseTimeMs = time.Since(start).Milliseconds()

	if err != nil {
		log.Status = string(model.McpLogStatusError)
		log.ErrorMessage = fmt.Sprintf("Query execution failed: %v", err)
		return &model.McpToolCallResult{
			Content: []model.McpContent{{Type: "text", Text: log.ErrorMessage}},
			IsError: true,
		}, log, nil
	}

	log.RowCount = len(result.Data)

	// Format result as JSON text
	resultText := formatQueryResult(result)

	return &model.McpToolCallResult{
		Content: []model.McpContent{{Type: "text", Text: resultText}},
		IsError: false,
	}, log, nil
}

// Helper functions

// loadTools loads tools by IDs for a user
func (s *mcpServerService) loadTools(toolIDs []string, userID uint) []model.ToolV2 {
	tools := make([]model.ToolV2, 0, len(toolIDs))
	for _, toolID := range toolIDs {
		tool, err := s.toolRepo.FindByIDAndUserID(toolID, userID)
		if err != nil {
			continue
		}
		tools = append(tools, *tool)
	}
	return tools
}

// incrementVersion increments a semantic version string
func incrementVersion(version string) string {
	// Simple patch version increment
	var major, minor, patch int
	fmt.Sscanf(version, "%d.%d.%d", &major, &minor, &patch)
	return fmt.Sprintf("%d.%d.%d", major, minor, patch+1)
}

// formatQueryResult formats query result as readable text
func formatQueryResult(result *dbconnector.QueryResult) string {
	if len(result.Data) == 0 {
		return "No results found."
	}

	// Format as JSON-like text
	text := fmt.Sprintf("Found %d rows.\n\nColumns: %v\n\nData:\n", len(result.Data), result.Columns)
	for i, row := range result.Data {
		if i >= 100 {
			text += fmt.Sprintf("... and %d more rows\n", len(result.Data)-100)
			break
		}
		text += fmt.Sprintf("%d: %v\n", i+1, row)
	}
	return text
}
