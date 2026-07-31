package main

import (
	"log"
	"os"

	"ecommerce/payment-service/controllers"
	"ecommerce/payment-service/database"
	"ecommerce/payment-service/messaging"
	sharedMsg "ecommerce/shared/messaging"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Database connection
	database.InitDB()

	// Run GORM auto-migrations
	err := database.Migrate()
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

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
	router.GET("/payments", controllers.GetPayments)
	router.GET("/payments/:order_id", controllers.GetPaymentByOrderID)

	// Fetch port from environment, fallback to 8005
	port := os.Getenv("PORT")
	if port == "" {
		port = "8005"
	}

	log.Printf("Payment Service listening on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start payment-service: %v", err)
	}
}
