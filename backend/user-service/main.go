package main

import (
	"log"
	"os"

	"ecommerce/user-service/controllers"
	"ecommerce/user-service/database"
	"ecommerce/user-service/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Database connection
	database.InitDB()

	// Run GORM migrations to create user tables
	err := database.DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	router := gin.Default()

	// Standard CORS configuration middleware
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

	// Setup endpoints
	router.POST("/register", controllers.Register)
	router.POST("/login", controllers.Login)
	router.GET("/me", controllers.GetProfile)

	// Fetch port from environment, fallback to 7001
	port := os.Getenv("PORT")
	if port == "" {
		port = "7001"
	}

	log.Printf("User Service listening on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start user-service: %v", err)
	}
}
