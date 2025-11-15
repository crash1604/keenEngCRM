# ============================
# Base image
# ============================
FROM python:3.12-slim

# Prevent Python from writing .pyc files + enable unbuffered mode
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ============================
# Install dependencies
# ============================
# Copy only requirements first for better caching
COPY requirements/requirements.txt /app/requirements.txt

RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

# ============================
# Copy project files
# ============================
COPY . .

# ============================
# Create directories and non-root user
# ============================
# Create directories that need write access
RUN mkdir -p /app/staticfiles /app/media

# Create non-root user
RUN adduser --disabled-password django

# Change ownership of the entire /app directory to django user
RUN chown -R django:django /app

# Switch to non-root user
USER django

# ============================
# Expose port
# ============================
EXPOSE 8000

# ============================
# Run Django with Gunicorn
# ============================
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]