# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KEEN Engineering CRM is a full-stack web application for engineering firms managing mechanical, electrical, plumbing, and fire protection projects. Django REST API backend with React SPA frontend.

## Commands

### Frontend (from /frontend)
```bash
npm run dev          # Dev server (Vite, port 5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

### Backend (from /backend)
```bash
python manage.py runserver              # Dev server (port 8000)
python manage.py migrate                # Apply migrations
python manage.py makemigrations         # Create migrations
python manage.py createsuperuser        # Create admin user
```

### Docker (from root)
```bash
docker-compose build                    # Build all services
docker-compose up                       # Start all (backend:8000, frontend:3000)
docker-compose exec backend python manage.py migrate
```

## Architecture

### Backend Structure (/backend)
- **Django 5.2.8** with Django REST Framework
- **JWT auth** via HTTP-only cookies (SimpleJWT)
- **PostgreSQL** database

**Apps:**
- `apps/users/` - Custom User model with roles (admin, manager, employee, client, architect)
- `apps/projects/` - Project CRUD, auto-generated job numbers (YYYY-XXXX), status workflow
- `apps/clients/` - Soft-delete pattern, bulk import/export
- `apps/architects/` - Architect/Designer management
- `apps/activity/` - Automatic audit logging via middleware
- `apps/communication/` - Email templates with variable substitution

**Config:** `config/settings.py`, `config/urls.py`

### Frontend Structure (/frontend)
- **React 19** with Vite
- **State:** Zustand (auth, projects, activity, ui) + MobX (clients, communication)
- **UI:** Material-UI + Tailwind CSS
- **Data Grid:** AG Grid for tables
- **Forms:** Formik + Yup

**Key directories:**
- `src/services/` - Axios API layer, each domain has dedicated service
- `src/stores/` - State management stores
- `src/pages/` - Route components
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom hooks (AG Grid column definitions)

### API Communication
- Base URL: `VITE_API_URL` (default: `http://localhost:8000/api`)
- Credentials: `withCredentials: true` for cookie-based auth
- Axios interceptors handle 401 errors with automatic token refresh

**Endpoints:**
- `/api/auth/` - Authentication
- `/api/token/` - JWT obtain/refresh
- `/api/projects/` - Projects
- `/api/clients/clients/` - Clients
- `/api/architects/` - Architects
- `/api/activity/` - Activity logs
- `/api/communication/` - Email templates/logs

### Key Models

**Project:** year, job_number (auto), project_name, project_type (M/E/P/EM/FP/TI/VI), status (not_started/in_progress/submitted/completed/closed_paid/cancelled/on_hold), FK to Client/Architect/Manager

**User roles:** admin (full), manager (full CRUD), employee (assigned), client (own), architect (associated)

**ActivityLog:** Automatic audit trail captured by middleware

## Environment Variables

### Backend (/backend/.env)
```
SECRET_KEY, DEBUG, ALLOWED_HOSTS
DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
CORS_ALLOWED_ORIGINS
```

### Frontend
```
VITE_API_URL=http://localhost:8000/api
```

## Development Workflow

For faster iteration, run frontend locally (`npm run dev`) while backend runs in Docker or locally. Frontend hot-reloads; backend auto-reloads with Django dev server.

When adding Python packages, update `requirements/requirements.txt` and rebuild container.
