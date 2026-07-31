package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"ecommerce/catalog-service/controllers"
	"ecommerce/catalog-service/database"
	"ecommerce/catalog-service/models"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	// Set in-memory database for testing
	os.Setenv("DATABASE_URL", "file::memory:?cache=shared")
	database.InitDB()
	_ = database.DB.AutoMigrate(&models.Book{})
	database.SeedData() // Seed sample data

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.GET("/books", controllers.GetBooks)
	r.GET("/books/:id", controllers.GetBook)
	r.POST("/books", controllers.CreateBook)
	r.PUT("/books/:id", controllers.UpdateBook)
	r.DELETE("/books/:id", controllers.DeleteBook)

	return r
}

func TestGetBooks(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest("GET", "/books", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}

	var books []models.Book
	_ = json.Unmarshal(w.Body.Bytes(), &books)
	if len(books) == 0 {
		t.Errorf("Expected books list to contain elements, got 0")
	}
}

func TestGetBooksWithFilters(t *testing.T) {
	router := setupTestRouter()

	// Filter by category
	req, _ := http.NewRequest("GET", "/books?category=System%20Design", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var books []models.Book
	_ = json.Unmarshal(w.Body.Bytes(), &books)
	for _, book := range books {
		if book.Category != "System Design" {
			t.Errorf("Expected book category System Design, got %s", book.Category)
		}
	}

	// Filter by search query
	req, _ = http.NewRequest("GET", "/books?search=Pragmatic", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	_ = json.Unmarshal(w.Body.Bytes(), &books)
	if len(books) != 1 || books[0].Title != "The Pragmatic Programmer" {
		t.Errorf("Expected 1 book matching search 'Pragmatic', got %d", len(books))
	}
}

func TestGetBookDetails(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest("GET", "/books/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d", w.Code)
	}

	var book models.Book
	_ = json.Unmarshal(w.Body.Bytes(), &book)
	if book.ID != 1 {
		t.Errorf("Expected book ID 1, got %d", book.ID)
	}
}

func TestCreateBook(t *testing.T) {
	router := setupTestRouter()

	newBook := map[string]interface{}{
		"title":       "Test Novel",
		"author":      "John Doe",
		"category":    "Fiction",
		"description": "Just a test fiction book.",
		"price":       19.99,
		"image_url":   "http://example.com/cover.jpg",
	}

	body, _ := json.Marshal(newBook)
	req, _ := http.NewRequest("POST", "/books", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status Created (201), got %d", w.Code)
	}

	var created models.Book
	_ = json.Unmarshal(w.Body.Bytes(), &created)
	if created.Title != "Test Novel" {
		t.Errorf("Expected created book title 'Test Novel', got %s", created.Title)
	}
}
