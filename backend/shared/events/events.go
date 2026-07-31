package events

// Event routing keys
const (
	OrderCreatedKey      = "order.created"
	InventoryReservedKey = "inventory.reserved"
	InventoryFailedKey   = "inventory.failed"
	PaymentCompletedKey  = "payment.completed"
	PaymentFailedKey     = "payment.failed"
	OrderCancelledKey    = "order.cancelled"
)

// OrderCreatedEvent is published when a user submits an order
type OrderCreatedEvent struct {
	OrderID    string  `json:"order_id"`
	UserID     int     `json:"user_id"`
	BookID     int     `json:"book_id"`
	Quantity   int     `json:"quantity"`
	TotalPrice float64 `json:"total_price"`
}

// OrderCancelledEvent is published when an order is cancelled, releasing reserved stock
type OrderCancelledEvent struct {
	OrderID  string `json:"order_id"`
	BookID   int    `json:"book_id"`
	Quantity int    `json:"quantity"`
}

// InventoryReservedEvent is published when stock is successfully reserved for an order
type InventoryReservedEvent struct {
	OrderID    string  `json:"order_id"`
	UserID     int     `json:"user_id"`
	BookID     int     `json:"book_id"`
	Quantity   int     `json:"quantity"`
	TotalPrice float64 `json:"total_price"`
}

// InventoryFailedEvent is published when stock is unavailable
type InventoryFailedEvent struct {
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
}

// PaymentCompletedEvent is published when mock payment goes through successfully
type PaymentCompletedEvent struct {
	OrderID       string  `json:"order_id"`
	UserID        int     `json:"user_id"`
	Amount        float64 `json:"amount"`
	TransactionID string  `json:"transaction_id"`
}

// PaymentFailedEvent is published when mock payment fails
type PaymentFailedEvent struct {
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
}
