from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings

from .models import User
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer


def set_auth_cookies(response, access_token, refresh_token):
    """Helper function to set JWT tokens as HTTP-only cookies"""
    # Set access token cookie
    response.set_cookie(
        key=settings.JWT_AUTH_COOKIE,
        value=str(access_token),
        httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
        secure=settings.JWT_AUTH_COOKIE_SECURE,
        samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
        path=settings.JWT_AUTH_COOKIE_PATH,
        domain=settings.JWT_AUTH_COOKIE_DOMAIN,
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
    )

    # Set refresh token cookie
    response.set_cookie(
        key=settings.JWT_AUTH_REFRESH_COOKIE,
        value=str(refresh_token),
        httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
        secure=settings.JWT_AUTH_COOKIE_SECURE,
        samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
        path=settings.JWT_AUTH_COOKIE_PATH,
        domain=settings.JWT_AUTH_COOKIE_DOMAIN,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
    )

    return response


def clear_auth_cookies(response):
    """Helper function to clear JWT cookies on logout"""
    response.delete_cookie(
        key=settings.JWT_AUTH_COOKIE,
        path=settings.JWT_AUTH_COOKIE_PATH,
        domain=settings.JWT_AUTH_COOKIE_DOMAIN,
    )
    response.delete_cookie(
        key=settings.JWT_AUTH_REFRESH_COOKIE,
        path=settings.JWT_AUTH_COOKIE_PATH,
        domain=settings.JWT_AUTH_COOKIE_DOMAIN,
    )
    return response

class UserRegistrationView(APIView):
    """
    View for user registration - sets JWT tokens as HTTP-only cookies
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()
                user.last_login = timezone.now()
                user.save()

                # Generate tokens
                refresh = RefreshToken.for_user(user)

                # Create response with user data (no tokens in body)
                response = Response({
                    'message': 'User registered successfully',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role
                    }
                }, status=status.HTTP_201_CREATED)

                # Set tokens as HTTP-only cookies
                return set_auth_cookies(response, refresh.access_token, refresh)

            except Exception as e:
                return Response({
                    'error': 'An error occurred during registration',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'error': 'Invalid data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    """
    View for user login - sets JWT tokens as HTTP-only cookies
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Update last login
            user.last_login = timezone.now()
            user.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)

            # Create response with user data (no tokens in body)
            response = Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role
                }
            }, status=status.HTTP_200_OK)

            # Set tokens as HTTP-only cookies
            return set_auth_cookies(response, refresh.access_token, refresh)

        return Response({
            'error': 'Invalid credentials',
            'details': serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)

class UserLogoutView(APIView):
    """
    View for user logout - blacklists refresh token and clears cookies
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Get refresh token from cookie (preferred) or request body (fallback)
            refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
            if not refresh_token:
                refresh_token = request.data.get('refresh_token')

            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError:
                    pass  # Token may already be blacklisted or invalid

            response = Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)

            # Clear auth cookies
            return clear_auth_cookies(response)

        except Exception as e:
            response = Response({
                'error': 'Logout completed with warnings',
                'details': str(e)
            }, status=status.HTTP_200_OK)
            return clear_auth_cookies(response)

class UserProfileView(APIView):
    """
    View for retrieving and updating user profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenRefreshView(APIView):
    """
    Custom token refresh view that reads refresh token from cookie
    and sets new tokens as cookies
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # Get refresh token from cookie (preferred) or request body (fallback)
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if not refresh_token:
            refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response({
                'error': 'No refresh token provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Validate and refresh the token
            refresh = RefreshToken(refresh_token)
            access_token = refresh.access_token

            # Get user data
            user_id = refresh['user_id']
            try:
                user = User.objects.get(id=user_id)
                user_data = {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role
                }
            except User.DoesNotExist:
                user_data = None

            # Rotate refresh token if configured
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                if settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION', False):
                    try:
                        refresh.blacklist()
                    except AttributeError:
                        pass
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token

            # Create response
            response_data = {'message': 'Token refreshed successfully'}
            if user_data:
                response_data['user'] = user_data

            response = Response(response_data, status=status.HTTP_200_OK)

            # Set new tokens as cookies
            return set_auth_cookies(response, access_token, refresh)

        except TokenError as e:
            return Response({
                'error': 'Invalid or expired refresh token',
                'details': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)


class AuthStatusView(APIView):
    """
    View to check authentication status - useful for frontend to verify auth
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            return Response({
                'isAuthenticated': True,
                'user': {
                    'id': request.user.id,
                    'email': request.user.email,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'role': request.user.role
                }
            })
        return Response({
            'isAuthenticated': False,
            'user': None
        })