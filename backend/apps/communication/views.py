from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count

from .models import EmailTemplate, EmailLog, EmailAccount, EmailThread, SyncedEmail
from .serializers import (
    EmailTemplateSerializer, EmailLogSerializer,
    SendEmailSerializer, PreviewEmailSerializer,
    EmailAccountSerializer, EmailAccountCreateSerializer, EmailAccountListSerializer,
    EmailThreadSerializer, EmailThreadDetailSerializer,
    SyncedEmailSerializer, SyncedEmailListSerializer,
    LinkEmailSerializer, SyncAccountSerializer,
)
from .email_service import CommunicationEmailService
from .tasks import send_email_async, sync_email_account


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for email templates"""
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template_type', 'is_active', 'is_default']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        """Override update to debug validation errors"""
        print("=== TEMPLATE UPDATE DEBUG ===")
        print("Request data:", request.data)

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an existing template"""
        template = self.get_object()

        # Create copy
        new_template = EmailTemplate.objects.create(
            name=f"{template.name} (Copy)",
            template_type=template.template_type,
            subject=template.subject,
            body_html=template.body_html,
            body_text=template.body_text,
            is_active=False,  # Start as inactive
            created_by=request.user
        )

        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def variables(self, request, pk=None):
        """Get available variables for this template"""
        template = self.get_object()
        return Response(template.get_available_variables())


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for email logs (read-only)"""
    queryset = EmailLog.objects.select_related(
        'project', 'template', 'sent_by'
    ).prefetch_related('attachments')
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'status', 'recipient_email']

    def get_queryset(self):
        """Filter based on query params"""
        queryset = super().get_queryset()

        # Filter by project
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(sent_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(sent_at__lte=end_date)

        # Search by subject or recipient
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(recipient_email__icontains=search) |
                Q(recipient_name__icontains=search)
            )

        return queryset

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get email statistics"""
        stats = EmailLog.objects.aggregate(
            total=Count('id'),
            sent=Count('id', filter=Q(status='sent')),
            failed=Count('id', filter=Q(status='failed')),
            delivered=Count('id', filter=Q(status='delivered')),
        )

        return Response(stats)


class CommunicationViewSet(viewsets.ViewSet):
    """ViewSet for communication actions"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def send_email(self, request):
        """Send email from template asynchronously using Celery"""
        serializer = SendEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Check if async sending should be used
            use_async = request.query_params.get('async', 'true').lower() == 'true'

            project_id = serializer.validated_data['project_id']
            template_id = serializer.validated_data['template_id']
            sent_by_id = request.user.id

            # Build kwargs for optional parameters
            kwargs = {}
            if serializer.validated_data.get('recipient_email'):
                kwargs['recipient_email'] = serializer.validated_data['recipient_email']
            if serializer.validated_data.get('cc_emails'):
                kwargs['cc_emails'] = serializer.validated_data['cc_emails']
            if serializer.validated_data.get('bcc_emails'):
                kwargs['bcc_emails'] = serializer.validated_data['bcc_emails']
            if serializer.validated_data.get('custom_subject'):
                kwargs['custom_subject'] = serializer.validated_data['custom_subject']
            if serializer.validated_data.get('custom_body'):
                kwargs['custom_body'] = serializer.validated_data['custom_body']

            if use_async:
                # Send email asynchronously via Celery
                task = send_email_async.delay(
                    project_id=project_id,
                    template_id=template_id,
                    sent_by_id=sent_by_id,
                    **kwargs
                )

                return Response({
                    'success': True,
                    'message': 'Email queued for sending',
                    'task_id': task.id,
                    'status': 'queued'
                }, status=status.HTTP_202_ACCEPTED)
            else:
                # Send email synchronously (fallback)
                result = CommunicationEmailService.send_email_from_template(
                    project_id=project_id,
                    template_id=template_id,
                    sent_by=request.user,
                    **kwargs
                )
                return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def preview_email(self, request):
        """Preview email without sending"""
        serializer = PreviewEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            preview = CommunicationEmailService.preview_email_template(
                template_id=serializer.validated_data['template_id'],
                project_id=serializer.validated_data['project_id']
            )

            return Response(preview, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# =============================================================================
# Email Sync ViewSets
# =============================================================================


class EmailAccountViewSet(viewsets.ModelViewSet):
    """
    Manage email accounts for IMAP sync.
    Users can only see/manage their own accounts.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return EmailAccountCreateSerializer
        if self.action == 'list':
            return EmailAccountListSerializer
        return EmailAccountSerializer

    def get_queryset(self):
        return EmailAccount.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test IMAP connection for an account"""
        account = self.get_object()
        from .sync_service import IMAPSyncService
        service = IMAPSyncService(account)
        result = service.test_connection()
        return Response(result)

    @action(detail=True, methods=['post'])
    def sync_now(self, request, pk=None):
        """Trigger an immediate sync for this account"""
        account = self.get_object()
        if not account.sync_enabled:
            return Response(
                {'error': 'Sync is disabled for this account'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = sync_email_account.delay(str(account.id))
        return Response({
            'success': True,
            'message': 'Sync queued',
            'task_id': task.id,
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'])
    def folders(self, request, pk=None):
        """List available IMAP folders for this account"""
        account = self.get_object()
        from .sync_service import IMAPSyncService
        service = IMAPSyncService(account)
        try:
            folders = service.list_folders()
            return Response({'folders': folders})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get sync statistics for this account"""
        account = self.get_object()
        stats = {
            'total_synced': account.total_synced,
            'last_sync_at': account.last_sync_at,
            'last_sync_status': account.last_sync_status,
            'threads': account.threads.count(),
            'unread': SyncedEmail.objects.filter(
                account=account, is_read=False
            ).count(),
            'inbound': SyncedEmail.objects.filter(
                account=account, direction='inbound'
            ).count(),
            'outbound': SyncedEmail.objects.filter(
                account=account, direction='outbound'
            ).count(),
            'linked_to_projects': SyncedEmail.objects.filter(
                account=account, project__isnull=False
            ).count(),
        }
        return Response(stats)


class EmailThreadViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View email threads from synced accounts.
    Supports filtering by account, project, client, and starred/archived status.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['account', 'project', 'client', 'is_starred', 'is_archived']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EmailThreadDetailSerializer
        return EmailThreadSerializer

    def get_queryset(self):
        return EmailThread.objects.filter(
            account__user=self.request.user
        ).select_related('project', 'client')

    def get_queryset_for_list(self):
        queryset = self.get_queryset()

        # Filter by search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(participants__contains=search)
            )

        # Filter unread only
        unread = self.request.query_params.get('unread')
        if unread and unread.lower() == 'true':
            queryset = queryset.filter(unread_count__gt=0)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset_for_list())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def star(self, request, pk=None):
        """Toggle thread starred status"""
        thread = self.get_object()
        thread.is_starred = not thread.is_starred
        thread.save(update_fields=['is_starred'])
        return Response({'is_starred': thread.is_starred})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Toggle thread archived status"""
        thread = self.get_object()
        thread.is_archived = not thread.is_archived
        thread.save(update_fields=['is_archived'])
        return Response({'is_archived': thread.is_archived})

    @action(detail=True, methods=['post'])
    def link(self, request, pk=None):
        """Manually link a thread to a project/client"""
        thread = self.get_object()
        serializer = LinkEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = []
        project_id = serializer.validated_data.get('project_id')
        client_id = serializer.validated_data.get('client_id')

        if project_id is not None:
            from apps.projects.models import Project
            if project_id:
                thread.project = Project.objects.get(id=project_id)
            else:
                thread.project = None
            updated.append('project')

        if client_id is not None:
            from apps.clients.models import Client
            if client_id:
                thread.client = Client.objects.get(id=client_id)
            else:
                thread.client = None
            updated.append('client')

        if updated:
            thread.save(update_fields=updated)
            # Propagate to all messages in thread
            thread.messages.update(
                project=thread.project, client=thread.client
            )

        return Response(EmailThreadSerializer(thread).data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark all messages in a thread as read"""
        thread = self.get_object()
        thread.messages.filter(is_read=False).update(is_read=True)
        thread.unread_count = 0
        thread.save(update_fields=['unread_count'])
        return Response({'unread_count': 0})


class SyncedEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View individual synced emails.
    Supports filtering by account, folder, direction, project, client, read status.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        'account', 'folder', 'direction',
        'project', 'client', 'is_read', 'is_starred',
    ]

    def get_serializer_class(self):
        if self.action == 'list':
            return SyncedEmailListSerializer
        return SyncedEmailSerializer

    def get_queryset(self):
        queryset = SyncedEmail.objects.filter(
            account__user=self.request.user
        ).select_related('project', 'client')

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(from_address__icontains=search) |
                Q(from_name__icontains=search) |
                Q(snippet__icontains=search)
            )

        # Date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark this email as read"""
        email_obj = self.get_object()
        email_obj.is_read = True
        email_obj.save(update_fields=['is_read'])
        if email_obj.thread:
            email_obj.thread.update_counts()
        return Response({'is_read': True})

    @action(detail=True, methods=['post'])
    def toggle_star(self, request, pk=None):
        """Toggle starred status"""
        email_obj = self.get_object()
        email_obj.is_starred = not email_obj.is_starred
        email_obj.save(update_fields=['is_starred'])
        return Response({'is_starred': email_obj.is_starred})

    @action(detail=True, methods=['post'])
    def link(self, request, pk=None):
        """Manually link this email to a project/client"""
        email_obj = self.get_object()
        serializer = LinkEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from .linking_service import EmailLinkingService
        result = EmailLinkingService.manually_link_email(
            synced_email_id=email_obj.id,
            project_id=serializer.validated_data.get('project_id'),
            client_id=serializer.validated_data.get('client_id'),
        )

        if result['success']:
            email_obj.refresh_from_db()
            return Response(SyncedEmailSerializer(email_obj).data)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
