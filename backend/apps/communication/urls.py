from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmailTemplateViewSet, EmailLogViewSet, CommunicationViewSet,
    EmailAccountViewSet, EmailThreadViewSet, SyncedEmailViewSet,
)

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet, basename='email-template')
router.register(r'logs', EmailLogViewSet, basename='email-log')
router.register(r'actions', CommunicationViewSet, basename='communication-action')

# Email sync endpoints
router.register(r'sync/accounts', EmailAccountViewSet, basename='email-account')
router.register(r'sync/threads', EmailThreadViewSet, basename='email-thread')
router.register(r'sync/emails', SyncedEmailViewSet, basename='synced-email')

urlpatterns = [
    path('', include(router.urls)),
]
