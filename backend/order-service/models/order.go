package models

import "time"

// Order defines GORM representation for orders
type Order struct {
	ID         string    `gorm:"primaryKey" json:"id"` // ord_xxxxxxxx
	UserID     int       `gorm:"not null" json:"user_id"`
	BookID     int       `gorm:"not null" json:"book_id"`
	Quantity   int       `gorm:"not null" json:"quantity"`
	TotalPrice float64   `gorm:"not null" json:"total_price"`
	Status     string    `gorm:"not null;default:'PENDING'" json:"status"` // 'PENDING', 'COMPLETED', 'CANCELLED'
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
