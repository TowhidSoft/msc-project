package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// EventBus wraps RabbitMQ connections and channel details
type EventBus struct {
	conn     *amqp.Connection
	channel  *amqp.Channel
	exchange string
}

// NewEventBus connects to RabbitMQ and declares the default e-commerce topic exchange
func NewEventBus(amqpURL string) (*EventBus, error) {
	var conn *amqp.Connection
	var err error

	// Retry connection loop to handle service startup delays
	for i := 0; i < 15; i++ {
		conn, err = amqp.Dial(amqpURL)
		if err == nil {
			break
		}
		log.Printf("Failed to connect to RabbitMQ (attempt %d/15): %v", i+1, err)
		time.Sleep(4 * time.Second)
	}

	if err != nil {
		return nil, fmt.Errorf("could not connect to RabbitMQ after retries: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open a channel: %w", err)
	}

	exchangeName := "ecommerce_events"
	err = ch.ExchangeDeclare(
		exchangeName, // name
		"topic",      // type
		true,         // durable
		false,        // auto-deleted
		false,        // internal
		false,        // no-wait
		nil,          // arguments
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}

	return &EventBus{
		conn:     conn,
		channel:  ch,
		exchange: exchangeName,
	}, nil
}

// Publish sends an event serialized to JSON to the topic exchange
func (eb *EventBus) Publish(routingKey string, event interface{}) error {
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = eb.channel.PublishWithContext(ctx,
		eb.exchange, // exchange
		routingKey,  // routing key
		false,       // mandatory
		false,       // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	log.Printf("Published event on '%s': %s", routingKey, string(body))
	return nil
}

// Subscribe listens to messages on a queue bound to the given routing key and runs the handler
func (eb *EventBus) Subscribe(queueName, routingKey string, handler func([]byte) error) error {
	q, err := eb.channel.QueueDeclare(
		queueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	err = eb.channel.QueueBind(
		q.Name,      // queue name
		routingKey,  // routing key
		eb.exchange, // exchange
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to bind queue: %w", err)
	}

	msgs, err := eb.channel.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	go func() {
		for d := range msgs {
			log.Printf("Received message on '%s' in queue '%s'", routingKey, queueName)
			err := handler(d.Body)
			if err != nil {
				log.Printf("Error processing message in %s: %v", queueName, err)
				// Nack and discard (requeue = false) to avoid infinite loops on bad payloads
				d.Nack(false, false)
			} else {
				d.Ack(false)
			}
		}
	}()

	log.Printf("Subscribed to queue '%s' with routing key '%s'", queueName, routingKey)
	return nil
}

// Close gracefully terminates connections
func (eb *EventBus) Close() {
	if eb.channel != nil {
		eb.channel.Close()
	}
	if eb.conn != nil {
		eb.conn.Close()
	}
}
