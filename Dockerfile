# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git and ca-certificates (needed for go mod download)
RUN apk add --no-cache git ca-certificates

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o dataweaver ./cmd/server

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN adduser -D -g '' appuser

# Copy binary from builder
COPY --from=builder /app/dataweaver .
COPY --from=builder /app/config/config.yaml ./config/

# Create logs directory
RUN mkdir -p logs && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["./dataweaver"]
CMD ["-config", "config/config.yaml"]
