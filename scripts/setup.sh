#!/bin/bash

set -e

echo "=== DataWeaver Setup Script ==="

# Check Go installation
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Please install Go 1.21+ first."
    echo "Visit: https://go.dev/dl/"
    exit 1
fi

GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
echo "Go version: $GO_VERSION"

# Download dependencies
echo "Downloading dependencies..."
go mod download
go mod tidy

# Install development tools
echo "Installing development tools..."
go install github.com/swaggo/swag/cmd/swag@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Generate Swagger documentation
echo "Generating Swagger documentation..."
swag init -g cmd/server/main.go -o docs --parseDependency

# Create logs directory
mkdir -p logs

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the server:"
echo "  go run cmd/server/main.go"
echo ""
echo "Or use make:"
echo "  make run"
echo ""
echo "API endpoints:"
echo "  Health check: http://localhost:8080/health"
echo "  Swagger UI:   http://localhost:8080/swagger/index.html"
echo ""
echo "Note: Make sure PostgreSQL is running before starting the server."
echo "You can use Docker Compose:"
echo "  docker-compose up -d postgres"
