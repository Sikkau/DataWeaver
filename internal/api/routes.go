package api

import (
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/yourusername/dataweaver/internal/api/auth"
	"github.com/yourusername/dataweaver/internal/api/datasource"
	"github.com/yourusername/dataweaver/internal/api/mcp"
	"github.com/yourusername/dataweaver/internal/api/mcpserver"
	"github.com/yourusername/dataweaver/internal/api/query"
	"github.com/yourusername/dataweaver/internal/api/tool"
	"github.com/yourusername/dataweaver/internal/database"
	"github.com/yourusername/dataweaver/internal/middleware"
	"github.com/yourusername/dataweaver/internal/repository"
	"github.com/yourusername/dataweaver/internal/response"
	"github.com/yourusername/dataweaver/internal/service"
)

func SetupRouter(mode string) *gin.Engine {
	gin.SetMode(mode)

	r := gin.New()

	// Global middleware
	r.Use(middleware.Recovery())
	r.Use(middleware.Logger())
	r.Use(corsMiddleware())

	// Health check endpoint
	r.GET("/health", healthCheck)

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Get base URL from environment or use default
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(database.DB)
	dsRepo := repository.NewDataSourceRepository(database.DB)
	queryRepo := repository.NewQueryRepository(database.DB)
	toolRepo := repository.NewToolRepository(database.DB)
	mcpRepo := repository.NewMcpServerRepository(database.DB)

	// Initialize services
	authSvc := service.NewAuthService(userRepo)
	dsSvc := service.NewDataSourceService(dsRepo)
	querySvc := service.NewQueryService(queryRepo, dsRepo)
	toolSvc := service.NewToolService(toolRepo, queryRepo, dsRepo)
	mcpSvc := service.NewMcpServerService(mcpRepo, toolRepo, queryRepo, dsRepo)

	// Initialize handlers
	authHandler := auth.NewHandler(authSvc)
	dsHandler := datasource.NewHandler(dsSvc)
	queryHandler := query.NewHandler(querySvc)
	toolHandler := tool.NewHandler(toolSvc)
	mcpServerHandler := mcpserver.NewHandler(mcpSvc, baseURL)
	mcpRuntimeHandler := mcp.NewRuntimeHandler(mcpSvc)

	// MCP Runtime routes (no authentication - uses API key)
	mcpRuntime := r.Group("/mcp")
	{
		mcpRuntime.POST("/:serverId", mcpRuntimeHandler.HandleMcpRequest)
		mcpRuntime.GET("/:serverId/sse", mcpRuntimeHandler.HandleMcpSSE)
		mcpRuntime.GET("/:serverId/health", mcpRuntimeHandler.HandleHealthCheck)
	}

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Public routes (no authentication required)
		public := v1.Group("")
		{
			public.POST("/auth/login", authHandler.Login)
			public.POST("/auth/register", authHandler.Register)
		}

		// Protected routes (authentication required)
		protected := v1.Group("")
		protected.Use(middleware.JWTAuth())
		{
			// User routes
			user := protected.Group("/user")
			{
				user.GET("/profile", placeholder("get profile"))
				user.PUT("/profile", placeholder("update profile"))
				user.PUT("/password", placeholder("change password"))
			}

			// Data source routes
			datasources := protected.Group("/datasources")
			{
				datasources.GET("", dsHandler.List)
				datasources.POST("", dsHandler.Create)
				datasources.POST("/test", dsHandler.TestConnectionDirect)
				datasources.GET("/:id", dsHandler.Get)
				datasources.PUT("/:id", dsHandler.Update)
				datasources.DELETE("/:id", dsHandler.Delete)
				datasources.POST("/:id/test", dsHandler.TestConnection)
				datasources.GET("/:id/tables", dsHandler.GetTables)
			}

			// Query routes
			queries := protected.Group("/queries")
			{
				queries.GET("", queryHandler.List)
				queries.POST("", queryHandler.Create)
				queries.POST("/validate", queryHandler.ValidateSQL)
				queries.GET("/history", queryHandler.GetHistory) // Must be before /:id
				queries.GET("/:id", queryHandler.Get)
				queries.PUT("/:id", queryHandler.Update)
				queries.DELETE("/:id", queryHandler.Delete)
				queries.POST("/:id/execute", queryHandler.Execute)
				queries.POST("/:id/validate", queryHandler.Validate)
				queries.GET("/:id/parameters", queryHandler.GetParameters)
			}

			// Tool routes
			tools := protected.Group("/tools")
			{
				tools.GET("", toolHandler.List)
				tools.POST("", toolHandler.Create)
				tools.GET("/export", toolHandler.ExportAll) // Must be before /:id
				tools.POST("/from-query/:query_id", toolHandler.CreateFromQuery)
				tools.GET("/:id", toolHandler.Get)
				tools.PUT("/:id", toolHandler.Update)
				tools.DELETE("/:id", toolHandler.Delete)
				tools.POST("/:id/test", toolHandler.TestTool)
				tools.GET("/:id/export", toolHandler.Export)
				tools.POST("/:id/generate-description", toolHandler.GenerateDescription)
			}

			// MCP Server routes
			mcpServers := protected.Group("/mcp-servers")
			{
				mcpServers.GET("", mcpServerHandler.List)
				mcpServers.POST("", mcpServerHandler.Create)
				mcpServers.GET("/:id", mcpServerHandler.Get)
				mcpServers.PUT("/:id", mcpServerHandler.Update)
				mcpServers.DELETE("/:id", mcpServerHandler.Delete)
				mcpServers.POST("/:id/publish", mcpServerHandler.Publish)
				mcpServers.POST("/:id/unpublish", mcpServerHandler.Unpublish)
				mcpServers.GET("/:id/config", mcpServerHandler.GetConfig)
				mcpServers.GET("/:id/logs", mcpServerHandler.GetLogs)
				mcpServers.GET("/:id/statistics", mcpServerHandler.GetStatistics)
			}
		}
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	config := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           86400,
	}
	return cors.New(config)
}

// @Summary Health check
// @Description Check if the service is running
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func healthCheck(c *gin.Context) {
	status := "healthy"
	dbStatus := "connected"

	if err := database.HealthCheck(); err != nil {
		dbStatus = "disconnected"
		status = "degraded"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   status,
		"database": dbStatus,
	})
}

// placeholder returns a handler that responds with a placeholder message
func placeholder(action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		response.Success(c, gin.H{
			"message": "TODO: " + action,
		})
	}
}
