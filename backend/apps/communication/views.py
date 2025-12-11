from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count

from .models import EmailTemplate, EmailLog
from .serializers import (
    EmailTemplateSerializer, EmailLogSerializer,
    SendEmailSerializer, PreviewEmailSerializer
)
from .email_service import CommunicationEmailService


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
        """Send email from template"""
        serializer = SendEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = CommunicationEmailService.send_email_from_template(
                project_id=serializer.validated_data['project_id'],
                template_id=serializer.validated_data['template_id'],
                recipient_email=serializer.validated_data.get('recipient_email'),
                cc_emails=serializer.validated_data.get('cc_emails'),
                bcc_emails=serializer.validated_data.get('bcc_emails'),
                custom_subject=serializer.validated_data.get('custom_subject'),
                custom_body=serializer.validated_data.get('custom_body'),
                sent_by=request.user
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
