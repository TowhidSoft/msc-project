# Stage 1: Build
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY . .

RUN go work sync

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/catalog-service ecommerce/catalog-service

# Stage 2: Runtime
FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/catalog-service .

EXPOSE 7002

CMD ["./catalog-service"]
