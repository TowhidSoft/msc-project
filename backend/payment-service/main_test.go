package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"ecommerce/payment-service/controllers"
	"ecommerce/payment-service/database"
	"ecommerce/payment-service/models"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	// Set in-memory database for testing
	os.Setenv("DATABASE_URL", "file::memory:?cache=shared")
	database.InitDB()
	_ = database.Migrate()

	// Seed one dummy payment
	dummy := models.Payment{
		OrderID:       "ord_test123",
		UserID:        1,
		Amount:        39.99,
		TransactionID: "tx_12345678",
		Status:        "SUCCESS",
		CreatedAt:     time.Now(),
	}
	_ = database.DB.Create(&dummy)

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.GET("/payments", controllers.GetPayments)
	r.GET("/payments/:order_id", controllers.GetPaymentByOrderID)

	return r
}

func TestGetPayments(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest("GET", "/payments", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}

	var payments []models.Payment
	_ = json.Unmarshal(w.Body.Bytes(), &payments)
	if len(payments) != 1 || payments[0].OrderID != "ord_test123" {
		t.Errorf("Expected 1 payment with OrderID ord_test123, got %d payments", len(payments))
	}
}

func TestGetPaymentByOrderID(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest("GET", "/payments/ord_test123", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}

	var payment models.Payment
	_ = json.Unmarshal(w.Body.Bytes(), &payment)
	if payment.Status != "SUCCESS" || payment.TransactionID != "tx_12345678" {
		t.Errorf("Expected SUCCESS transaction tx_12345678, got Status %s with TxID %s", payment.Status, payment.TransactionID)
	}
}
