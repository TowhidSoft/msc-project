package models

import (
	"golang.org/x/crypto/bcrypt"
)

// User defines GORM database representation of a user profile
type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `gorm:"not null" json:"-"` // Omit password hash in json responses
	FullName string `json:"full_name"`
	Role     string `gorm:"default:'user'" json:"role"` // 'user' or 'admin'
	IsActive bool   `gorm:"default:true" json:"is_active"`
}

// HashPassword hashes password string into bcrypt hash
func (u *User) HashPassword(plainPassword string) error {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedBytes)
	return nil
}

// CheckPassword checks if input string matches hashed password
func (u *User) CheckPassword(plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(plainPassword))
	return err == nil
}
