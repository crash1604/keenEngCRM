from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Architect
from .serializers import ArchitectSerializer, ArchitectListSerializer


class ArchitectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Architect instances.
    """
    queryset = Architect.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name', 'contact_email', 'license_number']
    ordering_fields = ['name', 'company_name', 'created_at', 'updated_at']
    ordering = ['name']
    filterset_fields = ['is_active']

    def get_serializer_class(self):
        if self.action == 'list':
            return ArchitectListSerializer
        return ArchitectSerializer

    def get_queryset(self):
        queryset = Architect.objects.all()

        # Filter by active status if provided
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active architects"""
        architects = self.get_queryset().filter(is_active=True)
        serializer = ArchitectListSerializer(architects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get architect statistics"""
        total = Architect.objects.count()
        active = Architect.objects.filter(is_active=True).count()
        with_accounts = Architect.objects.filter(user_account__isnull=False).count()

        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
            'with_user_accounts': with_accounts,
        })
