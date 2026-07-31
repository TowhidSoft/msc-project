package database

import (
	"log"
	"os"

	"ecommerce/payment-service/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB connects to the SQLite payment database and auto migrates GORM tables
func InitDB() {
	var err error
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "payments.db"
	}

	DB, err = gorm.Open(sqlite.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to payments database: %v", err)
	}

	log.Println("Payments database connection established.")
}

// Migrate auto migrates payment schemas
func Migrate() error {
	return DB.AutoMigrate(&models.Payment{})
}
