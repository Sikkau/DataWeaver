package logger

import (
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.Logger
var Sugar *zap.SugaredLogger

type Config struct {
	Level      string
	File       string
	MaxSize    int
	MaxBackups int
	MaxAge     int
	Compress   bool
}

func Init(cfg *Config) error {
	level := getLogLevel(cfg.Level)

	// Ensure log directory exists
	if cfg.File != "" {
		logDir := filepath.Dir(cfg.File)
		if err := os.MkdirAll(logDir, 0755); err != nil {
			return err
		}
	}

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	// Console encoder for stdout
	consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)

	// JSON encoder for file
	jsonEncoder := zapcore.NewJSONEncoder(encoderConfig)

	// Console output
	consoleCore := zapcore.NewCore(
		consoleEncoder,
		zapcore.AddSync(os.Stdout),
		level,
	)

	cores := []zapcore.Core{consoleCore}

	// File output if configured
	if cfg.File != "" {
		file, err := os.OpenFile(cfg.File, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return err
		}

		fileCore := zapcore.NewCore(
			jsonEncoder,
			zapcore.AddSync(file),
			level,
		)
		cores = append(cores, fileCore)
	}

	core := zapcore.NewTee(cores...)

	Log = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
	Sugar = Log.Sugar()

	return nil
}

func getLogLevel(level string) zapcore.Level {
	switch level {
	case "debug":
		return zapcore.DebugLevel
	case "info":
		return zapcore.InfoLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

func Debug(msg string, fields ...zap.Field) {
	Log.Debug(msg, fields...)
}

func Info(msg string, fields ...zap.Field) {
	Log.Info(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Log.Warn(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Log.Error(msg, fields...)
}

func Fatal(msg string, fields ...zap.Field) {
	Log.Fatal(msg, fields...)
}

func Sync() error {
	return Log.Sync()
}
