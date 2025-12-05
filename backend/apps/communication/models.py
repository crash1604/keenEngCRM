from django.db import models
from django.conf import settings
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
