#!/bin/bash
# EC2 Setup Script for KEEN Engineering CRM
# Run this on a fresh Amazon Linux 2023 instance
# Usage: sudo bash ec2-setup.sh

set -e

echo "=== KEEN Engineering CRM - EC2 Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo bash ec2-setup.sh)"
    exit 1
fi

# Get the non-root user (usually ec2-user on Amazon Linux)
DEPLOY_USER="${SUDO_USER:-ec2-user}"
DEPLOY_HOME=$(eval echo "~$DEPLOY_USER")
APP_DIR="$DEPLOY_HOME/keenEngCRM"

echo "Deploy user: $DEPLOY_USER"
echo "App directory: $APP_DIR"
echo ""

# Update system
echo "=== Updating system packages ==="
dnf update -y

# Install required packages
echo "=== Installing required packages ==="
dnf install -y \
    git \
    docker \
    htop \
    tmux \
    curl \
    wget \
    unzip

# Install Docker Compose v2
echo "=== Installing Docker Compose ==="
DOCKER_COMPOSE_VERSION="v2.24.0"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Create symlink for docker-compose command
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

# Start and enable Docker
echo "=== Starting Docker service ==="
systemctl start docker
systemctl enable docker

# Add deploy user to docker group
usermod -aG docker "$DEPLOY_USER"

# Configure Docker to start on boot
systemctl enable docker.service
systemctl enable containerd.service

# Set up SSH directory with correct permissions
echo "=== Configuring SSH ==="
SSH_DIR="$DEPLOY_HOME/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
touch "$SSH_DIR/authorized_keys"
chmod 600 "$SSH_DIR/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SSH_DIR"

# Clone repository (user needs to do this after adding deploy key)
echo "=== Creating app directory ==="
mkdir -p "$APP_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# Create directories for SSL certificates
mkdir -p "$APP_DIR/certbot/conf"
mkdir -p "$APP_DIR/certbot/www"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/certbot"

# Configure swap (helpful for t2.small with limited RAM)
echo "=== Configuring swap space ==="
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap configured: 2GB"
else
    echo "Swap already exists"
fi

# Configure firewall (if firewalld is installed)
if command -v firewall-cmd &> /dev/null; then
    echo "=== Configuring firewall ==="
    systemctl start firewalld
    systemctl enable firewalld
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --reload
fi

# Create environment template
echo "=== Creating environment template ==="
cat > "$APP_DIR/.env.template" << 'EOF'
# Backend Environment Variables
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ec2-ip

# Database
DB_NAME=keencrm
DB_USER=keencrm
DB_PASSWORD=your-secure-db-password

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com
EOF
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/.env.template"

# Create a helper script for deployment
echo "=== Creating deploy helper script ==="
cat > "$APP_DIR/deploy.sh" << 'EOF'
#!/bin/bash
# Deployment helper script
set -e

cd "$(dirname "$0")"

echo "Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

echo "Running migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

echo "Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo "Cleaning up old images..."
docker image prune -f

echo "Deployment complete!"
docker-compose -f docker-compose.prod.yml ps
EOF
chmod +x "$APP_DIR/deploy.sh"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/deploy.sh"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Log out and log back in for docker group to take effect"
echo "   Or run: newgrp docker"
echo ""
echo "2. Clone your repository:"
echo "   cd $APP_DIR"
echo "   git clone git@github.com:YOUR_USERNAME/keenEngCRM.git ."
echo ""
echo "3. Create backend/.env file based on .env.template"
echo ""
echo "4. Run first deployment:"
echo "   ./deploy.sh"
echo ""
echo "5. Configure GitHub secrets (see DEPLOYMENT.md)"
echo ""
