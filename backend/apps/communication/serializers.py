from rest_framework import serializers
from .models import (
    EmailTemplate, EmailLog, EmailAttachment,
    EmailAccount, EmailThread, SyncedEmail, SyncedEmailAttachment, SyncCursor,
)


class EmailTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)

    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'template_type', 'template_type_display',
            'subject', 'body_html', 'body_text',
            'is_active', 'is_default',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
            'available_variables'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class EmailAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailAttachment
        fields = ['id', 'file_name', 'file_path', 'file_size', 'content_type', 'uploaded_at']


class EmailLogSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    project_job_number = serializers.CharField(source='project.job_number', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    attachments = EmailAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = EmailLog
        fields = [
            'id', 'project', 'project_name', 'project_job_number',
            'template', 'template_name',
            'recipient_email', 'recipient_name',
            'cc_emails', 'bcc_emails',
            'subject', 'body_html', 'body_text',
            'sent_by', 'sent_by_name', 'sent_at',
            'status', 'status_display', 'error_message',
            'message_id', 'opened_at', 'clicked_at',
            'attachments'
        ]
        read_only_fields = ['sent_at', 'opened_at', 'clicked_at']


class SendEmailSerializer(serializers.Serializer):
    """Serializer for sending email request"""
    template_id = serializers.IntegerField(required=True)
    project_id = serializers.IntegerField(required=True)
    recipient_email = serializers.EmailField(required=False, allow_null=True)
    cc_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=True
    )
    bcc_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        allow_empty=True
    )
    custom_subject = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    custom_body = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class PreviewEmailSerializer(serializers.Serializer):
    """Serializer for email preview request"""
    template_id = serializers.IntegerField(required=True)
    project_id = serializers.IntegerField(required=True)


# =============================================================================
# Email Sync Serializers
# =============================================================================


class EmailAccountSerializer(serializers.ModelSerializer):
    """Full serializer for email account CRUD"""
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    auth_method_display = serializers.CharField(source='get_auth_method_display', read_only=True)
    oauth2_connected = serializers.SerializerMethodField()

    class Meta:
        model = EmailAccount
        fields = [
            'id', 'email_address', 'display_name',
            'provider', 'provider_display',
            'auth_method', 'auth_method_display',
            'oauth2_connected',
            'imap_host', 'imap_port', 'imap_use_ssl',
            'smtp_host', 'smtp_port', 'smtp_use_tls',
            'is_active', 'sync_enabled',
            'sync_interval_minutes', 'sync_folders', 'max_sync_age_days',
            'last_sync_at', 'last_sync_status', 'last_sync_error',
            'total_synced',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'last_sync_at', 'last_sync_status',
            'last_sync_error', 'total_synced',
            'created_at', 'updated_at',
        ]

    def get_oauth2_connected(self, obj):
        return bool(obj.oauth2_refresh_token)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class EmailAccountCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating an email account with credentials"""
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = EmailAccount
        fields = [
            'email_address', 'display_name',
            'provider', 'auth_method',
            'imap_host', 'imap_port', 'imap_use_ssl',
            'smtp_host', 'smtp_port', 'smtp_use_tls',
            'password',
            'sync_enabled', 'sync_interval_minutes',
            'sync_folders', 'max_sync_age_days',
        ]

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class EmailAccountListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing accounts (no credentials)"""
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    oauth2_connected = serializers.SerializerMethodField()

    class Meta:
        model = EmailAccount
        fields = [
            'id', 'email_address', 'display_name',
            'provider', 'provider_display',
            'oauth2_connected',
            'is_active', 'sync_enabled',
            'last_sync_at', 'last_sync_status',
            'total_synced', 'created_at',
        ]

    def get_oauth2_connected(self, obj):
        return bool(obj.oauth2_refresh_token)


class SyncedEmailAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncedEmailAttachment
        fields = ['id', 'file_name', 'content_type', 'file_size', 'is_inline']


class SyncedEmailSerializer(serializers.ModelSerializer):
    """Full serializer for a synced email message"""
    attachments = SyncedEmailAttachmentSerializer(many=True, read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True, default=None)
    project_job_number = serializers.CharField(source='project.job_number', read_only=True, default=None)
    client_name = serializers.CharField(source='client.name', read_only=True, default=None)
    direction_display = serializers.CharField(source='get_direction_display', read_only=True)

    class Meta:
        model = SyncedEmail
        fields = [
            'id', 'account', 'thread',
            'message_id', 'folder', 'direction', 'direction_display',
            'from_address', 'from_name',
            'to_addresses', 'cc_addresses', 'bcc_addresses', 'reply_to',
            'subject', 'date', 'snippet',
            'body_text', 'body_html',
            'has_attachments', 'attachments',
            'project', 'project_name', 'project_job_number',
            'client', 'client_name',
            'is_read', 'is_starred', 'is_draft',
            'synced_at',
        ]
        read_only_fields = [
            'id', 'account', 'message_id', 'folder',
            'from_address', 'from_name',
            'to_addresses', 'cc_addresses', 'bcc_addresses',
            'subject', 'date', 'body_text', 'body_html',
            'has_attachments', 'synced_at',
        ]


class SyncedEmailListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing synced emails"""
    project_name = serializers.CharField(source='project.project_name', read_only=True, default=None)
    client_name = serializers.CharField(source='client.name', read_only=True, default=None)

    class Meta:
        model = SyncedEmail
        fields = [
            'id', 'thread', 'direction',
            'from_address', 'from_name',
            'to_addresses', 'subject', 'date', 'snippet',
            'has_attachments',
            'project', 'project_name', 'client', 'client_name',
            'is_read', 'is_starred', 'folder',
        ]


class EmailThreadSerializer(serializers.ModelSerializer):
    """Serializer for email threads"""
    project_name = serializers.CharField(source='project.project_name', read_only=True, default=None)
    project_job_number = serializers.CharField(source='project.job_number', read_only=True, default=None)
    client_name = serializers.CharField(source='client.name', read_only=True, default=None)
    latest_snippet = serializers.SerializerMethodField()

    class Meta:
        model = EmailThread
        fields = [
            'id', 'account', 'subject', 'participants',
            'project', 'project_name', 'project_job_number',
            'client', 'client_name',
            'message_count', 'unread_count', 'last_message_at',
            'is_starred', 'is_archived',
            'latest_snippet',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'account', 'message_count', 'unread_count',
            'last_message_at', 'created_at', 'updated_at',
        ]

    def get_latest_snippet(self, obj):
        latest = obj.messages.order_by('-date').only('snippet').first()
        return latest.snippet if latest else ''


class EmailThreadDetailSerializer(EmailThreadSerializer):
    """Thread serializer with nested messages"""
    messages = SyncedEmailListSerializer(many=True, read_only=True, source='messages.all')

    class Meta(EmailThreadSerializer.Meta):
        fields = EmailThreadSerializer.Meta.fields + ['messages']


class LinkEmailSerializer(serializers.Serializer):
    """Serializer for manually linking an email to a project/client"""
    project_id = serializers.IntegerField(required=False, allow_null=True)
    client_id = serializers.IntegerField(required=False, allow_null=True)


class SyncAccountSerializer(serializers.Serializer):
    """Serializer for triggering an account sync"""
    account_id = serializers.UUIDField(required=True)
