package repository

import (
	"errors"
	"fmt"

	"github.com/yourusername/dataweaver/internal/model"
	"gorm.io/gorm"
)

var (
	ErrToolNotFound   = errors.New("tool not found")
	ErrToolNameExists = errors.New("tool name already exists")
)

// ToolRepository handles database operations for tools
type ToolRepository interface {
	Create(t *model.Tool) error
	FindAll(userID uint, page, size int) ([]model.Tool, int64, error)
	FindByID(id string) (*model.Tool, error)
	FindByIDAndUserID(id string, userID uint) (*model.Tool, error)
	FindByIDWithQuery(id string, userID uint) (*model.Tool, error)
	FindByName(name string, userID uint) (*model.Tool, error)
	Update(t *model.Tool) error
	Delete(id string, userID uint) error
	Search(userID uint, keyword string, page, size int) ([]model.Tool, int64, error)
	FindByQueryID(queryID string) ([]model.Tool, error)
	FindByMcpServerID(mcpServerID string) ([]model.Tool, error)
	CountByQueryID(queryID string) (int64, error)
	IncrementVersion(id string, userID uint) error
}

type toolRepository struct {
	db *gorm.DB
}

// NewToolRepository creates a new ToolRepository
func NewToolRepository(db *gorm.DB) ToolRepository {
	return &toolRepository{db: db}
}

// Create creates a new tool
func (r *toolRepository) Create(t *model.Tool) error {
	// Check if name already exists for this user
	var count int64
	if err := r.db.Model(&model.Tool{}).
		Where("name = ? AND user_id = ?", t.Name, t.UserID).
		Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check tool name: %w", err)
	}
	if count > 0 {
		return ErrToolNameExists
	}

	if err := r.db.Create(t).Error; err != nil {
		return fmt.Errorf("failed to create tool: %w", err)
	}
	return nil
}

// FindAll returns all tools for a user with pagination
func (r *toolRepository) FindAll(userID uint, page, size int) ([]model.Tool, int64, error) {
	var tools []model.Tool
	var total int64

	offset := (page - 1) * size

	// Count total records
	if err := r.db.Model(&model.Tool{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count tools: %w", err)
	}

	// Get paginated records with Query preloaded
	if err := r.db.Preload("Query").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&tools).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find tools: %w", err)
	}

	return tools, total, nil
}

// FindByID finds a tool by ID
func (r *toolRepository) FindByID(id string) (*model.Tool, error) {
	var t model.Tool
	if err := r.db.Where("id = ?", id).First(&t).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrToolNotFound
		}
		return nil, fmt.Errorf("failed to find tool: %w", err)
	}
	return &t, nil
}

// FindByIDAndUserID finds a tool by ID and user ID
func (r *toolRepository) FindByIDAndUserID(id string, userID uint) (*model.Tool, error) {
	var t model.Tool
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&t).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrToolNotFound
		}
		return nil, fmt.Errorf("failed to find tool: %w", err)
	}
	return &t, nil
}

// FindByIDWithQuery finds a tool by ID with Query preloaded
func (r *toolRepository) FindByIDWithQuery(id string, userID uint) (*model.Tool, error) {
	var t model.Tool
	if err := r.db.Preload("Query").
		Preload("Query.DataSource").
		Where("id = ? AND user_id = ?", id, userID).
		First(&t).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrToolNotFound
		}
		return nil, fmt.Errorf("failed to find tool: %w", err)
	}
	return &t, nil
}

// FindByName finds a tool by name for a user
func (r *toolRepository) FindByName(name string, userID uint) (*model.Tool, error) {
	var t model.Tool
	if err := r.db.Where("name = ? AND user_id = ?", name, userID).First(&t).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrToolNotFound
		}
		return nil, fmt.Errorf("failed to find tool: %w", err)
	}
	return &t, nil
}

// Update updates a tool
func (r *toolRepository) Update(t *model.Tool) error {
	result := r.db.Save(t)
	if result.Error != nil {
		return fmt.Errorf("failed to update tool: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrToolNotFound
	}
	return nil
}

// Delete soft-deletes a tool
func (r *toolRepository) Delete(id string, userID uint) error {
	result := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Tool{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete tool: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrToolNotFound
	}
	return nil
}

// Search searches tools by keyword (name, display_name, or description)
func (r *toolRepository) Search(userID uint, keyword string, page, size int) ([]model.Tool, int64, error) {
	var tools []model.Tool
	var total int64

	offset := (page - 1) * size
	searchPattern := "%" + keyword + "%"

	query := r.db.Model(&model.Tool{}).
		Where("user_id = ?", userID).
		Where("name ILIKE ? OR display_name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern, searchPattern)

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count tools: %w", err)
	}

	// Get paginated records with Query preloaded
	if err := r.db.Preload("Query").
		Where("user_id = ?", userID).
		Where("name ILIKE ? OR display_name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern, searchPattern).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&tools).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to search tools: %w", err)
	}

	return tools, total, nil
}

// FindByQueryID finds all tools associated with a query
func (r *toolRepository) FindByQueryID(queryID string) ([]model.Tool, error) {
	var tools []model.Tool
	if err := r.db.Where("query_id = ?", queryID).Find(&tools).Error; err != nil {
		return nil, fmt.Errorf("failed to find tools by query: %w", err)
	}
	return tools, nil
}

// FindByMcpServerID finds all tools associated with an MCP server
func (r *toolRepository) FindByMcpServerID(mcpServerID string) ([]model.Tool, error) {
	var tools []model.Tool
	if err := r.db.Where("mcp_server_id = ?", mcpServerID).Find(&tools).Error; err != nil {
		return nil, fmt.Errorf("failed to find tools by mcp server: %w", err)
	}
	return tools, nil
}

// CountByQueryID counts tools associated with a query
func (r *toolRepository) CountByQueryID(queryID string) (int64, error) {
	var count int64
	if err := r.db.Model(&model.Tool{}).Where("query_id = ?", queryID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count tools: %w", err)
	}
	return count, nil
}

// IncrementVersion increments the version of a tool
func (r *toolRepository) IncrementVersion(id string, userID uint) error {
	result := r.db.Model(&model.Tool{}).
		Where("id = ? AND user_id = ?", id, userID).
		UpdateColumn("version", gorm.Expr("version + 1"))
	if result.Error != nil {
		return fmt.Errorf("failed to increment version: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrToolNotFound
	}
	return nil
}
