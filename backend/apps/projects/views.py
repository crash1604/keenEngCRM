from rest_framework import viewsets, permissions, status, filters
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
from .models import Project
from .serializers import (
    ProjectSerializer, 
    ProjectDetailSerializer, 
    ProjectCreateSerializer,
    ProjectStatusUpdateSerializer
)
from .filters import ProjectFilter
from .permissions import ProjectPermissions
from .pagination import ProjectPagination

User = get_user_model()

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects with role-based access control
    """
    queryset = Project.objects.all().select_related(
        'client', 'architect_designer', 'mechanical_manager'
    ).prefetch_related('activity_logs')
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = ['job_number', 'project_name', 'client__name', 'architect_designer__name']
    ordering_fields = ['job_number', 'project_name', 'due_date', 'created_at', 'status']
    ordering = ['-created_at']
    pagination_class = ProjectPagination
    permission_classes = [permissions.IsAuthenticated, ProjectPermissions]

    def get_queryset(self):
        """
        Return projects based on user role with optimized queries
        """
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == 'admin':
            return queryset
        elif user.role == 'manager':
            # Managers see all projects but can be filtered by their management
            if self.request.query_params.get('my_projects'):
                return queryset.filter(mechanical_manager=user)
            return queryset
        elif user.role == 'employee':
            # Employees see all the projects they manage
            return queryset
        elif user.role == 'client':
            # Clients see their own projects
            return queryset.filter(client__user_account=user)
        elif user.role == 'architect':
            # Architects see projects they're associated with
            return queryset.filter(architect_designer__user_account=user)
        return queryset.none()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        elif self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            # Use ProjectSerializer for updates since it has all fields
            return ProjectSerializer
        elif self.action == 'update_status':
            return ProjectStatusUpdateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        """
        Set mechanical_manager to current user if not provided and user is manager/employee
        """
        user = self.request.user
        if user.role in ['manager', 'employee'] and 'mechanical_manager' not in serializer.validated_data:
            serializer.save(mechanical_manager=user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        """
        Track changes before saving
        """
        instance = self.get_object()
        # Store old instance for change tracking
        self._old_instance = Project.objects.get(pk=instance.pk)
        serializer.save()

    def update(self, request, *args, **kwargs):
        """
        Override update to debug validation errors and handle partial updates
        """
        print("=== UPDATE REQUEST DEBUG ===")
        print("URL:", request.path)
        print("Method:", request.method)
        print("User:", request.user.username)
        print("User role:", request.user.role)
        print("Request data:", request.data)
        print("Content type:", request.content_type)
        
        instance = self.get_object()
        print("Project being updated:", instance.id, instance.project_name)
        
        # For partial updates, use partial=True
        partial = kwargs.pop('partial', False)
        if request.method == 'PATCH':
            partial = True
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        print("=== SERIALIZER VALIDATION ===")
        print("Serializer is valid:", serializer.is_valid())
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_update(serializer)
            print("=== UPDATE SUCCESS ===")
            print("Updated data:", serializer.data)
            return Response(serializer.data)
        except Exception as e:
            print("=== UPDATE ERROR ===")
            print("Exception:", str(e))
            print("Exception type:", type(e))
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH requests for partial updates
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Custom action to update project status with validation
        """
        project = self.get_object()
        serializer = self.get_serializer(project, data=request.data)
        
        if serializer.is_valid():
            old_status = project.status
            project = serializer.save()
            
            # Activity log is automatically created via signals
            return Response({
                'status': 'success',
                'message': f'Project status updated from {old_status} to {project.status}',
                'data': ProjectSerializer(project).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Comprehensive dashboard statistics
        """
        user = request.user
        queryset = self.get_queryset()
        
        # Calculate overdue projects
        overdue = queryset.filter(
            due_date__lt=timezone.now().date(),
            status__in=['not_started', 'in_progress', 'submitted']
        ).count()

        # Projects due in next 7 days
        due_soon = queryset.filter(
            due_date__range=[timezone.now().date(), timezone.now().date() + timedelta(days=7)],
            status__in=['not_started', 'in_progress', 'submitted']
        ).count()

        stats = {
            'total_projects': queryset.count(),
            'by_status': {
                status_label: queryset.filter(status=status_value).count()
                for status_value, status_label in Project.STATUS_CHOICES
            },
            'overdue_projects': overdue,
            'due_soon_projects': due_soon,
            'completed_this_month': queryset.filter(
                status='completed',
                updated_at__month=timezone.now().month,
                updated_at__year=timezone.now().year
            ).count(),
        }
        
        # Add manager-specific stats
        if user.role in ['manager', 'admin']:
            stats['by_manager'] = {
                manager.get_full_name() or manager.username: queryset.filter(
                    mechanical_manager=manager
                ).count()
                for manager in User.objects.filter(role__in=['manager', 'employee'])
            }

        return Response(stats)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get all overdue projects with detailed information
        """
        queryset = self.get_queryset().filter(
            due_date__lt=timezone.now().date(),
            status__in=['not_started', 'in_progress', 'submitted']
        ).select_related('client', 'mechanical_manager')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_inspections(self, request):
        """
        Get projects with upcoming inspections
        """
        next_week = timezone.now().date() + timedelta(days=7)
        queryset = self.get_queryset().filter(
            Q(rough_in_date__lte=next_week) | Q(final_inspection_date__lte=next_week),
            status__in=['in_progress', 'submitted']
        ).exclude(
            Q(rough_in_date__isnull=True) & Q(final_inspection_date__isnull=True)
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def activity_logs(self, request, pk=None):
        """
        Get activity logs for a specific project
        """
        project = self.get_object()
        activity_logs = project.activity_logs.all().select_related('user')
        
        from apps.activity.serializers import ActivityLogSerializer
        serializer = ActivityLogSerializer(activity_logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export projects to CSV with all fields from the Project model
        """
        import csv
        from django.http import HttpResponse

        queryset = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="projects_export.csv"'

        writer = csv.writer(response)
        # Header row with all Project model fields
        writer.writerow([
            'Year',
            'Job Number',
            'Project Name',
            'Project Type',
            'Status',
            'Current Sub Status',
            'Current Open Items',
            'Current Action Items',
            'Client',
            'Architect/Designer',
            'Mechanical Manager',
            'Due Date',
            'Due Date Note',
            'Rough In Date',
            'Rough In Note',
            'Final Inspection Date',
            'Final Inspection Note',
            'Address',
            'Legal Address',
            'Billing Info',
            'Created At',
            'Updated At',
            'Last Status Change'
        ])

        for project in queryset:
            writer.writerow([
                project.year,
                project.job_number,
                project.project_name,
                ', '.join(project.get_project_types_list()),
                project.get_status_display(),
                project.current_sub_status or '',
                project.current_open_items or '',
                project.current_action_items or '',
                str(project.client) if project.client else '',
                str(project.architect_designer) if project.architect_designer else '',
                project.mechanical_manager.get_full_name() if project.mechanical_manager else '',
                project.due_date.strftime('%Y-%m-%d') if project.due_date else '',
                project.due_date_note or '',
                project.rough_in_date.strftime('%Y-%m-%d') if project.rough_in_date else '',
                project.rough_in_note or '',
                project.final_inspection_date.strftime('%Y-%m-%d') if project.final_inspection_date else '',
                project.final_inspection_note or '',
                project.address or '',
                project.legal_address or '',
                project.billing_info or '',
                project.created_at.strftime('%Y-%m-%d %H:%M:%S') if project.created_at else '',
                project.updated_at.strftime('%Y-%m-%d %H:%M:%S') if project.updated_at else '',
                project.last_status_change.strftime('%Y-%m-%d %H:%M:%S') if project.last_status_change else ''
            ])

        return response