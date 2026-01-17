package validator

import (
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func Init() error {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		validate = v

		// Register custom validators here
		if err := v.RegisterValidation("dbtype", validateDBType); err != nil {
			return err
		}
	}
	return nil
}

// validateDBType validates database type
func validateDBType(fl validator.FieldLevel) bool {
	dbType := fl.Field().String()
	validTypes := []string{"postgresql", "mysql", "mssql", "sqlite"}
	for _, t := range validTypes {
		if t == dbType {
			return true
		}
	}
	return false
}

// Validate validates a struct
func Validate(s interface{}) error {
	if validate == nil {
		validate = validator.New()
	}
	return validate.Struct(s)
}

// GetErrorMessage returns a user-friendly error message
func GetErrorMessage(err error) string {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			switch e.Tag() {
			case "required":
				return e.Field() + " is required"
			case "email":
				return e.Field() + " must be a valid email address"
			case "min":
				return e.Field() + " must be at least " + e.Param() + " characters"
			case "max":
				return e.Field() + " must be at most " + e.Param() + " characters"
			case "dbtype":
				return e.Field() + " must be one of: postgresql, mysql, mssql, sqlite"
			default:
				return e.Field() + " is invalid"
			}
		}
	}
	return err.Error()
}
