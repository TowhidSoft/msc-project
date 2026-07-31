package models

// Book defines the schema for database and json responses of catalog items
type Book struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Title       string  `gorm:"not null" json:"title"`
	Author      string  `gorm:"not null" json:"author"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Price       float64 `gorm:"not null" json:"price"`
	ImageURL    string  `json:"image_url"`
}
