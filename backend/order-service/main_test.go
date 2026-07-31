package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"ecommerce/order-service/controllers"
	"ecommerce/order-service/database"
	"ecommerce/order-service/models"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() (*gin.Engine, *httptest.Server) {
	// 1. Setup mock Catalog Service
	mockCatalog := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"id": 2, "price": 34.50}`))
	}))

	// Set CATALOG_SERVICE_URL env variable to mock server
	os.Setenv("CATALOG_SERVICE_URL", mockCatalog.URL)

	// 2. Set in-memory database for testing
	os.Setenv("DATABASE_URL", "file::memory:?cache=shared")
	database.InitDB()
	_ = database.Migrate()

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.POST("/orders", controllers.CreateOrder)
	r.GET("/orders", controllers.GetOrders)
	r.GET("/orders/:id", controllers.GetOrder)

	return r, mockCatalog
}

func TestOrderCreationAndRetrieval(t *testing.T) {
	router, mockCatalog := setupTestRouter()
	defer mockCatalog.Close()

	// 1. Test Create Order
	orderPayload := map[string]interface{}{
		"user_id":  1,
		"book_id":  2,
		"quantity": 2,
	}
	body, _ := json.Marshal(orderPayload)
	req, _ := http.NewRequest("POST", "/orders", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status Created (201), got %d. Body: %s", w.Code, w.Body.String())
	}

	var created models.Order
	_ = json.Unmarshal(w.Body.Bytes(), &created)
	if created.BookID != 2 || created.Quantity != 2 || created.TotalPrice != 69.00 || created.Status != "PENDING" {
		t.Errorf("Unexpected created order fields: %+v", created)
	}

	// 2. Test Get Orders List
	req, _ = http.NewRequest("GET", "/orders", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}

	var orders []models.Order
	_ = json.Unmarshal(w.Body.Bytes(), &orders)
	if len(orders) != 1 || orders[0].ID != created.ID {
		t.Errorf("Expected 1 order in list matching created order, got %d orders", len(orders))
	}

	// 3. Test Get Single Order
	req, _ = http.NewRequest("GET", "/orders/"+created.ID, nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}
}
