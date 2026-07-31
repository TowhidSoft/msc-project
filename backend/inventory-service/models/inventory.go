package models

// Inventory maps stock counts to specific Book IDs
type Inventory struct {
	BookID uint `gorm:"primaryKey" json:"book_id"`
	Stock  int  `gorm:"default:0" json:"stock"`
}
