# BookStore — Cloud-Native Microservices E-Commerce

> MSc Project: Migration of a Monolithic E-Commerce System to a Cloud-Native Microservices Architecture  
> Student: Md Nazmul Hasan (23106678)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (web/)                   │
│             TypeScript · Tailwind CSS · Zustand              │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway :7000 (Go/Gin)                  │
│           JWT Middleware · Reverse Proxy Router              │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
:7001      :7002      :7003      :7004      :7005
User      Catalog   Inventory   Order     Payment
Service   Service   Service     Service   Service
  │                    ▲          │  ▲       ▲
  │                    │          │  │       │
  └────────────────────┴──────────┘  │       │
         RabbitMQ (Saga Choreography) │       │
  ┌─────────────────────────────────┘       │
  │   order.created ──────────────────────► │
  │   inventory.reserved ──────────────────►│
  │   payment.completed/failed ◄────────────┘
  │   order.cancelled (rollback) ──────────►inventory
  └──────────────────────────────────────────────────
```

## Services

| Service | Port | Responsibility |
|---------|------|----------------|
| **API Gateway** | 7000 | JWT auth, reverse proxy routing |
| **User Service** | 7001 | Registration, login, JWT, bcrypt |
| **Catalog Service** | 7002 | Book CRUD, search, category filter |
| **Inventory Service** | 7003 | Stock management, Saga stock reservation |
| **Order Service** | 7004 | Order creation, Saga state machine |
| **Payment Service** | 7005 | Mock payment processing, Saga completion |

## Saga Choreography Flow

```
User places order
      │
      ▼
Order Service  ──── publishes ────► order.created
                                          │
                                          ▼
                               Inventory Service
                             (checks & reserves stock)
                                    │          │
                             success▼     fail ▼
                        inventory.reserved   inventory.failed
                               │                    │
                               ▼                    ▼
                        Payment Service       Order → CANCELLED
                        (mock payment)
                               │          │
                          success▼     fail ▼
                      payment.completed  payment.failed
                               │                    │
                               ▼                    ▼
                       Order → COMPLETED    Order → CANCELLED
                                            + order.cancelled
                                            (stock rollback)
```

## Tech Stack

**Backend:**
- Go 1.22 · Gin-Gonic · GORM
- SQLite (per-service database isolation)
- RabbitMQ (`amqp091-go`) — event-driven Saga choreography
- JWT (`golang-jwt/jwt/v5`) · bcrypt authentication

**Frontend:**
- Next.js 15 (App Router) · TypeScript
- Tailwind CSS · Custom CSS design system
- Zustand (auth + cart state) · React Query · Axios
- Glassmorphism UI with micro-animations

**DevOps:**
- Docker (multi-stage Alpine builds per service)
- Docker Compose (local orchestration)
- Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, Ingress)
- GitHub Actions CI/CD pipeline

---

## Getting Started

### Prerequisites
- Go 1.22+
- Node.js 20+
- Docker & Docker Compose
- RabbitMQ (or use Docker Compose)

### Run the Full Stack Locally

```bash
# 1. Start all backend services + RabbitMQ via Docker Compose
cd backend
docker-compose up --build

# 2. Start the Next.js frontend
cd web
cp .env.local.example .env.local   # or edit .env.local
npm install
npm run dev
```

Frontend is available at: **http://localhost:3000**  
API Gateway at: **http://localhost:7000**  
RabbitMQ Dashboard: **http://localhost:15672** (guest/guest)

### Run Backend Services Locally (without Docker)

```bash
# Terminal 1 — RabbitMQ (Docker required)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Terminal 2-6 — Start each service
cd backend/user-service    && go run . &
cd backend/catalog-service && go run . &
cd backend/inventory-service && go run . &
cd backend/order-service   && go run . &
cd backend/payment-service && go run . &
cd backend/api-gateway     && go run .
```

### Run Unit Tests

```bash
# Run all service tests
cd backend/user-service      && go test -v
cd backend/catalog-service   && go test -v
cd backend/inventory-service && go test -v
cd backend/payment-service   && go test -v
cd backend/order-service     && go test -v
cd backend/api-gateway       && go test -v
```

---

## API Reference

All requests go through the API Gateway at `http://localhost:7000`.

### Public Routes (no auth required)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/register` | Create user account |
| `POST` | `/login` | Authenticate and get JWT token |
| `GET` | `/books` | List all books (supports `?search=&category=`) |
| `GET` | `/books/:id` | Get single book details |

### Protected Routes (Bearer JWT required)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me` | Get authenticated user profile |
| `POST` | `/orders` | Place a new order (triggers Saga) |
| `GET` | `/orders` | Get all orders |
| `GET` | `/orders/:id` | Get order by ID |
| `GET` | `/inventory` | List all stock levels |
| `GET` | `/inventory/:book_id` | Get stock for a book |
| `POST` | `/inventory/restock` | Add stock to a book |
| `GET` | `/payments` | Get all payment records |
| `GET` | `/payments/:order_id` | Get payment by order ID |

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Book catalog with search and category filter |
| `/books/:id` | Book detail with add-to-cart |
| `/login` | JWT authentication login |
| `/register` | User account registration |
| `/cart` | Shopping cart with checkout |
| `/orders` | Order history with status badges |
| `/orders/:id` | Order detail with Saga progress tracker and payment info |
| `/admin/inventory` | Inventory management dashboard |
| `/admin/dashboard` | Admin analytics and order overview |

---

## Project Structure

```
Msc project/
├── backend/
│   ├── go.work                    # Go workspace
│   ├── docker-compose.yml         # Local orchestration
│   ├── shared/
│   │   ├── events/events.go       # Shared Saga event definitions
│   │   └── messaging/rabbitmq.go  # RabbitMQ EventBus wrapper
│   ├── api-gateway/               # :7000 — JWT proxy
│   ├── user-service/              # :7001 — Auth
│   ├── catalog-service/           # :7002 — Books
│   ├── inventory-service/         # :7003 — Stock
│   ├── order-service/             # :7004 — Orders + Saga
│   ├── payment-service/           # :7005 — Payments
│   └── k8s/                       # Kubernetes manifests
│       ├── configmap.yaml
│       ├── secrets.yaml
│       ├── rabbitmq-deployment.yaml
│       ├── user-service.yaml
│       ├── catalog-service.yaml
│       ├── inventory-service.yaml
│       ├── order-service.yaml
│       ├── payment-service.yaml
│       └── api-gateway.yaml
├── web/                           # Next.js frontend
│   ├── src/
│   │   ├── app/                   # App Router pages
│   │   ├── components/            # Shared components
│   │   ├── lib/api.ts             # Axios API client
│   │   └── store/                 # Zustand state stores
│   └── .env.local
└── .github/
    └── workflows/backend-ci.yml  # GitHub Actions CI/CD
```
