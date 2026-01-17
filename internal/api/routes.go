package api

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/yourusername/dataweaver/internal/api/auth"
	"github.com/yourusername/dataweaver/internal/api/datasource"
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

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Initialize repositories
		userRepo := repository.NewUserRepository(database.DB)
		dsRepo := repository.NewDataSourceRepository(database.DB)

		// Initialize services
		authSvc := service.NewAuthService(userRepo)
		dsSvc := service.NewDataSourceService(dsRepo)

		// Initialize handlers
		authHandler := auth.NewHandler(authSvc)
		dsHandler := datasource.NewHandler(dsSvc)

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
			query := protected.Group("/queries")
			{
				query.GET("", placeholder("list queries"))
				query.POST("", placeholder("create query"))
				query.GET("/:id", placeholder("get query"))
				query.PUT("/:id", placeholder("update query"))
				query.DELETE("/:id", placeholder("delete query"))
				query.POST("/:id/execute", placeholder("execute query"))
			}

			// Tool routes
			tool := protected.Group("/tools")
			{
				tool.GET("", placeholder("list tools"))
				tool.POST("", placeholder("create tool"))
				tool.GET("/:id", placeholder("get tool"))
				tool.PUT("/:id", placeholder("update tool"))
				tool.DELETE("/:id", placeholder("delete tool"))
			}

			// MCP Server routes
			mcpserver := protected.Group("/mcp-servers")
			{
				mcpserver.GET("", placeholder("list mcp servers"))
				mcpserver.POST("", placeholder("create mcp server"))
				mcpserver.GET("/:id", placeholder("get mcp server"))
				mcpserver.PUT("/:id", placeholder("update mcp server"))
				mcpserver.DELETE("/:id", placeholder("delete mcp server"))
				mcpserver.POST("/:id/start", placeholder("start mcp server"))
				mcpserver.POST("/:id/stop", placeholder("stop mcp server"))
			}
		}
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	config := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
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
