package messaging

import (
	"encoding/json"
	"log"

	"ecommerce/order-service/database"
	"ecommerce/order-service/models"
	"ecommerce/shared/events"
	"ecommerce/shared/messaging"
)

// StartEventSubscriber subscribes to Saga feedback events
func StartEventSubscriber(eb *messaging.EventBus) error {
	// 1. Subscribe to inventory.failed (Item out of stock) -> Cancel Order
	err := eb.Subscribe("order_service_inventory_failed", events.InventoryFailedKey, func(body []byte) error {
		var event events.InventoryFailedEvent
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error parsing InventoryFailedEvent: %v", err)
			return err
		}

		log.Printf("Order ID %s cancelled due to inventory failure: %s", event.OrderID, event.Reason)

		var order models.Order
		if err := database.DB.First(&order, "id = ?", event.OrderID).Error; err != nil {
			log.Printf("Order not found: %s", event.OrderID)
			return err
		}

		order.Status = "CANCELLED"
		if err := database.DB.Save(&order).Error; err != nil {
			log.Printf("Failed to cancel order: %v", err)
			return err
		}

		return nil
	})
	if err != nil {
		return err
	}

	// 2. Subscribe to payment.completed -> Complete Order
	err = eb.Subscribe("order_service_payment_completed", events.PaymentCompletedKey, func(body []byte) error {
		var event events.PaymentCompletedEvent
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error parsing PaymentCompletedEvent: %v", err)
			return err
		}

		log.Printf("Order ID %s completed successfully. Transaction ID: %s", event.OrderID, event.TransactionID)

		var order models.Order
		if err := database.DB.First(&order, "id = ?", event.OrderID).Error; err != nil {
			log.Printf("Order not found: %s", event.OrderID)
			return err
		}

		order.Status = "COMPLETED"
		if err := database.DB.Save(&order).Error; err != nil {
			log.Printf("Failed to complete order: %v", err)
			return err
		}

		return nil
	})
	if err != nil {
		return err
	}

	// 3. Subscribe to payment.failed -> Cancel Order & Rollback Inventory (Compensating Transaction)
	err = eb.Subscribe("order_service_payment_failed", events.PaymentFailedKey, func(body []byte) error {
		var event events.PaymentFailedEvent
		if err := json.Unmarshal(body, &event); err != nil {
			log.Printf("Error parsing PaymentFailedEvent: %v", err)
			return err
		}

		log.Printf("Order ID %s payment failed: %s. Initiating compensating rollback...", event.OrderID, event.Reason)

		var order models.Order
		if err := database.DB.First(&order, "id = ?", event.OrderID).Error; err != nil {
			log.Printf("Order not found: %s", event.OrderID)
			return err
		}

		order.Status = "CANCELLED"
		if err := database.DB.Save(&order).Error; err != nil {
			log.Printf("Failed to cancel order: %v", err)
			return err
		}

		// Compensating transaction: Publish order.cancelled to add back the deducted stock count
		rollbackEvent := events.OrderCancelledEvent{
			OrderID:  order.ID,
			BookID:   order.BookID,
			Quantity: order.Quantity,
		}
		if err := eb.Publish(events.OrderCancelledKey, rollbackEvent); err != nil {
			log.Printf("Failed to publish OrderCancelledEvent for rollback: %v", err)
			return err
		}

		log.Printf("Compensating transaction triggered for Order ID %s.", event.OrderID)
		return nil
	})

	return err
}
