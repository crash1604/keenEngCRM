from rest_framework import serializers
from .models import EmailTemplate, EmailLog, EmailAttachment


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
