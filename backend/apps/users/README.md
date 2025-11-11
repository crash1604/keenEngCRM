Django JWT Authentication System - Usage Guide
Overview
This guide covers how to use the JWT authentication system with Django backend and React frontend. The system provides secure token-based authentication with role-based access control.

API Endpoints
Endpoint	Method	Auth Required	Description
/api/auth/register/	POST	No	User registration
/api/auth/login/	POST	No	User login
/api/auth/logout/	POST	Yes	User logout (blacklist token)
/api/auth/token/refresh/	POST	No	Refresh access token
/api/auth/token/verify/	POST	No	Verify token validity
/api/auth/profile/	GET/PUT	Yes	Get/update user profile
Authentication Flow
1. User Registration
Request:

bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "password2": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "role": "employee"
  }'
Required Fields:

email (string): User's email address (used as username)

password (string): Password (min 8 characters, validated)

password2 (string): Password confirmation

first_name (string): User's first name

last_name (string): User's last name

Optional Fields:

phone (string): Phone number

role (string): User role - admin, manager, employee, client (default: employee)

Success Response (201 Created):

json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employee"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
2. User Login
Request:

bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
Required Fields:

email (string): Registered email address

password (string): User's password

Success Response (200 OK):

json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employee"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
3. Token Refresh
Request:

bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "your_refresh_token_here"
  }'
Required Fields:

refresh (string): Valid refresh token

Success Response (200 OK):

json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employee"
  }
}
4. User Logout
Request:

bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
Required Headers:

Authorization: Bearer <access_token>

Required Fields:

refresh_token (string): Refresh token to blacklist

Success Response (200 OK):

json
{
  "message": "Successfully logged out"
}
5. Get User Profile
Request:

bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer your_access_token_here"
Required Headers:

Authorization: Bearer <access_token>

Success Response (200 OK):

json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "role": "employee",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
6. Update User Profile
Request:

bash
curl -X PUT http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+0987654321"
  }'
Required Headers:

Authorization: Bearer <access_token>

Updatable Fields:

first_name (string)

last_name (string)

phone (string)

Success Response (200 OK):

json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+0987654321",
  "role": "employee",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z"
}
Token Information
Access Token
Lifetime: 180 minutes (3 hours)

Usage: Required for authenticated API requests

Header Format: Authorization: Bearer <access_token>

Refresh Token
Lifetime: 3 days

Usage: Obtain new access tokens without re-login

Auto-blacklist: Enabled (old tokens are blacklisted after refresh)

Error Responses
Common Error Codes
Status Code	Description
400	Bad Request - Invalid input data
401	Unauthorized - Invalid credentials or token
403	Forbidden - Valid token but insufficient permissions
404	Not Found - Resource not found
500	Internal Server Error
Example Error Responses
Registration Error (400):

json
{
  "error": "Invalid data",
  "details": {
    "email": ["A user with this email already exists."],
    "password": ["Password fields didn't match."]
  }
}
Login Error (401):

json
{
  "error": "Invalid credentials",
  "details": {
    "non_field_errors": ["Invalid credentials."]
  }
}
Token Error (401):

json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
Frontend Integration (React Example)
Token Storage
javascript
// Store tokens securely (consider httpOnly cookies for production)
localStorage.setItem('access_token', response.data.tokens.access);
localStorage.setItem('refresh_token', response.data.tokens.refresh);
API Client Setup
javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            'http://localhost:8000/api/auth/token/refresh/',
            { refresh: refreshToken }
          );
          localStorage.setItem('access_token', refreshResponse.data.access);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
Security Notes
Password Requirements: Django's built-in password validators enforce security rules

HTTPS: Always use HTTPS in production

Token Storage: Store tokens securely (consider httpOnly cookies)

CORS: Configured for http://localhost:3000 and http://127.0.0.1:3000

Token Blacklisting: Enabled to prevent token reuse after logout

Role-Based Access
The system supports four user roles:

admin: Full system access

manager: Management privileges

employee: Standard user access

client: Limited access (if applicable)

Use the role field in the user object to implement role-based access control in your frontend and additional API endpoints.