package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"ecommerce/user-service/controllers"
	"ecommerce/user-service/database"
	"ecommerce/user-service/models"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	// Use in-memory shared SQLite database for testing
	os.Setenv("DATABASE_URL", "file::memory:?cache=shared")
	database.InitDB()
	_ = database.DB.AutoMigrate(&models.User{})

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.POST("/register", controllers.Register)
	r.POST("/login", controllers.Login)
	r.GET("/me", controllers.GetProfile)

	return r
}

func TestAuthFlow(t *testing.T) {
	router := setupTestRouter()

	// 1. Test Register
	regPayload := map[string]string{
		"email":     "test@msc.com",
		"password":  "password123",
		"full_name": "Test User",
	}
	regBody, _ := json.Marshal(regPayload)
	req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(regBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status Created (201), got %d. Body: %s", w.Code, w.Body.String())
	}

	var regResponse map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &regResponse)
	if regResponse["email"] != "test@msc.com" {
		t.Errorf("Expected email to be test@msc.com, got %v", regResponse["email"])
	}

	// 2. Test Login
	loginPayload := map[string]string{
		"email":    "test@msc.com",
		"password": "password123",
	}
	loginBody, _ := json.Marshal(loginPayload)
	req, _ = http.NewRequest("POST", "/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d. Body: %s", w.Code, w.Body.String())
	}

	var loginResponse map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &loginResponse)
	token, ok := loginResponse["access_token"].(string)
	if !ok || token == "" {
		t.Errorf("Expected non-empty access_token, got %v", loginResponse["access_token"])
	}

	// 3. Test Profile
	req, _ = http.NewRequest("GET", "/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d. Body: %s", w.Code, w.Body.String())
	}

	var profileResponse map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &profileResponse)
	if profileResponse["full_name"] != "Test User" {
		t.Errorf("Expected profile full_name 'Test User', got %v", profileResponse["full_name"])
	}
}
