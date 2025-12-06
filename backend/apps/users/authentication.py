from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from HTTP-only cookies.
    Falls back to Authorization header for backwards compatibility.
    """

    def authenticate(self, request):
        # First try to get the token from cookies
        raw_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)

        # If no cookie, fall back to Authorization header
        if raw_token is None:
            return super().authenticate(request)

        # Validate the token from cookie
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except InvalidToken:
            return None
