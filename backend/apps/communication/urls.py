from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, EmailLogViewSet, CommunicationViewSet

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet, basename='email-template')
router.register(r'logs', EmailLogViewSet, basename='email-log')
router.register(r'actions', CommunicationViewSet, basename='communication-action')

urlpatterns = [
    path('', include(router.urls)),
]
