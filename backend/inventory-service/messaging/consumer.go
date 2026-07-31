package messaging

import (
	"encoding/json"
	"log"

	"ecommerce/inventory-service/database"
	"ecommerce/inventory-service/models"
	"ecommerce/shared/events"
	"ecommerce/shared/messaging"

	"gorm.io/gorm"
)

// StartEventSubscriber sets up the consumer for order created events
func StartEventSubscriber(eb *messaging.EventBus) error {
	err := eb.Subscribe("inventory_service", events.OrderCreatedKey, func(body []byte) error {
		var event events.OrderCreatedEvent
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error unmarshalling OrderCreatedEvent: %v", err)
			return err
		}

		log.Printf("Processing stock reservation for Order ID %s, Book ID %d, Qty %d", event.OrderID, event.BookID, event.Quantity)

		_ = database.DB.Transaction(func(tx *gorm.DB) error {
			var inv models.Inventory
			if err := tx.First(&inv, "book_id = ?", event.BookID).Error; err != nil {
				log.Printf("Inventory check failed: Book ID %d not found", event.BookID)
				failEvent := events.InventoryFailedEvent{
					OrderID: event.OrderID,
					Reason:  "Item not found in inventory catalog",
				}
				_ = eb.Publish(events.InventoryFailedKey, failEvent)
				return err
			}

			if inv.Stock < event.Quantity {
				log.Printf("Inventory check failed: Shortage for Book ID %d. Stock: %d, Ordered: %d", event.BookID, inv.Stock, event.Quantity)
				failEvent := events.InventoryFailedEvent{
					OrderID: event.OrderID,
					Reason:  "Out of stock",
				}
				_ = eb.Publish(events.InventoryFailedKey, failEvent)
				return gorm.ErrRecordNotFound
			}

			// Sufficient stock: decrement stock count
			inv.Stock -= event.Quantity
			if err := tx.Save(&inv).Error; err != nil {
				return err
			}

			// Publish reservation success event
			successEvent := events.InventoryReservedEvent{
				OrderID:    event.OrderID,
				UserID:     event.UserID,
				BookID:     event.BookID,
				Quantity:   event.Quantity,
				TotalPrice: event.TotalPrice,
			}
			if err := eb.Publish(events.InventoryReservedKey, successEvent); err != nil {
				return err
			}

			log.Printf("Successfully reserved stock for Order ID %s. Remaining: %d", event.OrderID, inv.Stock)
			return nil
		})

		// Return nil so RabbitMQ acknowledges message as processed (since we published our status outcome)
		return nil
	})
	if err != nil {
		return err
	}

	// Subscribe to order.cancelled to release stock (rollback)
	err = eb.Subscribe("inventory_service_rollback", events.OrderCancelledKey, func(body []byte) error {
		var event events.OrderCancelledEvent
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error unmarshalling OrderCancelledEvent: %v", err)
			return err
		}

		log.Printf("Processing stock release for Order ID %s, Book ID %d, Qty %d", event.OrderID, event.BookID, event.Quantity)

		_ = database.DB.Transaction(func(tx *gorm.DB) error {
			var inv models.Inventory
			if err := tx.First(&inv, "book_id = ?", event.BookID).Error; err != nil {
				log.Printf("Inventory release failed: Book ID %d not found", event.BookID)
				return err
			}

			inv.Stock += event.Quantity
			if err := tx.Save(&inv).Error; err != nil {
				return err
			}

			log.Printf("Successfully released stock for Order ID %s. New stock: %d", event.OrderID, inv.Stock)
			return nil
		})
		return nil
	})

	return err
}
