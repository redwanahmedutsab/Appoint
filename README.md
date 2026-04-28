# 🗓️ Appointly — Online Appointment Booking System

A full-stack, production-ready appointment booking platform built for Dhaka, Bangladesh. Customers can discover local service providers, browse availability, and book appointments in real time. Providers manage their schedules, services, and earnings through a dedicated dashboard. Admins oversee the entire platform including provider approvals, commission settlement, and dispute resolution.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Zustand, Radix UI |
| **Backend** | Laravel 11, PHP 8.4, Laravel Sanctum, Spatie Permissions |
| **Database** | PostgreSQL 16 |
| **Reverse Proxy** | Nginx (Alpine) |
| **Containerisation** | Docker & Docker Compose |

---

## 📁 Project Structure

```
appointly/
├── frontend/                     # Next.js 14 app
│   └── src/
│       ├── app/
│       │   ├── (public)/         # Public-facing pages
│       │   │   └── providers/    # Provider listing & detail
│       │   ├── (dashboard)/      # Authenticated dashboards
│       │   │   ├── dashboard/    # Customer: bookings, favourites, profile
│       │   │   ├── provider/     # Provider: services, availability, earnings
│       │   │   └── admin/        # Admin: users, providers, commissions, disputes
│       │   ├── auth/             # Login & register
│       │   └── become-provider/  # Provider onboarding flow
│       ├── components/           # Reusable UI components
│       ├── lib/                  # Axios API client, utilities
│       ├── store/                # Zustand auth store
│       └── types/                # TypeScript interfaces
│
├── backend/                      # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # AuthController, ProviderController,
│   │   │   │                     # AvailabilityController, BookingController,
│   │   │   │                     # ServiceController, AdminController,
│   │   │   │                     # ReviewController, FavoriteController
│   │   │   ├── Middleware/       # RoleMiddleware (RBAC)
│   │   │   └── Requests/         # Form request validation
│   │   └── Models/               # Eloquent models
│   ├── database/
│   │   ├── migrations/           # PostgreSQL schema
│   │   └── seeders/              # Base + dummy data seeders
│   └── routes/api.php            # All API route definitions
│
├── nginx/                        # Reverse proxy config
└── docker-compose.yml            # Full-stack orchestration
```

---

## ⚡ Quick Start (Docker)

### Prerequisites

- Docker ≥ 24 and Docker Compose v2
- Git

### 1. Clone and configure

```bash
git clone https://github.com/your-org/appointly.git
cd appointly
```

Create a `.env` file in the project root (alongside `docker-compose.yml`):

```env
APP_KEY=                        # Generate below
DB_PASSWORD=appointly_secret
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### 2. Generate the Laravel app key

```bash
docker run --rm -v $(pwd)/backend:/app composer:latest \
  sh -c "cd /app && composer install && php artisan key:generate --show"
```

Copy the output (`base64:...`) into `APP_KEY` in your `.env`.

### 3. Build and start all services

```bash
docker-compose up -d --build
```

This starts four containers: `appointly_postgres`, `appointly_backend`, `appointly_frontend`, `appointly_nginx`.

### 4. Run migrations and seed base data

```bash
docker exec -it appointly_backend php artisan migrate --seed
```

### 5. (Optional) Seed dummy data for development

```bash
docker exec -it appointly_backend php artisan db:seed --class=DummyDataSeeder
```

### 6. Open the app

| Service | URL |
|---|---|
| App (via Nginx) | http://localhost |
| Frontend (direct) | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@appointly.com.bd` | `Admin@1234` |
| Provider (Salon) | `shirin@provider.com` | `Password@123` |
| Provider (Clinic) | `tarek@provider.com` | `Password@123` |
| Provider (Laundry) | `cleanfast@provider.com` | `Password@123` |
| Provider (Legal) | `legalease@provider.com` | `Password@123` |
| Provider (Coaching) | `brightmind@provider.com` | `Password@123` |
| Customer | `rahim@example.com` | `Password@123` |

> ⚠️ Change the admin password immediately after first login in any environment.

---

## 🔧 Manual Setup (Without Docker)

### Backend

```bash
cd backend
composer install
cp .env.example .env

# Edit .env: set DB_CONNECTION=pgsql, DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
php artisan key:generate
php artisan migrate --seed
php artisan db:seed --class=DummyDataSeeder   # optional dummy data
php artisan storage:link
php artisan serve --port=8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev
```

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `users` | All platform users — customers, providers, admins |
| `service_categories` | 5 predefined categories (Salons, Clinics, Laundry, Consultancy, Tuition) |
| `neighborhoods` | 67 Dhaka DNCC/DSCC neighbourhoods |
| `provider_profiles` | Business profiles with approval workflow and rating aggregates |
| `services` | Services offered by each provider (name, price, duration) |
| `availability_slots` | Time slots generated by providers, with booked/blocked flags |
| `bookings` | Appointment records with status lifecycle |
| `reviews` | One rating + review per completed booking |
| `commission_records` | 5% commission per booking for admin settlement |
| `favorite_providers` | Customer-saved providers (many-to-many) |
| `disputes` | Booking complaints with resolution workflow |

---

## 👤 User Roles

### Customer (`user`)
- Browse and search providers by category and neighbourhood
- View provider profiles, services, and reviews
- Book, cancel, and reschedule appointments
- Submit reviews after completed bookings
- Maintain a list of favourite providers

### Provider (`provider`)
- Create and manage a business profile (pending admin approval)
- Add, edit, and deactivate services
- Generate availability slots for any date range
- Block individual slots (e.g. lunch, personal time)
- Confirm, complete, or mark bookings as no-shows
- View earnings and commission breakdown

### Admin (`admin`)
- Approve, reject, or suspend provider profiles
- Full visibility into all users, bookings, and disputes
- Manage service categories
- View and settle commission records; export CSV reports
- Resolve customer-provider disputes

---

## 🔐 API Reference

**Base URL:** `http://localhost:8000/api/v1`

All authenticated endpoints require:
```
Authorization: Bearer <token>
Accept: application/json
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login, returns Sanctum token |
| `POST` | `/logout` | ✅ | Revoke current token |
| `GET` | `/me` | ✅ | Get authenticated user |
| `PATCH` | `/me` | ✅ | Update name, phone, avatar |
| `POST` | `/change-password` | ✅ | Change password |

### Public Discovery

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/providers` | List providers — filterable by `category`, `neighborhood`, `search` |
| `GET` | `/providers/{slug}` | Provider detail with services and reviews |
| `GET` | `/providers/{id}/slots?date=YYYY-MM-DD` | Available (unbooked, unblocked) slots |
| `GET` | `/providers/{id}/reviews` | Paginated reviews |
| `GET` | `/categories` | All active service categories |
| `GET` | `/neighborhoods` | All active Dhaka neighbourhoods |

### Bookings (Customer)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/bookings` | Customer's own bookings |
| `POST` | `/bookings` | Create booking `{service_id, slot_id, notes?}` |
| `GET` | `/bookings/{id}` | Single booking detail |
| `POST` | `/bookings/{id}/cancel` | Cancel with optional `{reason}` |
| `POST` | `/bookings/{id}/reschedule` | Reschedule `{slot_id}` |
| `POST` | `/bookings/{id}/review` | Submit `{rating, review_text?}` |

### Favourites

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/favorites` | Saved providers |
| `POST` | `/favorites/{provider}/toggle` | Add or remove favourite |

### Provider Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/provider/dashboard` | Stats: bookings, revenue, pending |
| `GET` | `/provider/profile` | Own profile |
| `POST` | `/provider/profile` | Create profile (onboarding) |
| `PATCH` | `/provider/profile` | Update profile |
| `GET` | `/provider/services` | List own services |
| `POST` | `/provider/services` | Create service |
| `PATCH` | `/provider/services/{id}` | Edit service |
| `DELETE` | `/provider/services/{id}` | Soft-delete service |
| `GET` | `/provider/slots?from=&to=` | View own slots |
| `POST` | `/provider/slots/generate` | Bulk generate slots |
| `PATCH` | `/provider/slots/{id}/toggle-block` | Block / unblock a slot |
| `DELETE` | `/provider/slots` | Delete future unbooked slots `{from, to}` |
| `GET` | `/provider/bookings` | Incoming bookings |
| `PATCH` | `/provider/bookings/{id}/status` | Update status `{status}` |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/dashboard` | Platform-wide stats |
| `GET` | `/admin/providers` | All providers with approval status |
| `POST` | `/admin/providers/{id}/approve` | Approve provider |
| `POST` | `/admin/providers/{id}/suspend` | Suspend provider |
| `GET` | `/admin/users` | All users |
| `PATCH` | `/admin/users/{id}/toggle-status` | Activate / suspend user |
| `GET` | `/admin/bookings` | All bookings |
| `GET` | `/admin/commissions` | Commission records |
| `POST` | `/admin/commissions/settle` | Mark commissions as settled |
| `GET` | `/admin/commissions/export` | Download CSV report |
| `GET` | `/admin/categories` | Manage categories |
| `POST` | `/admin/categories` | Create category |
| `PATCH` | `/admin/categories/{id}` | Edit category |
| `GET` | `/admin/disputes` | All disputes |
| `PATCH` | `/admin/disputes/{id}/resolve` | Resolve dispute `{resolution}` |

---

## 🌱 Seeding

```bash
# Core reference data (categories, neighbourhoods, admin user)
php artisan db:seed

# Or run individual seeders
php artisan db:seed --class=ServiceCategorySeeder
php artisan db:seed --class=NeighborhoodSeeder
php artisan db:seed --class=AdminUserSeeder

# Dummy data (5 providers, 5 customers, services, slots, bookings, reviews)
php artisan db:seed --class=DummyDataSeeder

# Full reset and re-seed
php artisan migrate:fresh --seed
php artisan db:seed --class=DummyDataSeeder
```

The `DummyDataSeeder` creates:

- 5 approved providers across all 5 categories
- ~16 services with realistic BDT pricing
- ~140 availability slots across the next 14 days
- ~56 bookings (mix of `pending`, `confirmed`, `completed`)
- Reviews and commission records for all completed bookings

---

## 💰 Revenue Model

- **Commission rate:** 5% of every completed booking
- **Settlement:** Manual weekly settlement by admin via bank transfer or bKash
- **Reporting:** Admins can filter by provider and date range, then export a CSV
- **Phase 1 scope:** No payment gateway — cash/mobile payment outside the platform

---

## 🛡️ Security

- **Laravel Sanctum** for token-based API authentication
- **Bcrypt** password hashing (rounds: 12)
- **Custom `RoleMiddleware`** for role-based access control (`user`, `provider`, `admin`)
- **Form request validation** on all write endpoints
- **Soft deletes** to preserve booking history and audit trails
- **Unique constraint** on `(provider_id, date, start_time)` prevents duplicate slots
- **DB-level transaction** wrapping slot generation to prevent race conditions

---

## 🚀 Production Deployment

### Environment variables (backend)

```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:your-key-here
APP_URL=https://appointly.com.bd

DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=appointly
DB_USERNAME=appointly_user
DB_PASSWORD=your-strong-password

SANCTUM_STATEFUL_DOMAINS=appointly.com.bd
FRONTEND_URL=https://appointly.com.bd
```

### Environment variables (frontend)

```env
NEXT_PUBLIC_API_URL=https://appointly.com.bd/api/v1
NEXT_PUBLIC_APP_NAME=Appointly
```

### Deploy commands

```bash
docker-compose -f docker-compose.yml up -d --build

docker exec appointly_backend php artisan migrate --force
docker exec appointly_backend php artisan config:cache
docker exec appointly_backend php artisan route:cache
docker exec appointly_backend php artisan view:cache
```

---

## 📋 Known Limitations (Phase 1 Scope)

Per the original SRS, the following are intentionally out of scope for Phase 1:

- ❌ Payment gateway (bKash / Nagad / SSLCommerz)
- ❌ SMS or email notifications
- ❌ Google Maps or geolocation search
- ❌ Progressive Web App (PWA) / offline support
- ❌ Multi-language / Bangla localisation
- ❌ Multi-branch provider management

---

## 🤝 Contributing

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Follow the existing code style — `php artisan pint` for PHP, ESLint for TypeScript.
3. Write a clear commit message using conventional commits (`feat:`, `fix:`, `chore:`).
4. Open a pull request against `main` with a description of the change.

---

Built with ❤️ for Dhaka — Appointly © 2026
