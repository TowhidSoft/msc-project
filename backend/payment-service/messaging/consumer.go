package messaging

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"ecommerce/payment-service/database"
	"ecommerce/payment-service/models"
	"ecommerce/shared/events"
	"ecommerce/shared/messaging"
)

// StartEventSubscriber subscribes to stock reservation success events to run payments
func StartEventSubscriber(eb *messaging.EventBus) error {
	err := eb.Subscribe("payment_service", events.InventoryReservedKey, func(body []byte) error {
		var event events.InventoryReservedEvent
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error unmarshalling InventoryReservedEvent: %v", err)
			return err
		}

		log.Printf("Processing payment for Order ID %s, User ID %d, Amount $%.2f", event.OrderID, event.UserID, event.TotalPrice)

		// Simulate payment processor delay
		time.Sleep(1 * time.Second)

		// Define a failure case: if the amount is exactly 75.0 (Introduction to Algorithms price), fail it!
		// This enables easy testing of Saga rollback logic.
		var paymentStatus string
		var transactionID string
		var paymentSuccess bool

		if event.TotalPrice == 75.0 {
			paymentSuccess = false
			paymentStatus = "FAILED"
			log.Printf("Payment failed for Order ID %s (Simulation: Insufficient funds)", event.OrderID)
		} else {
			paymentSuccess = true
			paymentStatus = "SUCCESS"
			transactionID = fmt.Sprintf("tx_%d", rand.Intn(90000000)+10000000)
			log.Printf("Payment succeeded for Order ID %s. Tx ID: %s", event.OrderID, transactionID)
		}

		payment := models.Payment{
			OrderID:       event.OrderID,
			UserID:        event.UserID,
			Amount:        event.TotalPrice,
			TransactionID: transactionID,
			Status:        paymentStatus,
		}

		if err := database.DB.Create(&payment).Error; err != nil {
			log.Printf("Failed to record payment in database: %v", err)
			return err
		}

		if paymentSuccess {
			// Publish payment completed event
			completedEvent := events.PaymentCompletedEvent{
				OrderID:       event.OrderID,
				UserID:        event.UserID,
				Amount:        event.TotalPrice,
				TransactionID: transactionID,
			}
			if err := eb.Publish(events.PaymentCompletedKey, completedEvent); err != nil {
				return err
			}
		} else {
			// Publish payment failed event
			failedEvent := events.PaymentFailedEvent{
				OrderID: event.OrderID,
				Reason:  "Card declined (Simulation: Limit Exceeded)",
			}
			if err := eb.Publish(events.PaymentFailedKey, failedEvent); err != nil {
				return err
			}
		}

		return nil
	})

	return err
}
