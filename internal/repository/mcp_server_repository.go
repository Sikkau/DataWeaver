package repository

import (
	"errors"
	"fmt"
	"time"

	"github.com/yourusername/dataweaver/internal/model"
	"gorm.io/gorm"
)

var (
	ErrMcpServerNotFound   = errors.New("mcp server not found")
	ErrMcpServerNameExists = errors.New("mcp server name already exists")
)

// McpServerRepository handles database operations for MCP servers
type McpServerRepository interface {
	Create(server *model.McpServer) error
	FindAll(userID uint, page, size int) ([]model.McpServer, int64, error)
	FindByID(id string) (*model.McpServer, error)
	FindByIDAndUserID(id string, userID uint) (*model.McpServer, error)
	FindByName(name string, userID uint) (*model.McpServer, error)
	FindByApiKey(apiKey string) (*model.McpServer, error)
	Update(server *model.McpServer) error
	Delete(id string, userID uint) error
	Search(userID uint, keyword string, page, size int) ([]model.McpServer, int64, error)

	// Log operations
	CreateLog(log *model.McpLog) error
	FindLogsByServerID(serverID string, page, size int) ([]model.McpLog, int64, error)
	FindLogsByTimeRange(serverID string, start, end time.Time, page, size int) ([]model.McpLog, int64, error)

	// Statistics
	CountLogsByServerID(serverID string) (int64, error)
	CountLogsByStatus(serverID string, status string) (int64, error)
	GetAvgResponseTime(serverID string) (float64, error)
	GetLogStatsByTool(serverID string) ([]ToolLogStats, error)
	GetLogStatsByDay(serverID string, days int) ([]DayLogStats, error)
}

// ToolLogStats represents statistics for a specific tool
type ToolLogStats struct {
	ToolID        string  `json:"tool_id"`
	ToolName      string  `json:"tool_name"`
	CallCount     int64   `json:"call_count"`
	SuccessCount  int64   `json:"success_count"`
	ErrorCount    int64   `json:"error_count"`
	AvgResponseMs float64 `json:"avg_response_ms"`
}

// DayLogStats represents statistics for a specific day
type DayLogStats struct {
	Date         string `json:"date"`
	CallCount    int64  `json:"call_count"`
	SuccessCount int64  `json:"success_count"`
	ErrorCount   int64  `json:"error_count"`
}

type mcpServerRepository struct {
	db *gorm.DB
}

// NewMcpServerRepository creates a new McpServerRepository
func NewMcpServerRepository(db *gorm.DB) McpServerRepository {
	return &mcpServerRepository{db: db}
}

// Create creates a new MCP server
func (r *mcpServerRepository) Create(server *model.McpServer) error {
	// Check if name already exists for this user
	var count int64
	if err := r.db.Model(&model.McpServer{}).
		Where("name = ? AND user_id = ?", server.Name, server.UserID).
		Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check server name: %w", err)
	}
	if count > 0 {
		return ErrMcpServerNameExists
	}

	if err := r.db.Create(server).Error; err != nil {
		return fmt.Errorf("failed to create mcp server: %w", err)
	}
	return nil
}

// FindAll returns all MCP servers for a user with pagination
func (r *mcpServerRepository) FindAll(userID uint, page, size int) ([]model.McpServer, int64, error) {
	var servers []model.McpServer
	var total int64

	offset := (page - 1) * size

	// Count total records
	if err := r.db.Model(&model.McpServer{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count mcp servers: %w", err)
	}

	// Get paginated records
	if err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&servers).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find mcp servers: %w", err)
	}

	return servers, total, nil
}

// FindByID finds an MCP server by ID
func (r *mcpServerRepository) FindByID(id string) (*model.McpServer, error) {
	var server model.McpServer
	if err := r.db.Where("id = ?", id).First(&server).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMcpServerNotFound
		}
		return nil, fmt.Errorf("failed to find mcp server: %w", err)
	}
	return &server, nil
}

// FindByIDAndUserID finds an MCP server by ID and user ID
func (r *mcpServerRepository) FindByIDAndUserID(id string, userID uint) (*model.McpServer, error) {
	var server model.McpServer
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&server).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMcpServerNotFound
		}
		return nil, fmt.Errorf("failed to find mcp server: %w", err)
	}
	return &server, nil
}

// FindByName finds an MCP server by name for a user
func (r *mcpServerRepository) FindByName(name string, userID uint) (*model.McpServer, error) {
	var server model.McpServer
	if err := r.db.Where("name = ? AND user_id = ?", name, userID).First(&server).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMcpServerNotFound
		}
		return nil, fmt.Errorf("failed to find mcp server: %w", err)
	}
	return &server, nil
}

// FindByApiKey finds an MCP server by API key
func (r *mcpServerRepository) FindByApiKey(apiKey string) (*model.McpServer, error) {
	var server model.McpServer
	if err := r.db.Where("api_key = ? AND status = ?", apiKey, model.McpServerStatusPublished).First(&server).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMcpServerNotFound
		}
		return nil, fmt.Errorf("failed to find mcp server: %w", err)
	}
	return &server, nil
}

// Update updates an MCP server
func (r *mcpServerRepository) Update(server *model.McpServer) error {
	result := r.db.Save(server)
	if result.Error != nil {
		return fmt.Errorf("failed to update mcp server: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrMcpServerNotFound
	}
	return nil
}

// Delete soft-deletes an MCP server
func (r *mcpServerRepository) Delete(id string, userID uint) error {
	result := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.McpServer{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete mcp server: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrMcpServerNotFound
	}
	return nil
}

// Search searches MCP servers by keyword
func (r *mcpServerRepository) Search(userID uint, keyword string, page, size int) ([]model.McpServer, int64, error) {
	var servers []model.McpServer
	var total int64

	offset := (page - 1) * size
	searchPattern := "%" + keyword + "%"

	query := r.db.Model(&model.McpServer{}).
		Where("user_id = ?", userID).
		Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count mcp servers: %w", err)
	}

	// Get paginated records
	if err := r.db.Where("user_id = ?", userID).
		Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&servers).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to search mcp servers: %w", err)
	}

	return servers, total, nil
}

// CreateLog creates a new MCP log entry
func (r *mcpServerRepository) CreateLog(log *model.McpLog) error {
	if err := r.db.Create(log).Error; err != nil {
		return fmt.Errorf("failed to create mcp log: %w", err)
	}
	return nil
}

// FindLogsByServerID returns logs for an MCP server with pagination
func (r *mcpServerRepository) FindLogsByServerID(serverID string, page, size int) ([]model.McpLog, int64, error) {
	var logs []model.McpLog
	var total int64

	offset := (page - 1) * size

	// Count total records
	if err := r.db.Model(&model.McpLog{}).Where("mcp_server_id = ?", serverID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count mcp logs: %w", err)
	}

	// Get paginated records
	if err := r.db.Where("mcp_server_id = ?", serverID).
		Order("timestamp DESC").
		Offset(offset).
		Limit(size).
		Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find mcp logs: %w", err)
	}

	return logs, total, nil
}

// FindLogsByTimeRange returns logs within a time range
func (r *mcpServerRepository) FindLogsByTimeRange(serverID string, start, end time.Time, page, size int) ([]model.McpLog, int64, error) {
	var logs []model.McpLog
	var total int64

	offset := (page - 1) * size

	query := r.db.Model(&model.McpLog{}).
		Where("mcp_server_id = ?", serverID).
		Where("timestamp >= ? AND timestamp <= ?", start, end)

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count mcp logs: %w", err)
	}

	// Get paginated records
	if err := r.db.Where("mcp_server_id = ?", serverID).
		Where("timestamp >= ? AND timestamp <= ?", start, end).
		Order("timestamp DESC").
		Offset(offset).
		Limit(size).
		Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find mcp logs: %w", err)
	}

	return logs, total, nil
}

// CountLogsByServerID counts all logs for a server
func (r *mcpServerRepository) CountLogsByServerID(serverID string) (int64, error) {
	var count int64
	if err := r.db.Model(&model.McpLog{}).Where("mcp_server_id = ?", serverID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count mcp logs: %w", err)
	}
	return count, nil
}

// CountLogsByStatus counts logs by status for a server
func (r *mcpServerRepository) CountLogsByStatus(serverID string, status string) (int64, error) {
	var count int64
	if err := r.db.Model(&model.McpLog{}).
		Where("mcp_server_id = ? AND status = ?", serverID, status).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count mcp logs: %w", err)
	}
	return count, nil
}

// GetAvgResponseTime returns the average response time for a server
func (r *mcpServerRepository) GetAvgResponseTime(serverID string) (float64, error) {
	var result struct {
		Avg float64
	}
	if err := r.db.Model(&model.McpLog{}).
		Select("COALESCE(AVG(response_time_ms), 0) as avg").
		Where("mcp_server_id = ?", serverID).
		Scan(&result).Error; err != nil {
		return 0, fmt.Errorf("failed to get avg response time: %w", err)
	}
	return result.Avg, nil
}

// GetLogStatsByTool returns statistics grouped by tool
func (r *mcpServerRepository) GetLogStatsByTool(serverID string) ([]ToolLogStats, error) {
	var stats []ToolLogStats

	if err := r.db.Model(&model.McpLog{}).
		Select(`
			tool_id,
			tool_name,
			COUNT(*) as call_count,
			SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
			SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
			COALESCE(AVG(response_time_ms), 0) as avg_response_ms
		`).
		Where("mcp_server_id = ?", serverID).
		Group("tool_id, tool_name").
		Order("call_count DESC").
		Scan(&stats).Error; err != nil {
		return nil, fmt.Errorf("failed to get tool stats: %w", err)
	}

	return stats, nil
}

// GetLogStatsByDay returns statistics grouped by day
func (r *mcpServerRepository) GetLogStatsByDay(serverID string, days int) ([]DayLogStats, error) {
	var stats []DayLogStats

	if err := r.db.Model(&model.McpLog{}).
		Select(`
			TO_CHAR(timestamp, 'YYYY-MM-DD') as date,
			COUNT(*) as call_count,
			SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
			SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
		`).
		Where("mcp_server_id = ? AND timestamp >= NOW() - INTERVAL '1 day' * ?", serverID, days).
		Group("TO_CHAR(timestamp, 'YYYY-MM-DD')").
		Order("date DESC").
		Scan(&stats).Error; err != nil {
		return nil, fmt.Errorf("failed to get daily stats: %w", err)
	}

	return stats, nil
}
