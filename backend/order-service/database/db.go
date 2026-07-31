package database

import (
	"log"
	"os"

	"ecommerce/order-service/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB connects to the SQLite orders database and runsmigrations
func InitDB() {
	var err error
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "orders.db"
	}

	DB, err = gorm.Open(sqlite.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to orders database: %v", err)
	}

	log.Println("Orders database connection established.")
}

// Migrate performs GORM auto-migrations
func Migrate() error {
	return DB.AutoMigrate(&models.Order{})
}
