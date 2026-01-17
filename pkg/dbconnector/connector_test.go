package dbconnector

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConnector_buildDSN_PostgreSQL(t *testing.T) {
	config := &ConnectionConfig{
		Type:     PostgreSQL,
		Host:     "localhost",
		Port:     5432,
		Username: "user",
		Password: "password",
		Database: "testdb",
		SSLMode:  "disable",
	}

	connector := NewConnector(config)
	dsn, err := connector.buildDSN()

	assert.NoError(t, err)
	assert.Equal(t, "host=localhost port=5432 user=user password=password dbname=testdb sslmode=disable", dsn)
}

func TestConnector_buildDSN_PostgreSQL_DefaultSSL(t *testing.T) {
	config := &ConnectionConfig{
		Type:     PostgreSQL,
		Host:     "localhost",
		Port:     5432,
		Username: "user",
		Password: "password",
		Database: "testdb",
	}

	connector := NewConnector(config)
	dsn, err := connector.buildDSN()

	assert.NoError(t, err)
	assert.Contains(t, dsn, "sslmode=disable")
}

func TestConnector_buildDSN_MySQL(t *testing.T) {
	config := &ConnectionConfig{
		Type:     MySQL,
		Host:     "localhost",
		Port:     3306,
		Username: "user",
		Password: "password",
		Database: "testdb",
	}

	connector := NewConnector(config)
	dsn, err := connector.buildDSN()

	assert.NoError(t, err)
	assert.Equal(t, "user:password@tcp(localhost:3306)/testdb?parseTime=true", dsn)
}

func TestConnector_buildDSN_MSSQL(t *testing.T) {
	config := &ConnectionConfig{
		Type:     MSSQL,
		Host:     "localhost",
		Port:     1433,
		Username: "user",
		Password: "password",
		Database: "testdb",
	}

	connector := NewConnector(config)
	dsn, err := connector.buildDSN()

	assert.NoError(t, err)
	assert.Equal(t, "sqlserver://user:password@localhost:1433?database=testdb", dsn)
}

func TestConnector_buildDSN_Oracle(t *testing.T) {
	config := &ConnectionConfig{
		Type:     Oracle,
		Host:     "localhost",
		Port:     1521,
		Username: "user",
		Password: "password",
		Database: "ORCL",
	}

	connector := NewConnector(config)
	dsn, err := connector.buildDSN()

	assert.NoError(t, err)
	assert.Equal(t, "oracle://user:password@localhost:1521/ORCL", dsn)
}

func TestConnector_buildDSN_UnsupportedType(t *testing.T) {
	config := &ConnectionConfig{
		Type:     "unsupported",
		Host:     "localhost",
		Port:     1234,
		Username: "user",
		Password: "password",
		Database: "testdb",
	}

	connector := NewConnector(config)
	_, err := connector.buildDSN()

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported database type")
}

func TestConnector_getDriverName(t *testing.T) {
	tests := []struct {
		dbType   DBType
		expected string
	}{
		{PostgreSQL, "postgres"},
		{MySQL, "mysql"},
		{MSSQL, "sqlserver"},
		{Oracle, "oracle"},
		{"unknown", ""},
	}

	for _, tt := range tests {
		config := &ConnectionConfig{Type: tt.dbType}
		connector := NewConnector(config)
		assert.Equal(t, tt.expected, connector.getDriverName())
	}
}

func TestConnector_convertNamedParams_PostgreSQL(t *testing.T) {
	config := &ConnectionConfig{Type: PostgreSQL}
	connector := NewConnector(config)

	query := "SELECT * FROM users WHERE id = :id AND name = :name"
	params := map[string]interface{}{
		"id":   1,
		"name": "John",
	}

	convertedQuery, args := connector.convertNamedParams(query, params)

	assert.Equal(t, "SELECT * FROM users WHERE id = $1 AND name = $2", convertedQuery)
	assert.Equal(t, 2, len(args))
	assert.Equal(t, 1, args[0])
	assert.Equal(t, "John", args[1])
}

func TestConnector_convertNamedParams_MySQL(t *testing.T) {
	config := &ConnectionConfig{Type: MySQL}
	connector := NewConnector(config)

	query := "SELECT * FROM users WHERE id = :id AND name = :name"
	params := map[string]interface{}{
		"id":   1,
		"name": "John",
	}

	convertedQuery, args := connector.convertNamedParams(query, params)

	assert.Equal(t, "SELECT * FROM users WHERE id = ? AND name = ?", convertedQuery)
	assert.Equal(t, 2, len(args))
	assert.Equal(t, 1, args[0])
	assert.Equal(t, "John", args[1])
}

func TestConnector_convertNamedParams_MSSQL(t *testing.T) {
	config := &ConnectionConfig{Type: MSSQL}
	connector := NewConnector(config)

	query := "SELECT * FROM users WHERE id = :id AND name = :name"
	params := map[string]interface{}{
		"id":   1,
		"name": "John",
	}

	convertedQuery, args := connector.convertNamedParams(query, params)

	assert.Equal(t, "SELECT * FROM users WHERE id = @p1 AND name = @p2", convertedQuery)
	assert.Equal(t, 2, len(args))
	assert.Equal(t, 1, args[0])
	assert.Equal(t, "John", args[1])
}

func TestConnector_convertNamedParams_NoParams(t *testing.T) {
	config := &ConnectionConfig{Type: PostgreSQL}
	connector := NewConnector(config)

	query := "SELECT * FROM users"
	params := map[string]interface{}{}

	convertedQuery, args := connector.convertNamedParams(query, params)

	assert.Equal(t, "SELECT * FROM users", convertedQuery)
	assert.Nil(t, args)
}

func TestConnector_convertNamedParams_NilParams(t *testing.T) {
	config := &ConnectionConfig{Type: PostgreSQL}
	connector := NewConnector(config)

	query := "SELECT * FROM users"

	convertedQuery, args := connector.convertNamedParams(query, nil)

	assert.Equal(t, "SELECT * FROM users", convertedQuery)
	assert.Nil(t, args)
}

func TestConnector_convertNamedParams_RepeatedParam(t *testing.T) {
	config := &ConnectionConfig{Type: PostgreSQL}
	connector := NewConnector(config)

	query := "SELECT * FROM users WHERE id = :id OR parent_id = :id"
	params := map[string]interface{}{
		"id": 1,
	}

	convertedQuery, args := connector.convertNamedParams(query, params)

	// Both occurrences of :id should be replaced with $1
	assert.Equal(t, "SELECT * FROM users WHERE id = $1 OR parent_id = $1", convertedQuery)
	assert.Equal(t, 1, len(args))
	assert.Equal(t, 1, args[0])
}

func TestConnector_convertNamedParams_MissingParam(t *testing.T) {
	config := &ConnectionConfig{Type: PostgreSQL}
	connector := NewConnector(config)

	query := "SELECT * FROM users WHERE id = :id"
	params := map[string]interface{}{
		"other": "value",
	}

	convertedQuery, args := connector.convertNamedParams(query, params)

	assert.Equal(t, "SELECT * FROM users WHERE id = $1", convertedQuery)
	assert.Equal(t, 1, len(args))
	assert.Nil(t, args[0])
}
