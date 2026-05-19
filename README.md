# Digital Publishing Management System

A premium, full-featured administrative workspace designed for pair-programming and developer technical assessments. This repository houses a complete fullstack application consisting of a robust REST API backend built on Laravel 12 and a premium admin dashboard frontend built on Next.js (App Router) with Tailwind CSS v4.

---

## 🌟 Key Features

### 🔒 Core Authentication
*   **JWT-Auth Security**: Fast stateless authentication powered by `tymon/jwt-auth`.
*   **Token Refresh Cycle**: Dynamic token refreshing and automatic session expiration handling.
*   **Protected View Routing**: Client-side route shielding and server-side request middleware.

### 📚 Business Entities
1.  **Authors Registry**: Track names, rich biographies, and dates of birth, with aggregated volume count metrics.
2.  **Publishing Houses**: Coordinate corporate phone indices and physical headquarters directories.
3.  **Active Books Catalog**: Maintain inventory stock, pricing metrics, release dates, mapped directly to authors and publishers.

### 💻 Premium Admin UI
*   **Modern Theme**: Sleek slate-indigo color harmony, custom layout grid patterns, glassmorphism filters, and smooth scale transitions.
*   **Debounced Dynamic Search**: Rapid filtering with real-time text debouncing on lists.
*   **Relationship Filters**: Eager-loaded authors and publishers drop-down selections to isolate inventory.
*   **Dynamic Modals**: Non-intrusive modal overlays for creating and editing records inside a unified viewport.
*   **Lightweight Global Toasts**: Custom DOM event-driven toast notifications that can be triggered from anywhere (even from HTTP interceptors!).

---

## 🛠️ Technology Stack

### Backend API
*   **Core Framework**: Laravel 12 (PHP 8.2+)
*   **Database**: MySQL 8.0+
*   **Authentication**: JWT Authentication (`tymon/jwt-auth`)
*   **ORM**: Eloquent ORM
*   **Security & Validation**: Form Request Validation
*   **Data Formatting**: Elegant Eloquent API Resources

### Frontend Interface
*   **Core Framework**: Next.js 16 (App Router, TypeScript)
*   **Styling**: Vanilla Tailwind CSS v4 (Sleek scrollbars, grid vectors, custom keyframe transitions)
*   **HTTP Client**: Axios (with JWT injection and 401 redirect interceptors)
*   **State Management**: React Context API (`AuthProvider`)
*   **Icons**: Lucide React

---

## 📁 Repository Structure

```text
digital-publishing-system/
├── backend/                  # Laravel 12 API Application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # REST Controllers (Auth, Author, Publisher, Book)
│   │   │   ├── Requests/          # Form Validation requests
│   │   │   └── Resources/         # Elegant JSON transformations
│   │   └── Models/                # Eloquent Models & Relationship Mappings
│   ├── config/                    # Configurations (Auth, CORS, JWT, database)
│   ├── database/
│   │   ├── migrations/            # Table schemas (Authors, Publishers, Books)
│   │   └── seeders/               # high-fidelity database fakers
│   ├── routes/api.php             # REST Route Definitions
│   └── .env.example
│
├── frontend/                 # Next.js 16 Frontend Dashboard
│   ├── src/
│   │   ├── app/                   # App Router Pages (Home, Login, Admin Panels)
│   │   ├── components/            # Reusable UI (Sidebar, Modal, Toast)
│   │   ├── context/               # Global state (AuthContext)
│   │   └── services/              # API Client (Axios Interceptors)
│   └── .env.example
│
└── postman_collection.json    # Complete API Testing Collection
```

---

## 🚀 Local Installation & Setup

Follow these simple steps to spin up the full workspace locally.

### Step 1: Database Initialization
1.  Ensure MySQL server is active on your machine.
2.  Log in to your MySQL terminal:
    ```bash
    mysql -u root -p
    ```
3.  Create a fresh database for the application:
    ```sql
    CREATE DATABASE digital_publishing;
    ```

---

### Step 2: Backend REST API Setup
1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    composer install
    ```
3.  Generate your local configuration file:
    ```bash
    cp .env.example .env
    ```
4.  Configure the database connection in `.env`:
    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=digital_publishing
    DB_USERNAME=root         # Update with your MySQL username
    DB_PASSWORD=YOUR_PASSWORD # Update with your MySQL password
    ```
5.  Generate the Application key and JWT secret key:
    ```bash
    php artisan key:generate
    php artisan jwt:secret
    ```
6.  Execute database migrations and populate high-fidelity seed data (creates 1 default admin, 10 authors, 5 publishers, and 30 connected books):
    ```bash
    php artisan migrate --seed
    ```
7.  Boot the Laravel API server:
    ```bash
    php artisan serve
    ```
    *The API will be available at `http://127.0.0.1:8000/api`*

---

### Step 3: Frontend Dashboard Setup
1.  Open a new terminal session and navigate into the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Configure local environment variables:
    ```bash
    cp .env.example .env.local
    ```
4.  Start the Next.js local server:
    ```bash
    npm run dev
    ```
    *The dashboard will be active at `http://localhost:3000`*

---

## 🎯 Default Credentials

You can sign in immediately to the admin console using the seeded credentials:

*   **Email**: `admin@example.com`
*   **Password**: `password`

---

## 🧪 Postman API Testing

To test the REST API endpoints directly:
1.  Import the file [postman_collection.json](postman_collection.json) into Postman.
2.  Configure your environment variable or directly use the collection variables.
3.  First run the **Login User** request under *Authentication*. This request contains a post-login script that automatically captures the returned JWT token and stores it in your environment.
4.  Subsequent requests (Me, Refresh, CRUD actions) will automatically attach the correct `Bearer <token>` inside the authorization headers!

---

## 🧪 Backend Testing

This project includes a comprehensive automated test suite for the Laravel API backend, utilizing PHPUnit. The suite consists of properly separated Unit and Feature tests to ensure high-fidelity verification of models, controllers, validations, and the HTTP request lifecycle.

### 🔍 Testing Overview
*   **Unit Tests**: Verify low-level models, Eloquent attributes, and relationship integrity (e.g., User, Author, Publisher, Book) in isolation.
*   **Feature Tests**: Boot the full Laravel request lifecycle to test HTTP endpoint security, REST controllers, validation requests, and specific API output payloads.

---

### 📋 Covered Test Cases

#### 🔒 Authentication Flow
*   **Register**: Successful user registration with payload structure assertions and database presence checks, plus validation constraints (missing fields, weak password, invalid email format).
*   **Login**: Successful authentication returning JWT payload, and invalid credentials testing (unauthorized 401 handling).
*   **Logout**: Active token invalidation and verification that subsequent requests with the same token are rejected.
*   **Security Middleware**: Robust checking that all protected endpoints deny access with 401 Unauthorized status when no valid Bearer token is provided.

#### 📝 Authors CRUD
*   **Create**: Validating proper resource creation, JSON output matches design system, and validation limits (e.g., today/future date bounds).
*   **Read**: Retrieving specific authors, validating correct single-model resource wrappers, and 404 response handling.
*   **Update / Delete**: Validating patch/put updates, record deletion checks (ensuring data is missing from database), and non-existent record checks.
*   **Validation**: Required payload verification and constraint limits.

#### 🏢 Publishers CRUD
*   **Create / Read**: Successful creation of business publishers, detailed single view payload mapping, and 404 handling.
*   **Update / Delete**: E2E updates and record deletion verification.
*   **Validation**: Input schema constraints validation.

#### 📚 Books CRUD
*   **Create / Read / Update / Delete**: Comprehensive REST behavior testing for library books.
*   **Validation**: Negative numbers validation for stock or price attributes, and missing fields blocks.
*   **Relationship Validation**: Verification that referenced `author_id` and `publisher_id` must exist in the database (otherwise returns 422 with precise validation errors).

#### ⚡ Core API Features
*   **Pagination**: Checks standard pagination response structure, pagination fields in payload metadata, custom limit bounds (`per_page`), and exact data collection limits.
*   **Search**: Dynamic debounced textual matching across titles, descriptions, bios, and locations.
*   **Filtering & Sorting**: Verification of multi-column query-parameter filters and sorting order sequences.
*   **JSON Response Structure**: Strict format assertions for all resources and collections.

---

### 🏃 Running Tests

Navigate into the `backend` folder:
```bash
cd backend
```

Run all tests:
```bash
php artisan test
```

Run all tests with compact output:
```bash
php artisan test --compact
```

