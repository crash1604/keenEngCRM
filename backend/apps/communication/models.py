import uuid

from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.projects.models import Project
from apps.clients.models import Client


class EmailTemplate(models.Model):
    """Pre-defined email templates with variable placeholders"""

    TEMPLATE_TYPES = [
        ('status_update', 'Status Update'),
        ('inspection_reminder', 'Inspection Reminder'),
        ('project_completion', 'Project Completion'),
        ('general_update', 'General Update'),
        ('invoice_notification', 'Invoice Notification'),
        ('delay_notification', 'Delay Notification'),
        ('permit_update', 'Permit Update'),
        ('custom', 'Custom Template'),
    ]

    name = models.CharField(max_length=200, help_text="Template name for internal use")
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPES)
    subject = models.CharField(max_length=300, help_text="Email subject. Use {{variable}} for dynamic content")
    body_html = models.TextField(help_text="HTML email body. Use {{project.field_name}} for project data")
    body_text = models.TextField(help_text="Plain text version", blank=True, null=True)

    # Template settings
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Default template for this type")

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Available variables documentation
    available_variables = models.JSONField(
        default=dict,
        help_text="JSON object documenting available variables",
        blank=True
    )

    class Meta:
        ordering = ['template_type', 'name']
        verbose_name = 'Email Template'
        verbose_name_plural = 'Email Templates'

    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"

    def get_available_variables(self):
        """Return list of available template variables"""
        return {
            'project': [
                'project_name', 'job_number', 'status', 'current_sub_status',
                'due_date', 'address', 'current_open_items', 'current_action_items',
                'rough_in_date', 'final_inspection_date', 'year', 'project_types'
            ],
            'client': [
                'name', 'company_name', 'contact_email', 'phone',
                'contact_person', 'address'
            ],
            'manager': [
                'first_name', 'last_name', 'full_name', 'email', 'phone'
            ],
            'architect': [
                'name', 'company_name', 'contact_email', 'phone'
            ],
            'system': [
                'current_date', 'company_name', 'support_email'
            ]
        }


class EmailLog(models.Model):
    """History of all sent emails"""

    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
        ('bounced', 'Bounced'),
        ('delivered', 'Delivered'),
    ]

    # Email details
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='emails')
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_emails'
    )

    # Recipients
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=200, blank=True)
    cc_emails = models.JSONField(default=list, blank=True, help_text="List of CC email addresses")
    bcc_emails = models.JSONField(default=list, blank=True, help_text="List of BCC email addresses")

    # Email content (stored for history)
    subject = models.CharField(max_length=300)
    body_html = models.TextField()
    body_text = models.TextField(blank=True, null=True)

    # Metadata
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_emails'
    )
    sent_at = models.DateTimeField(auto_now_add=True)

    # Delivery status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    error_message = models.TextField(blank=True, null=True)

    # AWS SES metadata (optional)
    message_id = models.CharField(max_length=200, blank=True, null=True, help_text="SES Message ID")

    # Tracking
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-sent_at']
        verbose_name = 'Email Log'
        verbose_name_plural = 'Email Logs'
        indexes = [
            models.Index(fields=['project', '-sent_at']),
            models.Index(fields=['recipient_email', '-sent_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.subject} to {self.recipient_email} ({self.sent_at.strftime('%Y-%m-%d %H:%M')})"


class EmailAttachment(models.Model):
    """Attachments for emails"""

    email_log = models.ForeignKey(EmailLog, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='email_attachments/%Y/%m/')
    file_size = models.IntegerField(help_text="File size in bytes")
    content_type = models.CharField(max_length=100)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['file_name']

    def __str__(self):
        return self.file_name


# =============================================================================
# Email Sync Models
# =============================================================================


class EmailAccount(models.Model):
    """IMAP/SMTP email account configuration for syncing"""

    PROVIDER_CHOICES = [
        ('gmail', 'Gmail'),
        ('outlook', 'Outlook / Office 365'),
        ('imap', 'Custom IMAP'),
    ]

    AUTH_METHOD_CHOICES = [
        ('password', 'App Password'),
        ('oauth2', 'OAuth 2.0'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_accounts'
    )
    email_address = models.EmailField()
    display_name = models.CharField(max_length=200, blank=True)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='imap')
    auth_method = models.CharField(max_length=20, choices=AUTH_METHOD_CHOICES, default='password')

    # IMAP settings
    imap_host = models.CharField(max_length=255, blank=True)
    imap_port = models.IntegerField(default=993)
    imap_use_ssl = models.BooleanField(default=True)

    # SMTP settings
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.IntegerField(default=587)
    smtp_use_tls = models.BooleanField(default=True)

    # Credentials (encrypted at rest in production via app-level encryption)
    password = models.CharField(max_length=500, blank=True)
    oauth2_refresh_token = models.TextField(blank=True)
    oauth2_access_token = models.TextField(blank=True)
    oauth2_token_expiry = models.DateTimeField(null=True, blank=True)

    # Sync configuration
    is_active = models.BooleanField(default=True)
    sync_enabled = models.BooleanField(default=True)
    sync_interval_minutes = models.IntegerField(
        default=5,
        help_text="How often to sync in minutes"
    )
    sync_folders = models.JSONField(
        default=list,
        blank=True,
        help_text="IMAP folders to sync, e.g. ['INBOX', 'Sent']"
    )
    max_sync_age_days = models.IntegerField(
        default=30,
        help_text="Only sync emails newer than this many days"
    )

    # Status tracking
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(max_length=20, blank=True)
    last_sync_error = models.TextField(blank=True)
    total_synced = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Account'
        verbose_name_plural = 'Email Accounts'
        unique_together = ['user', 'email_address']

    def __str__(self):
        return f"{self.email_address} ({self.get_provider_display()})"

    def get_imap_config(self):
        """Return IMAP connection settings based on provider"""
        presets = {
            'gmail': {'host': 'imap.gmail.com', 'port': 993, 'ssl': True},
            'outlook': {'host': 'outlook.office365.com', 'port': 993, 'ssl': True},
        }
        if self.provider in presets and not self.imap_host:
            return presets[self.provider]
        return {
            'host': self.imap_host,
            'port': self.imap_port,
            'ssl': self.imap_use_ssl,
        }

    def get_smtp_config(self):
        """Return SMTP connection settings based on provider"""
        presets = {
            'gmail': {'host': 'smtp.gmail.com', 'port': 587, 'tls': True},
            'outlook': {'host': 'smtp.office365.com', 'port': 587, 'tls': True},
        }
        if self.provider in presets and not self.smtp_host:
            return presets[self.provider]
        return {
            'host': self.smtp_host,
            'port': self.smtp_port,
            'tls': self.smtp_use_tls,
        }


class EmailThread(models.Model):
    """Groups related emails into a conversation thread"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(
        EmailAccount,
        on_delete=models.CASCADE,
        related_name='threads'
    )
    subject = models.CharField(max_length=500)
    participants = models.JSONField(
        default=list,
        help_text="List of email addresses involved in the thread"
    )

    # Auto-linking to CRM entities
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_threads'
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_threads'
    )

    # Thread metadata
    message_count = models.IntegerField(default=0)
    unread_count = models.IntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True)
    is_starred = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_message_at']
        verbose_name = 'Email Thread'
        verbose_name_plural = 'Email Threads'
        indexes = [
            models.Index(fields=['account', '-last_message_at']),
            models.Index(fields=['project', '-last_message_at']),
            models.Index(fields=['client', '-last_message_at']),
        ]

    def __str__(self):
        return f"Thread: {self.subject[:60]}"

    def update_counts(self):
        """Recalculate message and unread counts from actual messages"""
        self.message_count = self.messages.count()
        self.unread_count = self.messages.filter(is_read=False).count()
        latest = self.messages.order_by('-date').first()
        if latest:
            self.last_message_at = latest.date
        self.save(update_fields=['message_count', 'unread_count', 'last_message_at'])


class SyncedEmail(models.Model):
    """Individual email message synced from an IMAP account"""

    DIRECTION_CHOICES = [
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(
        EmailAccount,
        on_delete=models.CASCADE,
        related_name='synced_emails'
    )
    thread = models.ForeignKey(
        EmailThread,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='messages'
    )

    # IMAP identifiers for deduplication and incremental sync
    message_id = models.CharField(
        max_length=500,
        db_index=True,
        help_text="RFC 2822 Message-ID header"
    )
    imap_uid = models.CharField(max_length=100, blank=True)
    folder = models.CharField(max_length=200, default='INBOX')
    in_reply_to = models.CharField(max_length=500, blank=True)
    references = models.JSONField(
        default=list,
        blank=True,
        help_text="List of Message-IDs this email references"
    )

    # Email envelope
    from_address = models.EmailField()
    from_name = models.CharField(max_length=200, blank=True)
    to_addresses = models.JSONField(default=list)
    cc_addresses = models.JSONField(default=list, blank=True)
    bcc_addresses = models.JSONField(default=list, blank=True)
    reply_to = models.CharField(max_length=255, blank=True)

    subject = models.CharField(max_length=500)
    date = models.DateTimeField(db_index=True)
    direction = models.CharField(
        max_length=10,
        choices=DIRECTION_CHOICES,
        default='inbound'
    )

    # Content
    body_text = models.TextField(blank=True)
    body_html = models.TextField(blank=True)
    snippet = models.CharField(
        max_length=300,
        blank=True,
        help_text="Short preview of the email body"
    )
    has_attachments = models.BooleanField(default=False)

    # CRM linking
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='synced_emails'
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='synced_emails'
    )

    # Flags
    is_read = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    is_draft = models.BooleanField(default=False)

    # Metadata
    raw_headers = models.JSONField(default=dict, blank=True)
    synced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name = 'Synced Email'
        verbose_name_plural = 'Synced Emails'
        unique_together = ['account', 'message_id']
        indexes = [
            models.Index(fields=['account', '-date']),
            models.Index(fields=['account', 'folder', '-date']),
            models.Index(fields=['from_address', '-date']),
            models.Index(fields=['direction', '-date']),
            models.Index(fields=['project', '-date']),
            models.Index(fields=['client', '-date']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"{self.subject[:60]} from {self.from_address}"

    def save(self, *args, **kwargs):
        if not self.snippet and self.body_text:
            self.snippet = self.body_text[:300].strip()
        super().save(*args, **kwargs)


class SyncedEmailAttachment(models.Model):
    """Attachment from a synced email"""

    email = models.ForeignKey(
        SyncedEmail,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.IntegerField(default=0, help_text="File size in bytes")
    file = models.FileField(
        upload_to='synced_email_attachments/%Y/%m/',
        blank=True
    )
    is_inline = models.BooleanField(default=False)
    content_id = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['file_name']

    def __str__(self):
        return self.file_name


class SyncCursor(models.Model):
    """Tracks per-folder sync progress for incremental IMAP sync"""

    account = models.ForeignKey(
        EmailAccount,
        on_delete=models.CASCADE,
        related_name='sync_cursors'
    )
    folder = models.CharField(max_length=200)
    uidvalidity = models.BigIntegerField(
        default=0,
        help_text="IMAP UIDVALIDITY for detecting folder resets"
    )
    last_uid = models.BigIntegerField(
        default=0,
        help_text="Last synced IMAP UID"
    )
    last_sync_at = models.DateTimeField(null=True, blank=True)
    message_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ['account', 'folder']
        verbose_name = 'Sync Cursor'
        verbose_name_plural = 'Sync Cursors'

    def __str__(self):
        return f"{self.account.email_address} - {self.folder} (UID: {self.last_uid})"
