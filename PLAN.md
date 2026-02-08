# Baykul Frontend Implementation Plan

This document outlines the architecture, technical stack, and implementation plan for the `baykul-frontend` application. This guide is intended for the AI agent or developer who will build the frontend.

## 1. Project Overview

**Goal**: Build a React-based frontend for an auto-parts marketplace (`baykul`). The system supports users (searching and buying parts), and managers/admins (managing inventory "boxes" and "bills" for logistics).

**Key Entities**:
- **User**: Customers and Staff (Admin/Manager).
- **Detail (Product)**: Auto parts with article numbers, brands, prices.
- **Cart**: Temporary collection of items (Boxes) for purchase.
- **Order**: Confirmed purchase containing Boxes.
- **Box**: A physical instance of a Detail. Tracks status (In Cart -> Ordered -> Warehouse -> Delivered).
- **Bill**: An administrative document for bulk processing of Boxes (e.g., checking in a delivery truck).

## 2. Technical Stack

- **Framework**: React 18+ with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI (for rapid, accessible component development)
- **State Management**:
  - **Server State**: TanStack Query (React Query) v5 - for caching and syncing API data.
  - **Client State**: Zustand - for global UI state (sidebar, modal, user session).
- **Routing**: React Router v6.
- **Forms**: React Hook Form + Zod (validation).
- **HTTP Client**: Axios (or a generated client from Swagger).
- **Icons**: Lucide React.

## 3. Application Architecture

### Folder Structure
```
src/
├── api/             # API client and generated types
├── components/      # Shared UI components (Button, Input, etc.)
│   ├── ui/          # Shadcn UI components
│   └── layout/      # Layout components (Header, Sidebar)
├── features/        # Feature-based modules (domain logic)
│   ├── auth/        # Login, Register forms & logic
│   ├── product/     # Product search, list, details, CSV import
│   ├── cart/        # Cart management
│   ├── order/       # Order history, checkout
│   └── admin/       # Bills, Box management
├── hooks/           # Shared custom hooks
├── lib/             # Utilities (cn, formatting)
├── pages/           # Route components (compose features)
├── store/           # Global Zustand stores
└── types/           # Shared TypeScript interfaces
```

## 4. API Integration Strategy

### Base URL
The backend is currently running at `http://localhost:8080`.
**Note**: The backend implementation currently uses `/api/users` while the Swagger spec defines `/api/v1/users`. The frontend should be configured to target `/api/v1` (assuming backend will be updated) or configurable via `.env`.
Recommended: `VITE_API_BASE_URL=http://localhost:8080/api/v1`

### Authentication
- **Login**: `POST /auth/login` -> Returns JWT.
- **Header**: `Authorization: Bearer <token>`
- **Refresh**: `POST /auth/refresh` (Handle 401 interceptors to refresh token).

### Missing API Endpoints (Critical)
The current Swagger spec (`baykul-sa/swagger.json`) is missing the following critical endpoints required for the solution architecture:
1.  **Orders**:
    - `POST /orders` (Checkout from cart)
    - `GET /orders` (List user orders)
    - `GET /orders/{id}` (Order details)
2.  **Bills (Admin)**:
    - `POST /bills` (Create bill)
    - `GET /bills` (List bills)
    - `POST /bills/{id}/boxes` (Add/Scan boxes to bill)
3.  **Boxes**:
    - `GET /boxes/{uniqueNumber}` (Track box status)
    - `PUT /boxes/{uniqueNumber}/status` (Update status)

**Frontend Strategy for Missing APIs**:
- Create mock service handlers (e.g., using MSW or simple delay functions) for these features to allow UI development to proceed while backend is updated.
- Define the TypeScript interfaces based on `baykul-sa/schema.puml` (see Section 6).

## 5. Feature Specifications

### A. Authentication (Public)
- **Login Page**: Email/Password.
- **Register Page**: Name, Email, Password, Confirm Password.
- **Persist Login**: Store token in localStorage/cookies or memory (with refresh).

### B. Product Catalog (Public/User)
- **Search**:
    - Search Bar: Input for Article Number, Brand, or Name.
    - Endpoints: `/product/search/{text}`, `/product/search/article/{article}`.
- **Product List**:
    - Grid/List view of `Detail` items.
    - "Add to Cart" button (requires login).
- **Product Detail**:
    - Show extended info, stock status.
- **CSV Import (Admin)**:
    - Upload CSV file to `/product/upload`.

### C. Cart & Checkout (User)
- **Cart Drawer/Page**:
    - List items in cart (`/cart/user`).
    - Update quantity / Remove item.
    - **Checkout Button**: Triggers order creation (Mock `POST /orders` initially).
- **Order History**:
    - List past orders with status (Created, Paid, Processing, etc.).

### D. Warehouse & Logistics (Admin/Manager)
- **Bill Management**:
    - "Incoming Delivery" dashboard.
    - Create a new "Bill" (Delivery Manifest).
    - Scan/Enter Box Numbers to associate with Bill.
    - Update Box Status (e.g., `ARRIVED` -> `IN_WAREHOUSE`).

## 6. Data Models (TypeScript Interfaces)

Derived from `schema.puml`:

```typescript
// Enums
export enum Role { USER = 'USER', ADMIN = 'ADMIN', MANAGER = 'MANAGER' }
export enum OrderStatus { CREATED = 'CREATED', PAID = 'PAID', PROCESSING = 'PROCESSING', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
export enum BoxStatus { IN_CART = 'IN_CART', ORDERED = 'ORDERED', IN_WAREHOUSE = 'IN_WAREHOUSE', ON_WAY = 'ON_WAY', ARRIVED = 'ARRIVED', DELIVERED = 'DELIVERED', RETURNED = 'RETURNED' }

// Entities
export interface User {
  userId: string;
  email: string;
  balance: number;
  role: Role;
}

export interface Detail { // Product
  articleId: string;
  name: string;
  weight: number;
  minCount: number;
  countOnStorage: number;
  isReturnPart: boolean;
  price: number;
  brand: string;
}

export interface Box {
  uniqueNumber: string;
  status: BoxStatus;
  detail: Detail;
  priceSnapshot: number;
}

export interface Cart {
  lastUpdated: string;
  items: Box[]; // Or generic CartItem if backend differs
  totalEstimatedPrice: number;
}

export interface Order {
  orderId: string;
  createdDate: string;
  status: OrderStatus;
  totalPrice: number;
  boxes: Box[];
}

export interface Bill {
  billId: string;
  createdDate: string;
  description: string;
  createdBy: string; // Admin ID
  boxes: Box[]; // Associated boxes
}
```

## 7. Implementation Plan

### Phase 1: Setup & Foundation
1.  Initialize Vite + React + TS project.
2.  Install dependencies (Tailwind, React Router, Query, Axios, Shadcn).
3.  Configure API client (Axios interceptors for Auth).
4.  Implement Auth Pages (Login/Register) & User Store.

### Phase 2: Product & Cart (Core User Flow)
1.  Implement Product Search & Listing.
2.  Implement Product Details view.
3.  Implement Cart functionality (Add/Remove/View).
4.  Integrate CSV Upload (Admin).

### Phase 3: Orders & Mocking
1.  Mock the Order creation endpoint.
2.  Implement Checkout flow (Cart -> Order).
3.  Implement Order History page.

### Phase 4: Admin Tools (Logistics)
1.  Mock Bill & Box endpoints.
2.  Implement "Bill Dashboard" for receiving goods.
3.  Implement Box status tracking view.
