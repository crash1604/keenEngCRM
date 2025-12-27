# Deployment Guide - KEEN Engineering CRM

This guide explains how to deploy the application to AWS EC2 with automated CI/CD via GitHub Actions.

## Architecture

```
GitHub (push to main)
    ↓
GitHub Actions (build & test)
    ↓
SSH to EC2
    ↓
Docker Compose (PostgreSQL + Django + React/Nginx)
```

## Prerequisites

- AWS EC2 instance (Amazon Linux 2023, t2.small or larger)
- Domain name (optional, for SSL)
- GitHub repository with Actions enabled

## EC2 Instance Setup

### 1. Launch EC2 Instance

- **AMI**: Amazon Linux 2023
- **Instance Type**: t2.small (minimum for Docker)
- **Storage**: 20GB+ gp3
- **Security Group**:
  - SSH (22) - Your IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0

### 2. Run Setup Script

SSH into your EC2 instance and run:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/keenEngCRM/main/scripts/ec2-setup.sh
sudo bash ec2-setup.sh
```

Or manually:

```bash
# Update system
sudo dnf update -y

# Install Docker
sudo dnf install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for docker group
exit
```

### 3. Clone Repository

```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "ec2-deploy-key"
cat ~/.ssh/id_ed25519.pub
# Add this as a Deploy Key in GitHub repo settings

# Clone repository
cd ~
git clone git@github.com:YOUR_USERNAME/keenEngCRM.git
cd keenEngCRM
```

### 4. Configure Environment

Create `backend/.env`:

```bash
cat > backend/.env << 'EOF'
SECRET_KEY=your-long-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,your-ec2-public-ip

DB_NAME=keencrm
DB_USER=keencrm
DB_PASSWORD=your-secure-database-password

CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-ec2-public-ip
EOF
```

Generate a secure secret key:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 5. First Deployment

```bash
cd ~/keenEngCRM
docker-compose -f docker-compose.prod.yml up -d --build

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## GitHub Actions Setup

### Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

| Secret | Description | Example |
|--------|-------------|---------|
| `EC2_HOST` | EC2 public IP or domain | `54.123.45.67` |
| `EC2_USERNAME` | SSH username | `ec2-user` |
| `EC2_SSH_KEY` | Private SSH key (entire contents) | `-----BEGIN OPENSSH...` |
| `APP_DIRECTORY` | App path on EC2 | `~/keenEngCRM` |
| `BACKEND_ENV` | Full backend/.env contents (optional) | See below |

### Setting up EC2_SSH_KEY

On your local machine:
```bash
# Generate a new SSH key pair for deployments
ssh-keygen -t ed25519 -f ~/.ssh/ec2-deploy -C "github-actions-deploy"

# Copy public key to EC2
ssh-copy-id -i ~/.ssh/ec2-deploy.pub ec2-user@YOUR_EC2_IP

# Copy the private key contents - this goes in GitHub Secrets
cat ~/.ssh/ec2-deploy
```

### Setting up BACKEND_ENV (optional)

If you want GitHub Actions to manage your environment file:
```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DB_NAME=keencrm
DB_USER=keencrm
DB_PASSWORD=your-db-password
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

## Deployment Process

Once configured, every push to `main` branch triggers:

1. **Test Job**: Builds frontend, runs Django checks
2. **Deploy Job**: SSHs to EC2, pulls code, rebuilds containers
3. **Verify Job**: Confirms containers are running

### Manual Deployment

You can also trigger deployments manually:
1. Go to Actions tab in GitHub
2. Select "Deploy to AWS EC2"
3. Click "Run workflow"

### Deploy from EC2

```bash
cd ~/keenEngCRM
./deploy.sh
```

## SSL/HTTPS Setup (Optional)

### Using Let's Encrypt

1. Point your domain to EC2's public IP

2. Get initial certificate:
```bash
# Start containers without SSL first
docker-compose -f docker-compose.prod.yml up -d

# Get certificate
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com \
  --agree-tos
```

3. Update `frontend/nginx.prod.conf` - uncomment HTTPS server block and update domain

4. Rebuild frontend:
```bash
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

## Monitoring & Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all
docker-compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs --tail=100

# Check disk space
df -h

# Check memory
free -m
```

### Database connection errors
```bash
# Ensure db container is healthy
docker-compose -f docker-compose.prod.yml ps db

# Check db logs
docker-compose -f docker-compose.prod.yml logs db
```

### Permission errors
```bash
# Fix ownership
sudo chown -R ec2-user:ec2-user ~/keenEngCRM
```

### GitHub Actions failing
1. Check Actions tab for error logs
2. Verify all secrets are set correctly
3. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/ec2-deploy ec2-user@YOUR_EC2_IP
   ```

## Backup Database

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U keencrm keencrm > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U keencrm keencrm < backup.sql
```
