# KEEN Engineering CRM

A comprehensive Customer Relationship Management system designed for engineering firms, specifically tailored for managing mechanical, electrical, plumbing, and fire protection projects.

## Overview

KEEN Engineering CRM (Spartan) is a full-stack web application that helps engineering firms manage their projects, clients, architects, and communications efficiently. The system provides role-based access control, activity tracking, and email communication features.

## Technology Stack

### Backend
- **Framework**: Django 5.2.8 with Django REST Framework 3.15.0
- **Authentication**: JWT (Simple JWT)
- **Database**: PostgreSQL
- **Task Queue**: Celery with Redis
- **Python Version**: 3.14

### Frontend
- **Framework**: React 19.2.0 with Vite
- **State Management**: Zustand + MobX
- **UI Library**: Material-UI (MUI) 7.3.6
- **Data Grid**: AG Grid
- **Styling**: Tailwind CSS
- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios

## Project Structure

```
keenEngCRM/
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── users/          # User authentication & management
│   │   ├── clients/        # Client management
│   │   ├── architects/     # Architect/Designer management
│   │   ├── projects/       # Project management
│   │   ├── activity/       # Activity logging & audit trail
│   │   └── communication/  # Email templates & communication
│   ├── config/             # Django settings & configuration
│   ├── requirements/       # Python dependencies
│   └── manage.py
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── stores/         # Zustand state stores
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── docs/                   # Documentation
├── infrastructure/         # Infrastructure configs
├── scripts/                # Utility scripts
└── tests/                  # Integration tests
```

## Features

### User Management
- Role-based access control (Admin, Manager, Employee, Client, Architect)
- JWT authentication with token refresh
- User profile management

### Client Management
- Full CRUD operations with soft delete
- Advanced search and filtering
- Bulk import/export (CSV, Excel)
- Document uploads
- Activity tracking

### Project Management
- Comprehensive project tracking
- Multiple project types (Mechanical, Electrical, Plumbing, Energy Modelling, Fire Protection, Tenant Improvement)
- Status management with workflow
- Due date tracking and overdue alerts
- Inspection scheduling (rough-in, final)
- Auto-generated job numbers

### Architect/Designer Management
- Professional information tracking
- License and affiliation management
- Project association

### Activity Logging
- Automatic tracking of all changes
- Audit trail for compliance
- Role-based activity visibility

### Communication
- Email template management
- Variable substitution in templates
- Email history and tracking
- Support for CC/BCC

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- PostgreSQL database (or use Docker)

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv virtualenv
source virtualenv/bin/activate  # On Windows: virtualenv\Scripts\activate
pip install -r requirements/requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```bash
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=keenengcrm
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth/` | Authentication (login, register, logout) |
| `/api/token/` | JWT token endpoints |
| `/api/projects/` | Project CRUD operations |
| `/api/clients/clients/` | Client management |
| `/api/activity/activity-logs/` | Activity logs |
| `/api/communication/` | Email templates and logs |

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access to all features |
| Manager | Manage projects, clients, view all data |
| Employee | View and work on assigned projects |
| Client | View own projects only |
| Architect | View associated projects only |

## Development

For detailed development documentation, see:
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

## Production Deployment

1. Set `DEBUG=False` in backend/.env
2. Update `ALLOWED_HOSTS` to your domain
3. Update `CORS_ALLOWED_ORIGINS` to your frontend URL
4. Use a strong `SECRET_KEY`
5. Enable HTTPS
6. Configure proper logging and monitoring

## License

Proprietary - KEEN Engineering

---

# Docker Setup Guide

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Your AWS RDS database accessible

### 1. Verify Your Files

Ensure you have these files in place:

```
crm-system/
├── backend/
│   ├── Dockerfile
│   ├── .env
│   ├── requirements/
│   │   └── requirements.txt
│   ├── manage.py
│   └── config/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
└── docker-compose.yml
```

### 2. Update Your backend/.env

Make sure your backend/.env includes `ALLOWED_HOSTS`:

```bash
DATABASE_URL=postgresql://keenEng:your-password@keenengdb.cbq8uyqkazao.us-east-2.rds.amazonaws.com:5432/keenengcrm
SECRET_KEY="your-secret-key"
DEBUG=True

DB_NAME=keenengcrm
DB_USER=keenEng
DB_PASSWORD=your-password
DB_HOST=keenengdb.cbq8uyqkazao.us-east-2.rds.amazonaws.com
DB_PORT=5432

# Add these lines:
ALLOWED_HOSTS=localhost,127.0.0.1,backend,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Build and Run

```bash
# Navigate to crm-system/ directory
cd crm-system

# Build all services
docker-compose build

# Start everything
docker-compose up
```

**That's it!**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

### 4. First Time Setup (Optional)

If you need to create a superuser:

```bash
docker-compose exec backend python manage.py createsuperuser
```

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend
```

### Stop Everything
```bash
# Stop containers
docker-compose down

# Stop and restart
docker-compose restart
```

### Rebuild After Code Changes

**Backend changes:**
```bash
# If you changed Python code (hot-reload works with volumes)
docker-compose restart backend

# If you changed requirements.txt
docker-compose build backend
docker-compose up -d backend
```

**Frontend changes:**
```bash
# Rebuild and restart
docker-compose build frontend
docker-compose up -d frontend
```

### Run Django Commands
```bash
# Make migrations
docker-compose exec backend python manage.py makemigrations

# Migrate
docker-compose exec backend python manage.py migrate

# Shell
docker-compose exec backend python manage.py shell

# Create app
docker-compose exec backend python manage.py startapp newapp
```

## Troubleshooting

### Backend won't start
**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
- AWS RDS not accessible (check security groups)
- Missing environment variables
- Migration errors

**Solutions:**
```bash
# Restart backend
docker-compose restart backend

# Run migrations manually
docker-compose exec backend python manage.py migrate
```

### Frontend shows 502 Bad Gateway
This means frontend can't reach backend.

**Check if backend is running:**
```bash
docker-compose ps
```

**Should see:**
```
NAME                STATUS
backend             Up
frontend            Up
```

**If backend is down:**
```bash
docker-compose up -d backend
```

### Can't connect to AWS RDS
1. Check your AWS RDS security group allows inbound from your IP
2. Verify database credentials in `.env`
3. Test connection:
```bash
docker-compose exec backend python manage.py dbshell
```

### Port already in use
If ports 3000 or 8000 are taken, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Change to 8001

  frontend:
    ports:
      - "3001:80"    # Change to 3001
```

## Development Workflow

### Backend Development
1. Make changes to Python files in `backend/`
2. Changes auto-reload (Django dev server via gunicorn)
3. If adding dependencies, update `requirements.txt` and rebuild

### Frontend Development

**Option 1: Use Docker (slower rebuilds)**
```bash
# Make changes, then rebuild
docker-compose build frontend
docker-compose up -d frontend
```

**Option 2: Local dev server (faster, recommended)**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173 with hot reload
```

Update your React app to use `http://localhost:8000` for API calls in development.

## Production Notes

When deploying to production:

1. **Set DEBUG=False** in backend/.env
2. **Update ALLOWED_HOSTS** to your domain
3. **Update CORS_ALLOWED_ORIGINS** to your frontend URL
4. **Use strong SECRET_KEY**
5. **Use environment variables** (don't commit .env to git)
6. **Enable HTTPS**
7. **Use proper gunicorn workers**: `--workers 4`
8. **Set up monitoring and logging**

## Clean Start

If things get messy:

```bash
# Stop everything
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

## Still Having Issues?

Check:
1. Docker is running: `docker ps`
2. Both Dockerfiles exist and are correct
3. nginx.conf is the simplified version (no `events` block)
4. .env file has all required variables
5. AWS RDS security group allows your IP
6. Requirements.txt includes gunicorn

**Quick test backend directly:**
```bash
docker-compose exec backend python manage.py check
```
