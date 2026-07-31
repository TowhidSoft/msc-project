package database

import (
	"log"
	"os"

	"ecommerce/catalog-service/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB connects to the catalog SQLite database and runs migrations
func InitDB() {
	var err error
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "catalog.db"
	}

	DB, err = gorm.Open(sqlite.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to catalog database: %v", err)
	}

	log.Println("Catalog database connection established.")
}

// SeedData inserts sample books if database is empty
func SeedData() {
	var count int64
	DB.Model(&models.Book{}).Count(&count)
	if count > 0 {
		return // Database already seeded
	}

	sampleBooks := []models.Book{
		{
			Title:       "The Pragmatic Programmer",
			Author:      "Andrew Hunt, David Thomas",
			Category:    "Software Development",
			Description: "Your journey to mastery. One of the most significant books in software engineering.",
			Price:       39.99,
			ImageURL:    "https://images-na.ssl-images-amazon.com/images/I/41as+45JWBL._SX396_BO1,204,203,200_.jpg",
		},
		{
			Title:       "Clean Code: A Handbook of Agile Software Craftsmanship",
			Author:      "Robert C. Martin",
			Category:    "Software Development",
			Description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
			Price:       34.50,
			ImageURL:    "https://images-na.ssl-images-amazon.com/images/I/41xShZCcCgL._SX379_BO1,204,203,200_.jpg",
		},
		{
			Title:       "Designing Data-Intensive Applications",
			Author:      "Martin Kleppmann",
			Category:    "System Design",
			Description: "The big ideas behind reliable, scalable, and maintainable systems.",
			Price:       42.00,
			ImageURL:    "https://images-na.ssl-images-amazon.com/images/I/51g8iEILt1L._SX379_BO1,204,203,200_.jpg",
		},
		{
			Title:       "Introduction to Algorithms",
			Author:      "Thomas H. Cormen, Charles E. Leiserson",
			Category:    "Algorithms",
			Description: "A comprehensive guide to the analysis and design of computer algorithms.",
			Price:       75.00,
			ImageURL:    "https://images-na.ssl-images-amazon.com/images/I/41vOepg-FDL._SX385_BO1,204,203,200_.jpg",
		},
		{
			Title:       "Refactoring: Improving the Design of Existing Code",
			Author:      "Martin Fowler",
			Category:    "Software Development",
			Description: "Discover the principles of refactoring and clean up complex structures.",
			Price:       44.99,
			ImageURL:    "https://images-na.ssl-images-amazon.com/images/I/410292.jpg",
		},
	}

	for _, book := range sampleBooks {
		if err := DB.Create(&book).Error; err != nil {
			log.Printf("Failed to seed book '%s': %v", book.Title, err)
		}
	}

	log.Println("Catalog database successfully seeded with sample books.")
}
