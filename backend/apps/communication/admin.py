from django.contrib import admin
from .models import EmailTemplate, EmailLog, EmailAttachment


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'is_active', 'is_default', 'created_by', 'created_at']
    list_filter = ['template_type', 'is_active', 'is_default']
    search_fields = ['name', 'subject']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['subject', 'recipient_email', 'project', 'status', 'sent_by', 'sent_at']
    list_filter = ['status', 'sent_at']
    search_fields = ['subject', 'recipient_email', 'project__project_name']
    readonly_fields = ['sent_at', 'opened_at', 'clicked_at']
    date_hierarchy = 'sent_at'


@admin.register(EmailAttachment)
class EmailAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'email_log', 'file_size', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['file_name']
