from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArchitectViewSet

router = DefaultRouter()
router.register(r'', ArchitectViewSet, basename='architect')

urlpatterns = [
    path('', include(router.urls)),
]
