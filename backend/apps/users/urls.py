from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from .views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    UserProfileView,
    CustomTokenRefreshView,
    AuthStatusView,
    EmailSettingsView,
    TestEmailSettingsView,
)

app_name = 'users'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('status/', AuthStatusView.as_view(), name='auth_status'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Email Settings
    path('email-settings/', EmailSettingsView.as_view(), name='email_settings'),
    path('email-settings/test/', TestEmailSettingsView.as_view(), name='test_email_settings'),
]