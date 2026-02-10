# Baykul Frontend

This is the frontend application for the Baykul Auto Parts Marketplace.

## Features Implemented

- **Authentication**: Login and Registration (connected to backend `api/auth`).
- **Product Catalog**: Search and browse products (Mock API).
- **Cart**: Add/Remove items, view total, checkout (Mock API).
- **Orders**: View order history (Mock API).
- **UI**: Responsive design using Tailwind CSS and Shadcn-inspired components.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build**:
    ```bash
    npm run build
    ```

## Configuration

The application expects the backend API to be available.
Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Mocking Strategy

Currently, `Product`, `Cart`, and `Order` features use Mock APIs (`src/api/product.ts`, `src/api/cart.ts`, `src/api/order.ts`) to simulate backend behavior, as those endpoints were not fully available in the initial backend implementation.

To switch to real API:
1. Update the API files to use `api.get` / `api.post` instead of mock data.
2. Ensure backend endpoints match the expected interfaces.
