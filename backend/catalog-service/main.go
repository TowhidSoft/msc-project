package main

import (
	"log"
	"os"

	"ecommerce/catalog-service/controllers"
	"ecommerce/catalog-service/database"
	"ecommerce/catalog-service/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	database.InitDB()

	// Migrate catalog models
	err := database.DB.AutoMigrate(&models.Book{})
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	// Seed database with books if empty
	database.SeedData()

	router := gin.Default()

	// CORS config middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Endpoints mapping
	router.GET("/books", controllers.GetBooks)
	router.GET("/books/:id", controllers.GetBook)
	router.POST("/books", controllers.CreateBook)
	router.PUT("/books/:id", controllers.UpdateBook)
	router.DELETE("/books/:id", controllers.DeleteBook)

	// Fetch port from environment, fallback to 8002
	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	log.Printf("Catalog Service listening on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start catalog-service: %v", err)
	}
}
