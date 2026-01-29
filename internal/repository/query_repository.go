package repository

import (
	"errors"
	"fmt"

	"github.com/yourusername/dataweaver/internal/model"
	"gorm.io/gorm"
)

var (
	ErrQueryNotFound = errors.New("query not found")
)

// QueryRepository handles database operations for queries
type QueryRepository interface {
	Create(q *model.Query) error
	FindAll(userID uint, page, size int) ([]model.Query, int64, error)
	FindByID(id string) (*model.Query, error)
	FindByIDAndUserID(id string, userID uint) (*model.Query, error)
	FindByIDWithDataSource(id string, userID uint) (*model.Query, error)
	Update(q *model.Query) error
	Delete(id string, userID uint) error
	Search(userID uint, keyword string, page, size int) ([]model.Query, int64, error)
	FindByDataSourceID(dataSourceID string) ([]model.Query, error)
	CountByDataSourceID(dataSourceID string) (int64, error)
	// Execution history
	CreateExecution(exec *model.QueryExecution) error
	FindExecutionsByQueryID(queryID string, userID uint, page, size int) ([]model.QueryExecution, int64, error)
	FindExecutionsByUserID(userID uint, page, size int) ([]model.QueryExecution, int64, error)
}

type queryRepository struct {
	db *gorm.DB
}

// NewQueryRepository creates a new QueryRepository
func NewQueryRepository(db *gorm.DB) QueryRepository {
	return &queryRepository{db: db}
}

// Create creates a new query
func (r *queryRepository) Create(q *model.Query) error {
	if err := r.db.Create(q).Error; err != nil {
		return fmt.Errorf("failed to create query: %w", err)
	}
	return nil
}

// FindAll returns all queries for a user with pagination
func (r *queryRepository) FindAll(userID uint, page, size int) ([]model.Query, int64, error) {
	var queries []model.Query
	var total int64

	offset := (page - 1) * size

	// Count total records
	if err := r.db.Model(&model.Query{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count queries: %w", err)
	}

	// Get paginated records with DataSource preloaded
	if err := r.db.Preload("DataSource").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&queries).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find queries: %w", err)
	}

	return queries, total, nil
}

// FindByID finds a query by ID
func (r *queryRepository) FindByID(id string) (*model.Query, error) {
	var q model.Query
	if err := r.db.Where("id = ?", id).First(&q).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrQueryNotFound
		}
		return nil, fmt.Errorf("failed to find query: %w", err)
	}
	return &q, nil
}

// FindByIDAndUserID finds a query by ID and user ID
func (r *queryRepository) FindByIDAndUserID(id string, userID uint) (*model.Query, error) {
	var q model.Query
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&q).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrQueryNotFound
		}
		return nil, fmt.Errorf("failed to find query: %w", err)
	}
	return &q, nil
}

// FindByIDWithDataSource finds a query by ID with DataSource preloaded
func (r *queryRepository) FindByIDWithDataSource(id string, userID uint) (*model.Query, error) {
	var q model.Query
	if err := r.db.Preload("DataSource").
		Where("id = ? AND user_id = ?", id, userID).
		First(&q).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrQueryNotFound
		}
		return nil, fmt.Errorf("failed to find query: %w", err)
	}
	return &q, nil
}

// Update updates a query
func (r *queryRepository) Update(q *model.Query) error {
	result := r.db.Save(q)
	if result.Error != nil {
		return fmt.Errorf("failed to update query: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrQueryNotFound
	}
	return nil
}

// Delete soft-deletes a query
func (r *queryRepository) Delete(id string, userID uint) error {
	result := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Query{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete query: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrQueryNotFound
	}
	return nil
}

// Search searches queries by keyword (name or description)
func (r *queryRepository) Search(userID uint, keyword string, page, size int) ([]model.Query, int64, error) {
	var queries []model.Query
	var total int64

	offset := (page - 1) * size
	searchPattern := "%" + keyword + "%"

	query := r.db.Model(&model.Query{}).
		Where("user_id = ?", userID).
		Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count queries: %w", err)
	}

	// Get paginated records with DataSource preloaded
	if err := r.db.Preload("DataSource").
		Where("user_id = ?", userID).
		Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&queries).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to search queries: %w", err)
	}

	return queries, total, nil
}

// FindByDataSourceID finds all queries associated with a data source
func (r *queryRepository) FindByDataSourceID(dataSourceID string) ([]model.Query, error) {
	var queries []model.Query
	if err := r.db.Where("data_source_id = ?", dataSourceID).Find(&queries).Error; err != nil {
		return nil, fmt.Errorf("failed to find queries by data source: %w", err)
	}
	return queries, nil
}

// CountByDataSourceID counts queries associated with a data source
func (r *queryRepository) CountByDataSourceID(dataSourceID string) (int64, error) {
	var count int64
	if err := r.db.Model(&model.Query{}).Where("data_source_id = ?", dataSourceID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count queries: %w", err)
	}
	return count, nil
}

// CreateExecution creates a new query execution record
func (r *queryRepository) CreateExecution(exec *model.QueryExecution) error {
	if err := r.db.Create(exec).Error; err != nil {
		return fmt.Errorf("failed to create execution record: %w", err)
	}
	return nil
}

// FindExecutionsByQueryID finds execution history for a specific query
func (r *queryRepository) FindExecutionsByQueryID(queryID string, userID uint, page, size int) ([]model.QueryExecution, int64, error) {
	var executions []model.QueryExecution
	var total int64

	offset := (page - 1) * size

	// Count total records
	if err := r.db.Model(&model.QueryExecution{}).
		Where("query_id = ? AND user_id = ?", queryID, userID).
		Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count executions: %w", err)
	}

	// Get paginated records
	if err := r.db.Preload("Query").
		Where("query_id = ? AND user_id = ?", queryID, userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&executions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find executions: %w", err)
	}

	return executions, total, nil
}

// FindExecutionsByUserID finds all execution history for a user
func (r *queryRepository) FindExecutionsByUserID(userID uint, page, size int) ([]model.QueryExecution, int64, error) {
	var executions []model.QueryExecution
	var total int64

	offset := (page - 1) * size

	// Count total records
	if err := r.db.Model(&model.QueryExecution{}).
		Where("user_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count executions: %w", err)
	}

	// Get paginated records with Query preloaded
	if err := r.db.Preload("Query").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&executions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find executions: %w", err)
	}

	return executions, total, nil
}
