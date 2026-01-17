package dbconnector

import (
	"database/sql"
	"fmt"
	"regexp"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "github.com/microsoft/go-mssqldb"
)

type DBType string

const (
	PostgreSQL DBType = "postgresql"
	MySQL      DBType = "mysql"
	MSSQL      DBType = "mssql"
	Oracle     DBType = "oracle"
)

type ConnectionConfig struct {
	Type     DBType
	Host     string
	Port     int
	Username string
	Password string
	Database string
	SSLMode  string
	Options  map[string]string
}

type Connector struct {
	config *ConnectionConfig
	db     *sql.DB
}

func NewConnector(config *ConnectionConfig) *Connector {
	return &Connector{
		config: config,
	}
}

func (c *Connector) Connect() error {
	dsn, err := c.buildDSN()
	if err != nil {
		return err
	}

	driverName := c.getDriverName()
	db, err := sql.Open(driverName, dsn)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	c.db = db
	return nil
}

func (c *Connector) Close() error {
	if c.db != nil {
		return c.db.Close()
	}
	return nil
}

func (c *Connector) DB() *sql.DB {
	return c.db
}

func (c *Connector) TestConnection() error {
	if err := c.Connect(); err != nil {
		return err
	}
	defer c.Close()
	return nil
}

func (c *Connector) buildDSN() (string, error) {
	switch c.config.Type {
	case PostgreSQL:
		sslMode := c.config.SSLMode
		if sslMode == "" {
			sslMode = "disable"
		}
		return fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			c.config.Host, c.config.Port, c.config.Username, c.config.Password, c.config.Database, sslMode,
		), nil

	case MySQL:
		return fmt.Sprintf(
			"%s:%s@tcp(%s:%d)/%s?parseTime=true",
			c.config.Username, c.config.Password, c.config.Host, c.config.Port, c.config.Database,
		), nil

	case MSSQL:
		return fmt.Sprintf(
			"sqlserver://%s:%s@%s:%d?database=%s",
			c.config.Username, c.config.Password, c.config.Host, c.config.Port, c.config.Database,
		), nil

	case Oracle:
		// Oracle connection string format: oracle://user:password@host:port/service_name
		return fmt.Sprintf(
			"oracle://%s:%s@%s:%d/%s",
			c.config.Username, c.config.Password, c.config.Host, c.config.Port, c.config.Database,
		), nil

	default:
		return "", fmt.Errorf("unsupported database type: %s", c.config.Type)
	}
}

func (c *Connector) getDriverName() string {
	switch c.config.Type {
	case PostgreSQL:
		return "postgres"
	case MySQL:
		return "mysql"
	case MSSQL:
		return "sqlserver"
	case Oracle:
		return "oracle"
	default:
		return ""
	}
}

// ExecuteQuery executes a query with named parameters and returns the results as maps
func (c *Connector) ExecuteQuery(query string, params map[string]interface{}) ([]map[string]interface{}, error) {
	if c.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Convert named parameters to positional parameters based on database type
	convertedQuery, args := c.convertNamedParams(query, params)

	rows, err := c.db.Query(convertedQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("query execution failed: %w", err)
	}
	defer rows.Close()

	return c.rowsToMaps(rows)
}

// convertNamedParams converts :paramName syntax to database-specific parameter format
func (c *Connector) convertNamedParams(query string, params map[string]interface{}) (string, []interface{}) {
	if params == nil || len(params) == 0 {
		return query, nil
	}

	// Find all named parameters in the query
	re := regexp.MustCompile(`:(\w+)`)
	matches := re.FindAllStringSubmatch(query, -1)

	if len(matches) == 0 {
		return query, nil
	}

	// Track unique parameters in order
	paramOrder := make([]string, 0)
	seen := make(map[string]bool)
	for _, match := range matches {
		paramName := match[1]
		if !seen[paramName] {
			seen[paramName] = true
			paramOrder = append(paramOrder, paramName)
		}
	}

	// Build args in order
	args := make([]interface{}, 0, len(paramOrder))
	for _, name := range paramOrder {
		if val, ok := params[name]; ok {
			args = append(args, val)
		} else {
			args = append(args, nil)
		}
	}

	// Replace named parameters with positional placeholders
	convertedQuery := query
	for i, name := range paramOrder {
		var placeholder string
		switch c.config.Type {
		case PostgreSQL:
			placeholder = fmt.Sprintf("$%d", i+1)
		case MySQL, Oracle:
			placeholder = "?"
		case MSSQL:
			placeholder = fmt.Sprintf("@p%d", i+1)
		default:
			placeholder = "?"
		}
		// Replace all occurrences of this named parameter
		convertedQuery = strings.ReplaceAll(convertedQuery, ":"+name, placeholder)
	}

	return convertedQuery, args
}

// rowsToMaps converts sql.Rows to a slice of maps
func (c *Connector) rowsToMaps(rows *sql.Rows) ([]map[string]interface{}, error) {
	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}

	var results []map[string]interface{}

	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			// Convert []byte to string for better JSON serialization
			if b, ok := val.([]byte); ok {
				row[col] = string(b)
			} else {
				row[col] = val
			}
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("row iteration error: %w", err)
	}

	return results, nil
}

// GetTableSchema returns the schema for a specific table
func (c *Connector) GetTableSchema(schema, tableName string) ([]ColumnInfo, error) {
	if c.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	switch c.config.Type {
	case PostgreSQL:
		return c.getPostgreSQLColumns(schema, tableName)
	case MySQL:
		return c.getMySQLColumns(tableName)
	case MSSQL:
		return c.getMSSQLColumns(schema, tableName)
	case Oracle:
		return c.getOracleColumns(schema, tableName)
	default:
		return nil, fmt.Errorf("unsupported database type: %s", c.config.Type)
	}
}

func (c *Connector) getMySQLColumns(tableName string) ([]ColumnInfo, error) {
	query := `
		SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION
	`
	rows, err := c.db.Query(query, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []ColumnInfo
	for rows.Next() {
		var name, dataType, nullable, columnKey string
		if err := rows.Scan(&name, &dataType, &nullable, &columnKey); err != nil {
			return nil, err
		}
		columns = append(columns, ColumnInfo{
			Name:       name,
			Type:       dataType,
			Nullable:   nullable == "YES",
			PrimaryKey: columnKey == "PRI",
		})
	}

	return columns, nil
}

func (c *Connector) getMSSQLColumns(schema, tableName string) ([]ColumnInfo, error) {
	query := `
		SELECT c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE,
			   CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY
		FROM INFORMATION_SCHEMA.COLUMNS c
		LEFT JOIN (
			SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
			FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
			JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
				ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
			WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
		) pk ON c.TABLE_SCHEMA = pk.TABLE_SCHEMA
			AND c.TABLE_NAME = pk.TABLE_NAME
			AND c.COLUMN_NAME = pk.COLUMN_NAME
		WHERE c.TABLE_SCHEMA = @p1 AND c.TABLE_NAME = @p2
		ORDER BY c.ORDINAL_POSITION
	`
	rows, err := c.db.Query(query, schema, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []ColumnInfo
	for rows.Next() {
		var name, dataType, nullable string
		var isPK int
		if err := rows.Scan(&name, &dataType, &nullable, &isPK); err != nil {
			return nil, err
		}
		columns = append(columns, ColumnInfo{
			Name:       name,
			Type:       dataType,
			Nullable:   nullable == "YES",
			PrimaryKey: isPK == 1,
		})
	}

	return columns, nil
}

func (c *Connector) getOracleColumns(schema, tableName string) ([]ColumnInfo, error) {
	query := `
		SELECT c.COLUMN_NAME, c.DATA_TYPE, c.NULLABLE,
			   CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY
		FROM ALL_TAB_COLUMNS c
		LEFT JOIN (
			SELECT cols.OWNER, cols.TABLE_NAME, cols.COLUMN_NAME
			FROM ALL_CONSTRAINTS cons
			JOIN ALL_CONS_COLUMNS cols
				ON cons.CONSTRAINT_NAME = cols.CONSTRAINT_NAME
			WHERE cons.CONSTRAINT_TYPE = 'P'
		) pk ON c.OWNER = pk.OWNER
			AND c.TABLE_NAME = pk.TABLE_NAME
			AND c.COLUMN_NAME = pk.COLUMN_NAME
		WHERE c.OWNER = :1 AND c.TABLE_NAME = :2
		ORDER BY c.COLUMN_ID
	`
	rows, err := c.db.Query(query, strings.ToUpper(schema), strings.ToUpper(tableName))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []ColumnInfo
	for rows.Next() {
		var name, dataType, nullable string
		var isPK int
		if err := rows.Scan(&name, &dataType, &nullable, &isPK); err != nil {
			return nil, err
		}
		columns = append(columns, ColumnInfo{
			Name:       name,
			Type:       dataType,
			Nullable:   nullable == "Y",
			PrimaryKey: isPK == 1,
		})
	}

	return columns, nil
}

func (c *Connector) Query(query string, args ...interface{}) (*sql.Rows, error) {
	if c.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	return c.db.Query(query, args...)
}

func (c *Connector) Exec(query string, args ...interface{}) (sql.Result, error) {
	if c.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	return c.db.Exec(query, args...)
}

// GetSchema returns the schema information for the database
func (c *Connector) GetSchema() ([]TableInfo, error) {
	if c.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	var tables []TableInfo

	switch c.config.Type {
	case PostgreSQL:
		return c.getPostgreSQLSchema()
	case MySQL:
		return c.getMySQLSchema()
	case MSSQL:
		return c.getMSSQLSchema()
	case Oracle:
		return c.getOracleSchema()
	}

	return tables, nil
}

type TableInfo struct {
	Name    string       `json:"name"`
	Schema  string       `json:"schema"`
	Columns []ColumnInfo `json:"columns"`
}

type ColumnInfo struct {
	Name       string `json:"name"`
	Type       string `json:"type"`
	Nullable   bool   `json:"nullable"`
	PrimaryKey bool   `json:"primary_key"`
}

func (c *Connector) getPostgreSQLSchema() ([]TableInfo, error) {
	query := `
		SELECT table_schema, table_name
		FROM information_schema.tables
		WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
		ORDER BY table_schema, table_name
	`
	rows, err := c.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var schema, name string
		if err := rows.Scan(&schema, &name); err != nil {
			return nil, err
		}
		tables = append(tables, TableInfo{Name: name, Schema: schema})
	}

	// Get columns for each table
	for i := range tables {
		columns, err := c.getPostgreSQLColumns(tables[i].Schema, tables[i].Name)
		if err != nil {
			return nil, err
		}
		tables[i].Columns = columns
	}

	return tables, nil
}

func (c *Connector) getPostgreSQLColumns(schema, table string) ([]ColumnInfo, error) {
	query := `
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_schema = $1 AND table_name = $2
		ORDER BY ordinal_position
	`
	rows, err := c.db.Query(query, schema, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []ColumnInfo
	for rows.Next() {
		var name, dataType, nullable string
		if err := rows.Scan(&name, &dataType, &nullable); err != nil {
			return nil, err
		}
		columns = append(columns, ColumnInfo{
			Name:     name,
			Type:     dataType,
			Nullable: nullable == "YES",
		})
	}

	return columns, nil
}

func (c *Connector) getMySQLSchema() ([]TableInfo, error) {
	query := `
		SELECT TABLE_SCHEMA, TABLE_NAME
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = DATABASE()
		ORDER BY TABLE_NAME
	`
	rows, err := c.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var schema, name string
		if err := rows.Scan(&schema, &name); err != nil {
			return nil, err
		}
		tables = append(tables, TableInfo{Name: name, Schema: schema})
	}

	return tables, nil
}

func (c *Connector) getMSSQLSchema() ([]TableInfo, error) {
	query := `
		SELECT TABLE_SCHEMA, TABLE_NAME
		FROM INFORMATION_SCHEMA.TABLES
		WHERE TABLE_TYPE = 'BASE TABLE'
		ORDER BY TABLE_SCHEMA, TABLE_NAME
	`
	rows, err := c.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var schema, name string
		if err := rows.Scan(&schema, &name); err != nil {
			return nil, err
		}
		tables = append(tables, TableInfo{Name: name, Schema: schema})
	}

	return tables, nil
}

func (c *Connector) getOracleSchema() ([]TableInfo, error) {
	query := `
		SELECT OWNER, TABLE_NAME
		FROM ALL_TABLES
		WHERE OWNER NOT IN ('SYS', 'SYSTEM', 'CTXSYS', 'DBSNMP', 'MDSYS', 'OLAPSYS', 'ORDDATA', 'ORDSYS', 'OUTLN', 'WMSYS', 'XDB')
		ORDER BY OWNER, TABLE_NAME
	`
	rows, err := c.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var schema, name string
		if err := rows.Scan(&schema, &name); err != nil {
			return nil, err
		}
		tables = append(tables, TableInfo{Name: name, Schema: schema})
	}

	// Get columns for each table
	for i := range tables {
		columns, err := c.getOracleColumns(tables[i].Schema, tables[i].Name)
		if err != nil {
			return nil, err
		}
		tables[i].Columns = columns
	}

	return tables, nil
}
