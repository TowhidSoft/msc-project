# Stage 1: Build
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy the entire workspace context
COPY . .

RUN go work sync

# Build the specific service binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/user-service ecommerce/user-service

# Stage 2: Runtime
FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/user-service .

EXPOSE 7001

CMD ["./user-service"]
