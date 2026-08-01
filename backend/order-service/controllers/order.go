package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"

	"ecommerce/order-service/database"
	"ecommerce/order-service/models"
	"ecommerce/shared/events"
	sharedMsg "ecommerce/shared/messaging"

	"github.com/gin-gonic/gin"
)

// CreateOrderInput defines schema for creating order requests
type CreateOrderInput struct {
	UserID   int `json:"user_id" binding:"required"`
	BookID   int `json:"book_id" binding:"required"`
	Quantity int `json:"quantity" binding:"required,min=1"`
}

var eventBus *sharedMsg.EventBus

// SetEventBus binds local event bus reference
func SetEventBus(eb *sharedMsg.EventBus) {
	eventBus = eb
}

// BookResponse defines structure returned by Catalog Service
type BookResponse struct {
	ID    uint    `json:"id"`
	Price float64 `json:"price"`
}

// CreateOrder processes order creation, queries book catalog price, and triggers Saga event
func CreateOrder(c *gin.Context) {
	var input CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch book details from Catalog Service
	catalogURL := os.Getenv("CATALOG_SERVICE_URL")
	if catalogURL == "" {
		catalogURL = "http://localhost:7002"
	}

	resp, err := http.Get(fmt.Sprintf("%s/books/%d", catalogURL, input.BookID))
	if err != nil || resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Failed to fetch book info from catalog-service: %v", err)})
		return
	}
	defer resp.Body.Close()

	var book BookResponse
	if err := json.NewDecoder(resp.Body).Decode(&book); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse catalog response"})
		return
	}

	totalPrice := book.Price * float64(input.Quantity)

	// Generate custom Order ID and write PENDING state
	orderID := fmt.Sprintf("ord_%d", rand.Intn(90000000)+10000000)
	order := models.Order{
		ID:         orderID,
		UserID:     input.UserID,
		BookID:     input.BookID,
		Quantity:   input.Quantity,
		TotalPrice: totalPrice,
		Status:     "PENDING",
	}

	if err := database.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Publish Order Created Event to trigger Saga workflow
	if eventBus != nil {
		orderEvent := events.OrderCreatedEvent{
			OrderID:    order.ID,
			UserID:     order.UserID,
			BookID:     order.BookID,
			Quantity:   order.Quantity,
			TotalPrice: order.TotalPrice,
		}
		err = eventBus.Publish(events.OrderCreatedKey, orderEvent)
		if err != nil {
			log.Printf("Failed to publish OrderCreatedEvent: %v", err)
		}
	} else {
		log.Println("Warning: EventBus not connected, skipping event publication.")
	}

	c.JSON(http.StatusCreated, order)
}

// GetOrders retrieves all order history logs
func GetOrders(c *gin.Context) {
	var orders []models.Order
	if err := database.DB.Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// GetOrder retrieves a single order by its ID
func GetOrder(c *gin.Context) {
	id := c.Param("id")
	var order models.Order
	if err := database.DB.First(&order, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}
