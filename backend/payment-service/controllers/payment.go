package controllers

import (
	"net/http"

	"ecommerce/payment-service/database"
	"ecommerce/payment-service/models"

	"github.com/gin-gonic/gin"
)

// GetPayments lists all payment transaction logs
func GetPayments(c *gin.Context) {
	var payments []models.Payment
	if err := database.DB.Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}
	c.JSON(http.StatusOK, payments)
}

// GetPaymentByOrderID fetches payment details for a specific order
func GetPaymentByOrderID(c *gin.Context) {
	orderID := c.Param("order_id")

	var payment models.Payment
	if err := database.DB.First(&payment, "order_id = ?", orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment record not found for this order"})
		return
	}

	c.JSON(http.StatusOK, payment)
}
