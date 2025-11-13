# Multi-stage build for production
FROM node:20-alpine as builder
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build app
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
