.PHONY: all build run clean test lint swagger deps help

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GORUN=$(GOCMD) run
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME=dataweaver
MAIN_PATH=./cmd/server

# Build info
VERSION?=1.0.0
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)"

all: deps build

## build: Build the application
build:
	$(GOBUILD) $(LDFLAGS) -o $(BINARY_NAME) $(MAIN_PATH)

## run: Run the application
run:
	$(GORUN) $(MAIN_PATH)/main.go

## createuser: Create a new user
createuser:
	$(GORUN) ./cmd/createuser/main.go

## clean: Clean build files
clean:
	rm -f $(BINARY_NAME)
	rm -rf logs/*.log

## test: Run tests
test:
	$(GOTEST) -v ./...

## test-coverage: Run tests with coverage
test-coverage:
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

## lint: Run linter
lint:
	golangci-lint run ./...

## swagger: Generate swagger documentation
swagger:
	swag init -g cmd/server/main.go -o docs

## deps: Download dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

## deps-update: Update dependencies
deps-update:
	$(GOGET) -u ./...
	$(GOMOD) tidy

## docker-build: Build Docker image
docker-build:
	docker build -t $(BINARY_NAME):$(VERSION) .

## docker-run: Run Docker container
docker-run:
	docker run -p 8080:8080 $(BINARY_NAME):$(VERSION)

## help: Show this help message
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@sed -n 's/^##//p' $(MAKEFILE_LIST) | column -t -s ':' | sed -e 's/^/ /'
