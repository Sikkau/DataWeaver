package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server     ServerConfig     `mapstructure:"server"`
	Database   DatabaseConfig   `mapstructure:"database"`
	JWT        JWTConfig        `mapstructure:"jwt"`
	Encryption EncryptionConfig `mapstructure:"encryption"`
	Log        LogConfig        `mapstructure:"log"`
}

type ServerConfig struct {
	Port int    `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

type DatabaseConfig struct {
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	User            string `mapstructure:"user"`
	Password        string `mapstructure:"password"`
	DBName          string `mapstructure:"dbname"`
	SSLMode         string `mapstructure:"sslmode"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
}

type JWTConfig struct {
	Secret      string `mapstructure:"secret"`
	ExpireHours int    `mapstructure:"expire_hours"`
}

type EncryptionConfig struct {
	Key string `mapstructure:"key"`
}

type LogConfig struct {
	Level      string `mapstructure:"level"`
	File       string `mapstructure:"file"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAge     int    `mapstructure:"max_age"`
	Compress   bool   `mapstructure:"compress"`
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=Asia/Shanghai",
		d.Host, d.User, d.Password, d.DBName, d.Port, d.SSLMode,
	)
}

var AppConfig *Config

func LoadConfig(configPath string) (*Config, error) {
	viper.SetConfigFile(configPath)
	viper.SetConfigType("yaml")

	// Support environment variable overrides
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Set defaults
	if config.Server.Port == 0 {
		config.Server.Port = 8080
	}
	if config.Server.Mode == "" {
		config.Server.Mode = "debug"
	}
	if config.Database.MaxIdleConns == 0 {
		config.Database.MaxIdleConns = 10
	}
	if config.Database.MaxOpenConns == 0 {
		config.Database.MaxOpenConns = 100
	}
	if config.Database.ConnMaxLifetime == 0 {
		config.Database.ConnMaxLifetime = 3600
	}
	if config.JWT.ExpireHours == 0 {
		config.JWT.ExpireHours = 24
	}
	if config.Log.Level == "" {
		config.Log.Level = "info"
	}
	if config.Log.MaxSize == 0 {
		config.Log.MaxSize = 100
	}
	if config.Log.MaxBackups == 0 {
		config.Log.MaxBackups = 3
	}
	if config.Log.MaxAge == 0 {
		config.Log.MaxAge = 28
	}

	AppConfig = &config
	return &config, nil
}
