package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"ecommerce/inventory-service/controllers"
	"ecommerce/inventory-service/database"
	"ecommerce/inventory-service/models"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	// Set in-memory database for testing
	os.Setenv("DATABASE_URL", "file::memory:?cache=shared")
	database.InitDB()
	_ = database.DB.AutoMigrate(&models.Inventory{})
	database.SeedData() // Seed book stocks

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.GET("/inventory", controllers.GetInventory)
	r.GET("/inventory/:book_id", controllers.GetStock)
	r.POST("/inventory/restock", controllers.Restock)

	return r
}

func TestGetInventory(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest("GET", "/inventory", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}

	var items []models.Inventory
	_ = json.Unmarshal(w.Body.Bytes(), &items)
	if len(items) != 5 {
		t.Errorf("Expected 5 seeded inventory items, got %d", len(items))
	}
}

func TestGetStock(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest("GET", "/inventory/2", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}

	var item models.Inventory
	_ = json.Unmarshal(w.Body.Bytes(), &item)
	if item.BookID != 2 || item.Stock != 15 {
		t.Errorf("Expected Book ID 2 with stock 15, got ID %d with stock %d", item.BookID, item.Stock)
	}
}

func TestRestock(t *testing.T) {
	router := setupTestRouter()

	restockPayload := map[string]interface{}{
		"book_id":  2,
		"quantity": 10,
	}

	body, _ := json.Marshal(restockPayload)
	req, _ := http.NewRequest("POST", "/inventory/restock", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d. Body: %s", w.Code, w.Body.String())
	}

	var updated models.Inventory
	_ = json.Unmarshal(w.Body.Bytes(), &updated)
	if updated.BookID != 2 || updated.Stock != 25 {
		t.Errorf("Expected Book ID 2 with stock 25 after restock, got ID %d with stock %d", updated.BookID, updated.Stock)
	}
}
