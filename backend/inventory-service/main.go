package main

import (
	"log"
	"os"

	"ecommerce/inventory-service/controllers"
	"ecommerce/inventory-service/database"
	"ecommerce/inventory-service/messaging"
	"ecommerce/inventory-service/models"
	sharedMsg "ecommerce/shared/messaging"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Database connection
	database.InitDB()

	// Auto migrate tables
	err := database.DB.AutoMigrate(&models.Inventory{})
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	// Seed levels
	database.SeedData()

	// Initialize RabbitMQ Connection
	amqpURL := os.Getenv("AMQP_URL")
	if amqpURL == "" {
		amqpURL = "amqp://guest:guest@localhost:5672/"
	}

	eventBus, err := sharedMsg.NewEventBus(amqpURL)
	if err != nil {
		log.Printf("Warning: Failed to connect to RabbitMQ EventBus: %v. Running in API-only mode.", err)
	} else {
		defer eventBus.Close()
		err = messaging.StartEventSubscriber(eventBus)
		if err != nil {
			log.Fatalf("Failed to start event subscriber: %v", err)
		}
	}

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

	// Setup endpoints
	router.GET("/inventory", controllers.GetInventory)
	router.GET("/inventory/:book_id", controllers.GetStock)
	router.POST("/inventory/restock", controllers.Restock)

	// Fetch port from environment, fallback to 7003
	port := os.Getenv("PORT")
	if port == "" {
		port = "7003"
	}

	log.Printf("Inventory Service listening on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start inventory-service: %v", err)
	}
}
