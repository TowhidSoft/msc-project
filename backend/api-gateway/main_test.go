package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func TestJWTMiddleware_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.GET("/me", JWTMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest("GET", "/me", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status Unauthorized (401), got %d. Body: %s", w.Code, w.Body.String())
	}
}

func TestJWTMiddleware_Authorized(t *testing.T) {
	// Let's generate a valid token
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.GET("/me", JWTMiddleware(), func(c *gin.Context) {
		email, _ := c.Get("email")
		c.JSON(http.StatusOK, gin.H{"status": "ok", "email": email})
	})

	// Helper to generate token (since we have JWT secret)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &Claims{
		Email: "test@example.com",
		Role:  "user",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	})
	tokenStr, _ := token.SignedString(jwtKey)

	req, _ := http.NewRequest("GET", "/me", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status OK (200), got %d. Body: %s", w.Code, w.Body.String())
	}
}
