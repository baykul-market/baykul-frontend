# Baykul Auto Parts Marketplace - Frontend

A modern, high-performance frontend for the Baykul Auto Parts Marketplace, built with React 19 and Tailwind CSS 4.

## 🚀 Tech Stack

- **Core**: [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Internationalization**: [i18next](https://www.i18next.com/) (English & Russian support)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Testing**: [Vitest](https://vitest.dev/)

## ✨ Key Features

- **🌐 Multi-language Support**: Full localization for English and Russian.
- **🔐 Authentication**: Secure JWT-based login and registration.
- **📦 Product Catalog**: Advanced search, filtering, and product details.
- **🛒 Shopping Cart**: Persistent cart management with real-time updates.
- **📄 Order Management**: Comprehensive order history and status tracking.
- **🛠️ Admin Dashboard**:
  - **Pricing Config**: Dynamic markup and currency controls.
  - **Order Tracking**: Manage and update customer orders.
- **👤 Profile Management**: User settings and balance tracking.
- **📱 Responsive Design**: Premium, mobile-first UI with dark mode support.

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v20 or newer
- **npm**: v10 or newer

### Installation

```bash
# Clone the repository
git clone https://github.com/baykul-sa/baykul-frontend.git
cd baykul-frontend

# Install dependencies
npm install
```

### Development

1.  **Configure Environment**:
    Create a `.env` file in the root:
    ```env
    VITE_API_BASE_URL=http://localhost:8080/api/v1
    ```

2.  **Start Dev Server**:
    ```bash
    npm run dev
    ```

### Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui
```

## 🚢 Deployment

The application is containerized using **Docker** and deployed via **GitHub Actions**.

- **Proxy Configuration**: In production, Nginx acts as a reverse proxy, forwarding `/api/` requests to the backend service.
- **CI/CD**: Automatic builds and deployments to Beget VPS on every push to `main`.

For detailed deployment instructions, see the [**Deployment Guide**](./DEPLOYMENT_GUIDE.md).

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
