# Stage 1: Build
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY . .

RUN go work sync

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api-gateway ecommerce/api-gateway

# Stage 2: Runtime
FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/api-gateway .

EXPOSE 8000

CMD ["./api-gateway"]
