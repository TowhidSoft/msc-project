package models

import "time"

// Payment defines GORM model for payment logs
type Payment struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	OrderID       string    `gorm:"uniqueIndex;not null" json:"order_id"`
	UserID        int       `gorm:"not null" json:"user_id"`
	Amount        float64   `gorm:"not null" json:"amount"`
	TransactionID string    `json:"transaction_id"`
	Status        string    `gorm:"not null" json:"status"` // 'SUCCESS' or 'FAILED'
	CreatedAt     time.Time `json:"created_at"`
}
