package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strings"
	"syscall"

	"github.com/yourusername/dataweaver/config"
	"github.com/yourusername/dataweaver/internal/database"
	"github.com/yourusername/dataweaver/internal/model"
	"github.com/yourusername/dataweaver/pkg/logger"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

func main() {
	// Parse command line flags
	configPath := flag.String("config", "config/config.yaml", "Path to config file")
	username := flag.String("username", "", "Username")
	email := flag.String("email", "", "Email address")
	password := flag.String("password", "", "Password (will prompt if not provided)")
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

	// Initialize database
	if err := database.Init(&cfg.Database); err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer database.Close()

	// Auto migrate User model
	if err := database.AutoMigrate(&model.User{}); err != nil {
		logger.Fatal("Failed to migrate database", zap.Error(err))
	}

	// Interactive mode if username or email not provided
	reader := bufio.NewReader(os.Stdin)

	if *username == "" {
		fmt.Print("Enter username: ")
		*username, _ = reader.ReadString('\n')
		*username = strings.TrimSpace(*username)
	}

	if *email == "" {
		fmt.Print("Enter email: ")
		*email, _ = reader.ReadString('\n')
		*email = strings.TrimSpace(*email)
	}

	if *password == "" {
		fmt.Print("Enter password: ")
		passwordBytes, err := term.ReadPassword(int(syscall.Stdin))
		if err != nil {
			fmt.Printf("\nFailed to read password: %v\n", err)
			os.Exit(1)
		}
		fmt.Println()
		*password = string(passwordBytes)

		fmt.Print("Confirm password: ")
		confirmBytes, err := term.ReadPassword(int(syscall.Stdin))
		if err != nil {
			fmt.Printf("\nFailed to read password: %v\n", err)
			os.Exit(1)
		}
		fmt.Println()

		if *password != string(confirmBytes) {
			fmt.Println("Passwords do not match")
			os.Exit(1)
		}
	}

	// Validate input
	if *username == "" || *email == "" || *password == "" {
		fmt.Println("Username, email, and password are required")
		os.Exit(1)
	}

	// Check if user already exists
	var existingUser model.User
	if err := database.DB.Where("username = ? OR email = ?", *username, *email).First(&existingUser).Error; err == nil {
		fmt.Println("User with this username or email already exists")
		os.Exit(1)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		os.Exit(1)
	}

	// Create user
	user := model.User{
		Username: *username,
		Email:    *email,
		Password: string(hashedPassword),
		IsActive: true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		fmt.Printf("Failed to create user: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("\n✅ User created successfully!\n")
	fmt.Printf("   Username: %s\n", user.Username)
	fmt.Printf("   Email: %s\n", user.Email)
	fmt.Printf("   ID: %d\n", user.ID)
	fmt.Printf("\nYou can now use these credentials to login.\n")
}
