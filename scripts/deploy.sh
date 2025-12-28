#!/bin/bash
# Manual deployment script for EC2
# Usage: ./scripts/deploy.sh

set -e

cd ~/keenEngCRM

echo "========================================="
echo "Starting deployment..."
echo "========================================="

# Pull latest code
echo "Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# Get commit info
COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
echo "Deploying commit: $COMMIT_SHA"
echo "Message: $COMMIT_MSG"
echo ""

# Stop existing containers
echo "Stopping containers..."
docker-compose -f docker-compose.prod.yml down

# Rebuild with cache bust
echo "Rebuilding containers (this may take a few minutes)..."
CACHEBUST=$COMMIT_SHA docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
echo "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo "Waiting for services to start..."
sleep 15

# Run migrations
echo "Running migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# Clean up old images
echo "Cleaning up old Docker images..."
docker image prune -f

# Verify
echo ""
echo "========================================="
echo "Deployment complete!"
echo "========================================="
echo "Commit: $COMMIT_SHA"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Frontend assets:"
docker exec keenengcrm-frontend-1 ls -la /usr/share/nginx/html/assets/ | head -5

echo ""
echo "Test the site in an incognito window to avoid cache issues."
