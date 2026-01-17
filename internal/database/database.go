package database

import (
	"context"
	"fmt"
	"time"

	"github.com/yourusername/dataweaver/config"
	"github.com/yourusername/dataweaver/pkg/logger"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

var DB *gorm.DB

type GormLogger struct{}

func (l *GormLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	return l
}

func (l *GormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	logger.Info(fmt.Sprintf(msg, data...))
}

func (l *GormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	logger.Warn(fmt.Sprintf(msg, data...))
}

func (l *GormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	logger.Error(fmt.Sprintf(msg, data...))
}

func (l *GormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
	elapsed := time.Since(begin)
	sql, rows := fc()

	if err != nil {
		logger.Error("SQL Error",
			zap.String("sql", sql),
			zap.Int64("rows", rows),
			zap.Duration("elapsed", elapsed),
			zap.Error(err),
		)
		return
	}

	if elapsed > time.Second {
		logger.Warn("Slow SQL",
			zap.String("sql", sql),
			zap.Int64("rows", rows),
			zap.Duration("elapsed", elapsed),
		)
		return
	}

	logger.Debug("SQL",
		zap.String("sql", sql),
		zap.Int64("rows", rows),
		zap.Duration("elapsed", elapsed),
	)
}

func Init(cfg *config.DatabaseConfig) error {
	var err error

	gormConfig := &gorm.Config{
		Logger: &GormLogger{},
	}

	DB, err = gorm.Open(postgres.Open(cfg.DSN()), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.ConnMaxLifetime) * time.Second)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Database connected successfully",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
		zap.String("database", cfg.DBName),
	)

	return nil
}

func AutoMigrate(models ...interface{}) error {
	if err := DB.AutoMigrate(models...); err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}
	logger.Info("Database migration completed")
	return nil
}

func HealthCheck() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
