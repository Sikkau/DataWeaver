package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/yourusername/dataweaver/config"
	_ "github.com/yourusername/dataweaver/docs"
	"github.com/yourusername/dataweaver/internal/api"
	"github.com/yourusername/dataweaver/internal/database"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/pkg/crypto"
	"github.com/yourusername/dataweaver/pkg/logger"
	"go.uber.org/zap"
)

// @title DataWeaver API
// @version 1.0.0
// @description DataWeaver is a database connection management and MCP server tool.

// @contact.name DataWeaver Support
// @contact.email support@dataweaver.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Enter "Bearer {token}" to authenticate

func main() {
	// Parse command line flags
	configPath := flag.String("config", "config/config.yaml", "Path to config file")
	flag.Parse()

	// Load configuration
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	if err := logger.Init(&logger.Config{
		Level:      cfg.Log.Level,
		File:       cfg.Log.File,
		MaxSize:    cfg.Log.MaxSize,
		MaxBackups: cfg.Log.MaxBackups,
		MaxAge:     cfg.Log.MaxAge,
		Compress:   cfg.Log.Compress,
	}); err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	// Initialize crypto
	if err := crypto.Init(cfg.Encryption.Key); err != nil {
		logger.Fatal("Failed to initialize encryption", zap.Error(err))
	}

	logger.Info("Starting DataWeaver server",
		zap.String("version", "1.0.0"),
		zap.String("mode", cfg.Server.Mode),
	)

	// Initialize database
	if err := database.Init(&cfg.Database); err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer database.Close()

	// Auto migrate models
	if err := database.AutoMigrate(
		&model.User{},
		&model.DataSource{},
		&model.Query{},
		&model.QueryExecution{},
		&model.Tool{},
		&model.McpServer{},
		&model.McpLog{},
	); err != nil {
		logger.Fatal("Failed to migrate database", zap.Error(err))
	}

	// Setup router
	router := api.SetupRouter(cfg.Server.Mode)

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		logger.Info("Server is running",
			zap.Int("port", cfg.Server.Port),
			zap.String("swagger", fmt.Sprintf("http://localhost:%d/swagger/index.html", cfg.Server.Port)),
			zap.String("health", fmt.Sprintf("http://localhost:%d/health", cfg.Server.Port)),
		)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Create context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited gracefully")
}
