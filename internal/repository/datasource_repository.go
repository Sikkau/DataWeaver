package repository

import (
	"errors"
	"fmt"

	"github.com/yourusername/dataweaver/internal/model"
	"gorm.io/gorm"
)

var (
	ErrDataSourceNotFound   = errors.New("datasource not found")
	ErrDataSourceHasQueries = errors.New("datasource has associated queries")
)

// DataSourceRepository handles database operations for datasources
type DataSourceRepository interface {
	Create(ds *model.DataSource) error
	FindAll(userID uint, page, size int) ([]model.DataSource, int64, error)
	FindByID(id string) (*model.DataSource, error)
	FindByIDAndUserID(id string, userID uint) (*model.DataSource, error)
	Update(ds *model.DataSource) error
	Delete(id string, userID uint) error
	Search(userID uint, keyword string, page, size int) ([]model.DataSource, int64, error)
	HasAssociatedQueries(id string) (bool, error)
}

type dataSourceRepository struct {
	db *gorm.DB
}

// NewDataSourceRepository creates a new DataSourceRepository
func NewDataSourceRepository(db *gorm.DB) DataSourceRepository {
	return &dataSourceRepository{db: db}
}

// Create creates a new datasource
func (r *dataSourceRepository) Create(ds *model.DataSource) error {
	if err := r.db.Create(ds).Error; err != nil {
		return fmt.Errorf("failed to create datasource: %w", err)
	}
	return nil
}

// FindAll returns all datasources for a user with pagination
func (r *dataSourceRepository) FindAll(userID uint, page, size int) ([]model.DataSource, int64, error) {
	var datasources []model.DataSource
	var total int64

	offset := (page - 1) * size

	// Count total records
	if err := r.db.Model(&model.DataSource{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count datasources: %w", err)
	}

	// Get paginated records
	if err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&datasources).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to find datasources: %w", err)
	}

	return datasources, total, nil
}

// FindByID finds a datasource by ID
func (r *dataSourceRepository) FindByID(id string) (*model.DataSource, error) {
	var ds model.DataSource
	if err := r.db.Where("id = ?", id).First(&ds).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDataSourceNotFound
		}
		return nil, fmt.Errorf("failed to find datasource: %w", err)
	}
	return &ds, nil
}

// FindByIDAndUserID finds a datasource by ID and user ID
func (r *dataSourceRepository) FindByIDAndUserID(id string, userID uint) (*model.DataSource, error) {
	var ds model.DataSource
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&ds).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDataSourceNotFound
		}
		return nil, fmt.Errorf("failed to find datasource: %w", err)
	}
	return &ds, nil
}

// Update updates a datasource
func (r *dataSourceRepository) Update(ds *model.DataSource) error {
	result := r.db.Save(ds)
	if result.Error != nil {
		return fmt.Errorf("failed to update datasource: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrDataSourceNotFound
	}
	return nil
}

// Delete soft-deletes a datasource
func (r *dataSourceRepository) Delete(id string, userID uint) error {
	result := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.DataSource{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete datasource: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrDataSourceNotFound
	}
	return nil
}

// Search searches datasources by keyword (name or description)
func (r *dataSourceRepository) Search(userID uint, keyword string, page, size int) ([]model.DataSource, int64, error) {
	var datasources []model.DataSource
	var total int64

	offset := (page - 1) * size
	searchPattern := "%" + keyword + "%"

	query := r.db.Model(&model.DataSource{}).
		Where("user_id = ?", userID).
		Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count datasources: %w", err)
	}

	// Get paginated records
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(size).
		Find(&datasources).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to search datasources: %w", err)
	}

	return datasources, total, nil
}

// HasAssociatedQueries checks if a datasource has associated queries
func (r *dataSourceRepository) HasAssociatedQueries(id string) (bool, error) {
	var count int64
	// Check Query model which uses UUID data_source_id
	if err := r.db.Model(&model.Query{}).Where("data_source_id = ?", id).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to count associated queries: %w", err)
	}
	return count > 0, nil
}
