from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import ActivityLog
from .serializers import ActivityLogSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing activity logs with role-based access control
    Only GET operations are allowed
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return activity logs based on user role
        - Admin/Manager: See all activity logs
        - Other users: See only their own activity logs
        """
        user = self.request.user

        # Base queryset with optimizations for all entity types
        queryset = ActivityLog.objects.all().select_related(
            'project', 'client', 'architect', 'user'
        ).order_by('-timestamp')

        # Optional entity_type filter from query params
        entity_type = self.request.query_params.get('entity_type')
        if entity_type and entity_type in ['project', 'client', 'architect']:
            queryset = queryset.filter(entity_type=entity_type)

        if user.role in ['admin', 'manager']:
            # Admin and managers can see all activity logs
            return queryset
        else:
            # Other users can only see activity logs where they are the user
            # OR activity logs for entities they have access to
            return queryset.filter(
                Q(user=user) |
                # Project access
                Q(project__mechanical_manager=user) |
                Q(project__client__user_account=user) |
                Q(project__architect_designer__user_account=user) |
                # Client access (if user is linked to client)
                Q(client__user_account=user) |
                # Architect access (if user is linked to architect)
                Q(architect__user_account=user)
            ).distinct()

    @action(detail=False, methods=['get'])
    def my_activity(self, request):
        """
        Get activity logs for the currently authenticated user only
        """
        user = request.user

        # Get activity logs where the current user performed the action
        my_activity_logs = ActivityLog.objects.filter(
            user=user
        ).select_related('project', 'client', 'architect').order_by('-timestamp')

        # Optional entity_type filter
        entity_type = request.query_params.get('entity_type')
        if entity_type and entity_type in ['project', 'client', 'architect']:
            my_activity_logs = my_activity_logs.filter(entity_type=entity_type)

        page = self.paginate_queryset(my_activity_logs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(my_activity_logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def project_activity(self, request):
        """
        Get activity logs for projects the user has access to
        (Only returns project-related activity)
        """
        user = request.user

        # Filter to only project activity
        base_filter = Q(entity_type='project')

        # Get projects the user has access to
        if user.role == 'admin':
            project_activity = ActivityLog.objects.filter(base_filter)
        elif user.role == 'manager':
            project_activity = ActivityLog.objects.filter(
                base_filter & (
                    Q(project__mechanical_manager=user) |
                    Q(user=user)
                )
            )
        elif user.role == 'employee':
            project_activity = ActivityLog.objects.filter(
                base_filter & (
                    Q(project__mechanical_manager=user) |
                    Q(user=user)
                )
            )
        elif user.role == 'client':
            project_activity = ActivityLog.objects.filter(
                base_filter & Q(project__client__user_account=user)
            )
        elif user.role == 'architect':
            project_activity = ActivityLog.objects.filter(
                base_filter & Q(project__architect_designer__user_account=user)
            )
        else:
            project_activity = ActivityLog.objects.filter(base_filter & Q(user=user))

        project_activity = project_activity.select_related('project', 'user').order_by('-timestamp')

        page = self.paginate_queryset(project_activity)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(project_activity, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def client_activity(self, request):
        """
        Get activity logs for clients
        (Admin/Manager only)
        """
        user = request.user

        if user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'You do not have permission to view client activity'},
                status=status.HTTP_403_FORBIDDEN
            )

        client_activity = ActivityLog.objects.filter(
            entity_type='client'
        ).select_related('client', 'user').order_by('-timestamp')

        page = self.paginate_queryset(client_activity)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(client_activity, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def architect_activity(self, request):
        """
        Get activity logs for architects
        (Admin/Manager only)
        """
        user = request.user

        if user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'You do not have permission to view architect activity'},
                status=status.HTTP_403_FORBIDDEN
            )

        architect_activity = ActivityLog.objects.filter(
            entity_type='architect'
        ).select_related('architect', 'user').order_by('-timestamp')

        page = self.paginate_queryset(architect_activity)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(architect_activity, many=True)
        return Response(serializer.data)