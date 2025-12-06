# KEEN Engineering CRM - Frontend

React-based Single Page Application for the KEEN Engineering CRM system.

## Technology Stack

- **React**: 19.2.0
- **Build Tool**: Vite 7.2.2
- **State Management**: Zustand 5.0.8 + MobX 6.15.0
- **UI Framework**: Material-UI (MUI) 7.3.6
- **Data Grid**: AG Grid 34.3.1
- **Styling**: Tailwind CSS 3.4.18
- **Routing**: React Router DOM 7.9.5
- **HTTP Client**: Axios 1.13.2
- **Forms**: Formik 2.4.9 + Yup 1.7.1
- **Charts**: Recharts 3.5.1
- **Icons**: Lucide React, MUI Icons
- **Date Handling**: date-fns 4.1.0
- **Excel Export**: xlsx 0.18.5

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/        # Shared components (LoadingSpinner, etc.)
│   │   └── layout/        # Layout components (Layout, Sidebar, Header)
│   ├── pages/             # Page components
│   │   ├── Auth/          # Login, Register pages
│   │   ├── Dashboard/     # Dashboard page
│   │   ├── Clients/       # Client management pages
│   │   ├── Projects/      # Project management pages
│   │   └── Communication/ # Communication pages
│   ├── services/          # API service layer
│   │   ├── api.js         # Axios instance with interceptors
│   │   ├── auth.js        # Authentication service
│   │   ├── client.js      # Client API service
│   │   ├── project.js     # Project API service
│   │   ├── activity.js    # Activity API service
│   │   └── communication.js # Communication API service
│   ├── stores/            # State management
│   │   └── auth.store.js  # Authentication state (Zustand)
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── router.jsx         # Application routing
│   ├── App.jsx            # Root component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file if needed:

```bash
VITE_API_URL=http://localhost:8000/api
```

## Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Features

### Authentication
- JWT-based authentication with token refresh
- Persistent login state via localStorage
- Protected routes with automatic redirects
- Role-based access control

### Dashboard
- Project statistics and metrics
- Status breakdown charts
- Overdue project alerts
- Recent activity feed

### Client Management
- List view with AG Grid
- Advanced search and filtering
- Create, edit, delete clients
- Bulk import/export functionality
- Client activity history

### Project Management
- Comprehensive project list
- Status tracking and updates
- Inspection scheduling
- Due date management
- Activity logging

### Communication
- Email template management
- Template preview with variable substitution
- Email history and logs
- Send emails to clients

---

## Architecture

### State Management

The application uses **Zustand** for global state management with the following stores:

#### Auth Store (`stores/auth.store.js`)

```javascript
{
  user: { id, email, first_name, last_name, role },
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,

  // Actions
  login(credentials),
  register(userData),
  logout(),
  updateProfile(userData),
  checkAuth()
}
```

### API Layer

All API calls go through a centralized Axios instance with:

- **Base URL**: `http://localhost:8000/api`
- **Request Interceptor**: Adds JWT token to Authorization header
- **Response Interceptor**: Handles 401 errors with automatic token refresh

#### API Services

| Service | File | Endpoints |
|---------|------|-----------|
| Auth | `services/auth.js` | login, register, logout, profile |
| Client | `services/client.js` | CRUD, search, export |
| Project | `services/project.js` | CRUD, status, dashboard stats |
| Activity | `services/activity.js` | logs, my activity |
| Communication | `services/communication.js` | templates, logs, send email |

### Routing

The application uses React Router v7 with the following routes:

| Route | Component | Access |
|-------|-----------|--------|
| `/auth/login` | Login | Public |
| `/auth/register` | Register | Public |
| `/dashboard` | Dashboard | Protected |
| `/projects` | Projects | Protected |
| `/clients` | Clients | Protected |
| `/communication` | Communication | Protected |

#### Protected Routes

All routes except auth pages require authentication. Unauthenticated users are redirected to `/auth/login`.

---

## Components

### Layout Components

#### `Layout`
Main application layout with sidebar navigation and header.

#### `LoadingSpinner`
Reusable loading indicator with customizable size and text.

### Page Components

#### `Dashboard`
- Project statistics cards
- Status breakdown charts (Recharts)
- Recent activity list
- Overdue project alerts

#### `Clients`
- AG Grid data table
- Search and filter controls
- Create/Edit modal forms
- Export functionality

#### `Projects`
- Project list with status indicators
- Filtering by status, type, manager
- Project detail view
- Activity history

#### `Communication`
- Email template list
- Template editor with variable placeholders
- Email preview
- Send email interface

---

## Styling

### Tailwind CSS

The application uses Tailwind CSS for utility-first styling:

```css
/* Example usage */
<div className="min-h-screen flex items-center justify-center">
  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Button
  </button>
</div>
```

### Material-UI

MUI components are used for complex UI elements:

- Buttons, Inputs, Dialogs
- Tables, Cards, Paper
- Icons and Typography
- Theme customization

---

## API Integration

### Authentication Flow

1. User submits credentials to `/api/auth/login/`
2. Server returns JWT tokens (access + refresh)
3. Tokens stored in localStorage
4. Access token added to all API requests
5. On 401 error, refresh token is used to get new access token
6. If refresh fails, user is logged out

### Token Storage

```javascript
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### Request Headers

```javascript
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Development

### Code Style

- ESLint with React plugins
- Component naming: PascalCase
- Files: camelCase.jsx

### Folder Organization

- **components/**: Reusable UI components
- **pages/**: Route-level components
- **services/**: API integration
- **stores/**: State management
- **hooks/**: Custom React hooks
- **utils/**: Helper functions

### Adding a New Page

1. Create component in `src/pages/NewPage/NewPage.jsx`
2. Add route in `src/router.jsx`
3. Create API service if needed in `src/services/`
4. Add navigation link in layout

### Adding API Integration

1. Create service in `src/services/newService.js`
2. Import centralized API instance
3. Export service functions

```javascript
import api from './api';

export const newService = {
  getAll: () => api.get('/new-endpoint/'),
  create: (data) => api.post('/new-endpoint/', data),
  update: (id, data) => api.put(`/new-endpoint/${id}/`, data),
  delete: (id) => api.delete(`/new-endpoint/${id}/`),
};
```

---

## Build & Deployment

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/` folder.

### Docker

```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

For production, configure:

```bash
VITE_API_URL=https://api.yourdomain.com
```

---

## Troubleshooting

### Common Issues

#### CORS Errors
Ensure backend has correct CORS settings for your frontend URL.

#### Authentication Issues
- Check if tokens are properly stored in localStorage
- Verify token hasn't expired
- Clear localStorage and re-login

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm run build
```

#### API Connection Issues
- Verify backend is running on correct port
- Check API_URL configuration
- Verify network connectivity

---

## CRA Documentation (Legacy)

This project was originally bootstrapped with Create React App and later migrated to Vite.

### Available Scripts (Legacy)

```bash
npm start   # Development (CRA - deprecated, use npm run dev)
npm test    # Run tests
npm run build  # Production build
```

For more information on React, check out the [React documentation](https://reactjs.org/).
