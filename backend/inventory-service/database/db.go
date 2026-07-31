package database

import (
	"log"
	"os"

	"ecommerce/inventory-service/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB initializes GORM SQLite DB connection
func InitDB() {
	var err error
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "inventory.db"
	}

	DB, err = gorm.Open(sqlite.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to inventory database: %v", err)
	}

	log.Println("Inventory database connection established.")
}

// SeedData sets default stock counts for seeded catalog books (IDs 1-5)
func SeedData() {
	var count int64
	DB.Model(&models.Inventory{}).Count(&count)
	if count > 0 {
		return // Already seeded
	}

	// Seed books 1 to 5 with 15 copies each
	for i := uint(1); i <= 5; i++ {
		stockItem := models.Inventory{
			BookID: i,
			Stock:  15,
		}
		if err := DB.Create(&stockItem).Error; err != nil {
			log.Printf("Failed to seed inventory for Book ID %d: %v", i, err)
		}
	}

	log.Println("Inventory levels successfully seeded.")
}
