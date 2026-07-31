package controllers

import (
	"net/http"
	"strconv"

	"ecommerce/inventory-service/database"
	"ecommerce/inventory-service/models"

	"github.com/gin-gonic/gin"
)

type RestockInput struct {
	BookID   uint `json:"book_id" binding:"required"`
	Quantity int  `json:"quantity" binding:"required,min=1"`
}

// GetInventory lists all stock items in database
func GetInventory(c *gin.Context) {
	var items []models.Inventory
	if err := database.DB.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GetStock fetches stock details for a single Book ID
func GetStock(c *gin.Context) {
	bookIDStr := c.Param("book_id")
	bookID, err := strconv.Atoi(bookIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var item models.Inventory
	if err := database.DB.First(&item, "book_id = ?", bookID).Error; err != nil {
		// Return 0 stock if item doesn't exist in stock tables yet
		c.JSON(http.StatusOK, models.Inventory{BookID: uint(bookID), Stock: 0})
		return
	}

	c.JSON(http.StatusOK, item)
}

// Restock increments inventory stock levels for a book
func Restock(c *gin.Context) {
	var input RestockInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var item models.Inventory
	err := database.DB.First(&item, "book_id = ?", input.BookID).Error
	if err != nil {
		// Create new inventory item
		item = models.Inventory{
			BookID: input.BookID,
			Stock:  input.Quantity,
		}
		if err := database.DB.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create inventory entry"})
			return
		}
	} else {
		// Update existing stock
		item.Stock += input.Quantity
		if err := database.DB.Save(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory"})
			return
		}
	}

	c.JSON(http.StatusOK, item)
}
