from django.contrib import admin
from .models import (
    EmailTemplate, EmailLog, EmailAttachment,
    EmailAccount, EmailThread, SyncedEmail, SyncedEmailAttachment, SyncCursor,
)


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


# =============================================================================
# Email Sync Admin
# =============================================================================


@admin.register(EmailAccount)
class EmailAccountAdmin(admin.ModelAdmin):
    list_display = [
        'email_address', 'provider', 'user', 'is_active',
        'sync_enabled', 'last_sync_at', 'last_sync_status', 'total_synced',
    ]
    list_filter = ['provider', 'is_active', 'sync_enabled', 'last_sync_status']
    search_fields = ['email_address', 'user__email', 'user__first_name']
    readonly_fields = [
        'id', 'last_sync_at', 'last_sync_status', 'last_sync_error',
        'total_synced', 'created_at', 'updated_at',
    ]


@admin.register(EmailThread)
class EmailThreadAdmin(admin.ModelAdmin):
    list_display = [
        'subject', 'account', 'message_count', 'unread_count',
        'project', 'client', 'last_message_at',
    ]
    list_filter = ['is_starred', 'is_archived']
    search_fields = ['subject', 'participants']
    readonly_fields = ['id', 'message_count', 'unread_count', 'last_message_at', 'created_at']


@admin.register(SyncedEmail)
class SyncedEmailAdmin(admin.ModelAdmin):
    list_display = [
        'subject', 'from_address', 'direction', 'date',
        'is_read', 'project', 'client', 'folder',
    ]
    list_filter = ['direction', 'is_read', 'is_starred', 'folder']
    search_fields = ['subject', 'from_address', 'from_name', 'snippet']
    readonly_fields = ['id', 'synced_at']
    date_hierarchy = 'date'


@admin.register(SyncedEmailAttachment)
class SyncedEmailAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'email', 'content_type', 'file_size', 'is_inline']
    search_fields = ['file_name']


@admin.register(SyncCursor)
class SyncCursorAdmin(admin.ModelAdmin):
    list_display = ['account', 'folder', 'last_uid', 'uidvalidity', 'last_sync_at', 'message_count']
    list_filter = ['folder']
    readonly_fields = ['last_sync_at']
