package analytics

import (
	"time"
)

// TimeRange represents a time range for statistics queries
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// NewTimeRange creates a new TimeRange
func NewTimeRange(start, end time.Time) TimeRange {
	return TimeRange{Start: start, End: end}
}

// Last24Hours returns a TimeRange for the last 24 hours
func Last24Hours() TimeRange {
	now := time.Now()
	return TimeRange{
		Start: now.Add(-24 * time.Hour),
		End:   now,
	}
}

// Last7Days returns a TimeRange for the last 7 days
func Last7Days() TimeRange {
	now := time.Now()
	return TimeRange{
		Start: now.Add(-7 * 24 * time.Hour),
		End:   now,
	}
}

// Last30Days returns a TimeRange for the last 30 days
func Last30Days() TimeRange {
	now := time.Now()
	return TimeRange{
		Start: now.Add(-30 * 24 * time.Hour),
		End:   now,
	}
}

// ToolStats represents statistics for a specific tool
type ToolStats struct {
	ToolID        string  `json:"tool_id"`
	ToolName      string  `json:"tool_name"`
	CallCount     int64   `json:"call_count"`
	SuccessCount  int64   `json:"success_count"`
	ErrorCount    int64   `json:"error_count"`
	SuccessRate   float64 `json:"success_rate"`
	AvgResponseMs float64 `json:"avg_response_ms"`
}

// DayStats represents statistics for a specific day
type DayStats struct {
	Date         string  `json:"date"`
	CallCount    int64   `json:"call_count"`
	SuccessCount int64   `json:"success_count"`
	ErrorCount   int64   `json:"error_count"`
	SuccessRate  float64 `json:"success_rate"`
}

// Statistics represents overall statistics for an MCP server
type Statistics struct {
	ServerID        string      `json:"server_id"`
	TimeRange       TimeRange   `json:"time_range"`
	TotalCalls      int64       `json:"total_calls"`
	SuccessfulCalls int64       `json:"successful_calls"`
	FailedCalls     int64       `json:"failed_calls"`
	SuccessRate     float64     `json:"success_rate"`
	AvgResponseTime float64     `json:"avg_response_time_ms"`
	TopTools        []ToolStats `json:"top_tools"`
	CallsByDay      []DayStats  `json:"calls_by_day"`
}

// CalculateSuccessRate calculates the success rate from counts
func CalculateSuccessRate(successCount, totalCount int64) float64 {
	if totalCount == 0 {
		return 0
	}
	return float64(successCount) / float64(totalCount) * 100
}

// StatisticsBuilder helps build Statistics objects
type StatisticsBuilder struct {
	stats Statistics
}

// NewStatisticsBuilder creates a new StatisticsBuilder
func NewStatisticsBuilder(serverID string, timeRange TimeRange) *StatisticsBuilder {
	return &StatisticsBuilder{
		stats: Statistics{
			ServerID:   serverID,
			TimeRange:  timeRange,
			TopTools:   []ToolStats{},
			CallsByDay: []DayStats{},
		},
	}
}

// SetTotalCalls sets the total call count
func (b *StatisticsBuilder) SetTotalCalls(count int64) *StatisticsBuilder {
	b.stats.TotalCalls = count
	return b
}

// SetSuccessfulCalls sets the successful call count
func (b *StatisticsBuilder) SetSuccessfulCalls(count int64) *StatisticsBuilder {
	b.stats.SuccessfulCalls = count
	return b
}

// SetFailedCalls sets the failed call count
func (b *StatisticsBuilder) SetFailedCalls(count int64) *StatisticsBuilder {
	b.stats.FailedCalls = count
	return b
}

// SetAvgResponseTime sets the average response time
func (b *StatisticsBuilder) SetAvgResponseTime(avgMs float64) *StatisticsBuilder {
	b.stats.AvgResponseTime = avgMs
	return b
}

// SetTopTools sets the top tools statistics
func (b *StatisticsBuilder) SetTopTools(tools []ToolStats) *StatisticsBuilder {
	b.stats.TopTools = tools
	return b
}

// SetCallsByDay sets the daily call statistics
func (b *StatisticsBuilder) SetCallsByDay(days []DayStats) *StatisticsBuilder {
	b.stats.CallsByDay = days
	return b
}

// Build builds the final Statistics object
func (b *StatisticsBuilder) Build() Statistics {
	// Calculate success rate
	b.stats.SuccessRate = CalculateSuccessRate(b.stats.SuccessfulCalls, b.stats.TotalCalls)

	// Calculate success rates for top tools
	for i := range b.stats.TopTools {
		b.stats.TopTools[i].SuccessRate = CalculateSuccessRate(
			b.stats.TopTools[i].SuccessCount,
			b.stats.TopTools[i].CallCount,
		)
	}

	// Calculate success rates for daily stats
	for i := range b.stats.CallsByDay {
		b.stats.CallsByDay[i].SuccessRate = CalculateSuccessRate(
			b.stats.CallsByDay[i].SuccessCount,
			b.stats.CallsByDay[i].CallCount,
		)
	}

	return b.stats
}

// RateLimiter provides rate limiting functionality
type RateLimiter struct {
	maxRequests int
	window      time.Duration
	requests    map[string][]time.Time
}

// NewRateLimiter creates a new RateLimiter
func NewRateLimiter(maxRequests int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		maxRequests: maxRequests,
		window:      window,
		requests:    make(map[string][]time.Time),
	}
}

// Allow checks if a request is allowed for the given key
func (r *RateLimiter) Allow(key string) bool {
	now := time.Now()
	windowStart := now.Add(-r.window)

	// Clean up old requests
	if times, exists := r.requests[key]; exists {
		var valid []time.Time
		for _, t := range times {
			if t.After(windowStart) {
				valid = append(valid, t)
			}
		}
		r.requests[key] = valid
	}

	// Check if under limit
	if len(r.requests[key]) >= r.maxRequests {
		return false
	}

	// Add new request
	r.requests[key] = append(r.requests[key], now)
	return true
}

// Reset resets the rate limiter for a key
func (r *RateLimiter) Reset(key string) {
	delete(r.requests, key)
}

// GetRemainingRequests returns the number of remaining requests for a key
func (r *RateLimiter) GetRemainingRequests(key string) int {
	now := time.Now()
	windowStart := now.Add(-r.window)

	if times, exists := r.requests[key]; exists {
		var count int
		for _, t := range times {
			if t.After(windowStart) {
				count++
			}
		}
		return r.maxRequests - count
	}
	return r.maxRequests
}
