# KEEN Engineering Spartan



# KeenEng CRM - Docker Setup Guide

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Your AWS RDS database accessible

### 1. Verify Your Files

Ensure you have these files in place:

```
crm-system/
├── backend/
│   ├── Dockerfile ✅ (you already have this)
│   ├── .env ✅ (you already have this)
│   ├── requirements/
│   │   └── requirements.txt
│   ├── manage.py
│   └── config/
├── frontend/
│   ├── Dockerfile ✅ (you already have this)
│   ├── nginx.conf ✅ (simplified version)
│   ├── package.json
│   └── src/
└── docker-compose.yml ⬅️ (place in root)
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

**That's it!** 🎉

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

### 4. First Time Setup (Optional)

If you need to create a superuser:

```bash
docker-compose exec backend python manage.py createsuperuser
```

## 📋 Common Commands

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

## 🔧 Troubleshooting

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

## 🎯 Development Workflow

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

## 🚢 Production Notes

When deploying to production:

1. **Set DEBUG=False** in backend/.env
2. **Update ALLOWED_HOSTS** to your domain
3. **Update CORS_ALLOWED_ORIGINS** to your frontend URL
4. **Use strong SECRET_KEY**
5. **Use environment variables** (don't commit .env to git)
6. **Enable HTTPS**
7. **Use proper gunicorn workers**: `--workers 4`
8. **Set up monitoring and logging**

## 📦 Clean Start

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

## 🆘 Still Having Issues?

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