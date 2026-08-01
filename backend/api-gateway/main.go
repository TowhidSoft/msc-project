package main

import (
	"errors"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtKey) == 0 {
		jwtKey = []byte("super-secret-msc-project-key-value")
	}
}

// Claims defines JWT payload structure
type Claims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

// ValidateToken parses and validates a token string
func ValidateToken(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// JWTMiddleware validates the bearer token in headers
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		claims, err := ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired authorization token"})
			c.Abort()
			return
		}

		// Set context variables to pass downstream
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// ReverseProxy routes requests to internal services
func ReverseProxy(target string) gin.HandlerFunc {
	targetURL, err := url.Parse(target)
	if err != nil {
		log.Fatalf("Invalid proxy target URL '%s': %v", target, err)
	}
	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	return func(c *gin.Context) {
		// Forward headers & redirect URL host schemes
		c.Request.Host = targetURL.Host
		c.Request.URL.Host = targetURL.Host
		c.Request.URL.Scheme = targetURL.Scheme

		// Optional: add custom routing identity headers from JWT claims
		if email, exists := c.Get("email"); exists {
			c.Request.Header.Set("X-User-Email", email.(string))
		}
		if role, exists := c.Get("role"); exists {
			c.Request.Header.Set("X-User-Role", role.(string))
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func main() {
	// Target URLs for upstream services (Docker compose internal DNS / local ports)
	userServiceURL := os.Getenv("USER_SERVICE_URL")
	if userServiceURL == "" {
		userServiceURL = "http://localhost:7001"
	}

	catalogServiceURL := os.Getenv("CATALOG_SERVICE_URL")
	if catalogServiceURL == "" {
		catalogServiceURL = "http://localhost:7002"
	}

	inventoryServiceURL := os.Getenv("INVENTORY_SERVICE_URL")
	if inventoryServiceURL == "" {
		inventoryServiceURL = "http://localhost:7003"
	}

	orderServiceURL := os.Getenv("ORDER_SERVICE_URL")
	if orderServiceURL == "" {
		orderServiceURL = "http://localhost:7004"
	}

	paymentServiceURL := os.Getenv("PAYMENT_SERVICE_URL")
	if paymentServiceURL == "" {
		paymentServiceURL = "http://localhost:7005"
	}

	router := gin.Default()

	// CORS config middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Public Routes
	router.POST("/register", ReverseProxy(userServiceURL))
	router.POST("/login", ReverseProxy(userServiceURL))
	router.GET("/books", ReverseProxy(catalogServiceURL))
	router.GET("/books/:id", ReverseProxy(catalogServiceURL))

	// Protected Routes (JWT check required)
	protected := router.Group("/")
	protected.Use(JWTMiddleware())
	{
		// User profile
		protected.GET("/me", ReverseProxy(userServiceURL))

		// Orders
		protected.POST("/orders", ReverseProxy(orderServiceURL))
		protected.GET("/orders", ReverseProxy(orderServiceURL))
		protected.GET("/orders/:id", ReverseProxy(orderServiceURL))

		// Inventory
		protected.GET("/inventory", ReverseProxy(inventoryServiceURL))
		protected.GET("/inventory/:book_id", ReverseProxy(inventoryServiceURL))
		protected.POST("/inventory/restock", ReverseProxy(inventoryServiceURL))

		// Payments
		protected.GET("/payments", ReverseProxy(paymentServiceURL))
		protected.GET("/payments/:order_id", ReverseProxy(paymentServiceURL))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "7000"
	}

	log.Printf("API Gateway listening on port %s...", port)
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Gateway failure: %v", err)
	}
}
