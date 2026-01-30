from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings

from .models import User, EmailSettings
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer, EmailSettingsSerializer
from apps.clients.models import Client
from apps.architects.models import Architect


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

                # If user is a client, create a corresponding Client record
                if user.role == 'client':
                    try:
                        Client.objects.create(
                            name=f"{user.first_name} {user.last_name}".strip() or user.email,
                            contact_email=user.email,
                            user_account=user,
                            is_active=True
                        )
                    except Exception as e:
                        print(f"Warning: Could not create Client record: {e}")

                # If user is an architect, create a corresponding Architect record
                if user.role == 'architect':
                    try:
                        Architect.objects.create(
                            name=f"{user.first_name} {user.last_name}".strip() or user.email,
                            contact_email=user.email,
                            user_account=user,
                            is_active=True
                        )
                    except Exception as e:
                        print(f"Warning: Could not create Architect record: {e}")

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


class EmailSettingsView(APIView):
    """
    View for managing user email/SMTP settings.
    Users can configure their own email provider settings.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get current user's email settings."""
        try:
            email_settings = request.user.email_settings
            serializer = EmailSettingsSerializer(email_settings)
            return Response(serializer.data)
        except EmailSettings.DoesNotExist:
            return Response({
                'message': 'No email settings configured',
                'configured': False
            }, status=status.HTTP_200_OK)

    def post(self, request):
        """Create email settings for current user."""
        # Check if settings already exist
        if hasattr(request.user, 'email_settings'):
            return Response({
                'error': 'Email settings already exist. Use PUT to update.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = EmailSettingsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """Update current user's email settings."""
        try:
            email_settings = request.user.email_settings
        except EmailSettings.DoesNotExist:
            # Create if doesn't exist
            serializer = EmailSettingsSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = EmailSettingsSerializer(email_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """Delete current user's email settings."""
        try:
            email_settings = request.user.email_settings
            email_settings.delete()
            return Response({
                'message': 'Email settings deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        except EmailSettings.DoesNotExist:
            return Response({
                'error': 'No email settings to delete'
            }, status=status.HTTP_404_NOT_FOUND)


class TestEmailSettingsView(APIView):
    """
    View to test/verify email settings by sending a test email.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Send a test email to verify settings work."""
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        print(f"=== Testing email settings for user: {request.user.email} ===")

        try:
            email_settings = request.user.email_settings
            print(f"Email settings found: provider={email_settings.provider}, email={email_settings.email_address}")
        except EmailSettings.DoesNotExist:
            print("ERROR: No email settings found")
            return Response({
                'error': 'No email settings configured'
            }, status=status.HTTP_400_BAD_REQUEST)

        config = email_settings.get_smtp_config()
        print(f"SMTP config: host={config.get('host')}, port={config.get('port')}, has_password={bool(config.get('password'))}")

        if not config.get('password'):
            print("ERROR: Password not configured")
            return Response({
                'error': 'Email password not configured. Please save your settings with a password first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create test message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'KEEN CRM - Email Settings Test'
            msg['From'] = f"{config['display_name']} <{config['email']}>"
            msg['To'] = config['email']  # Send to self

            text_content = "This is a test email from KEEN Engineering CRM. Your email settings are configured correctly!"
            html_content = """
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">Email Settings Test</h2>
                <p>This is a test email from <strong>KEEN Engineering CRM</strong>.</p>
                <p style="color: #10b981; font-weight: bold;">Your email settings are configured correctly!</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                    Provider: {provider}<br>
                    SMTP Host: {host}:{port}
                </p>
            </body>
            </html>
            """.format(
                provider=email_settings.get_provider_display(),
                host=config['host'],
                port=config['port']
            )

            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            # Connect and send
            print(f"Connecting to SMTP server: {config['host']}:{config['port']}")
            with smtplib.SMTP(config['host'], config['port'], timeout=30) as server:
                if config.get('use_tls', True):
                    print("Starting TLS...")
                    server.starttls()
                print(f"Logging in as: {config['email']}")
                server.login(config['email'], config['password'])
                print("Login successful, sending message...")
                server.send_message(msg)
                print("Message sent successfully!")

            # Update verification status
            email_settings.is_verified = True
            email_settings.last_verified_at = timezone.now()
            email_settings.save()

            return Response({
                'success': True,
                'message': f"Test email sent successfully to {config['email']}"
            })

        except smtplib.SMTPAuthenticationError as e:
            print(f"SMTP Authentication Error: {e}")
            return Response({
                'error': 'Authentication failed. Please check your email and app password.',
                'details': 'For Outlook/Microsoft 365, you need to use an App Password. For Gmail, you need to enable 2FA and create an App Password.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except smtplib.SMTPException as e:
            print(f"SMTP Exception: {e}")
            return Response({
                'error': 'SMTP error occurred',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Unexpected error: {e}")
            traceback.print_exc()
            return Response({
                'error': 'Failed to send test email',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)