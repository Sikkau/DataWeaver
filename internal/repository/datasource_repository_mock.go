package repository

import (
	"github.com/stretchr/testify/mock"
	"github.com/yourusername/dataweaver/internal/model"
)

// MockDataSourceRepository is a mock implementation of DataSourceRepository
type MockDataSourceRepository struct {
	mock.Mock
}

func (m *MockDataSourceRepository) Create(ds *model.DataSource) error {
	args := m.Called(ds)
	return args.Error(0)
}

func (m *MockDataSourceRepository) FindAll(userID uint, page, size int) ([]model.DataSource, int64, error) {
	args := m.Called(userID, page, size)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]model.DataSource), args.Get(1).(int64), args.Error(2)
}

func (m *MockDataSourceRepository) FindByID(id string) (*model.DataSource, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.DataSource), args.Error(1)
}

func (m *MockDataSourceRepository) FindByIDAndUserID(id string, userID uint) (*model.DataSource, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.DataSource), args.Error(1)
}

func (m *MockDataSourceRepository) Update(ds *model.DataSource) error {
	args := m.Called(ds)
	return args.Error(0)
}

func (m *MockDataSourceRepository) Delete(id string, userID uint) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockDataSourceRepository) Search(userID uint, keyword string, page, size int) ([]model.DataSource, int64, error) {
	args := m.Called(userID, keyword, page, size)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]model.DataSource), args.Get(1).(int64), args.Error(2)
}

func (m *MockDataSourceRepository) HasAssociatedQueries(id string) (bool, error) {
	args := m.Called(id)
	return args.Bool(0), args.Error(1)
}
