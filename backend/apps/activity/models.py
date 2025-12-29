from django.db import models
from django.conf import settings
from apps.projects.models import Project
from apps.clients.models import Client
from apps.architects.models import Architect

class ActivityLog(models.Model):
    ENTITY_TYPES = [
        ('project', 'Project'),
        ('client', 'Client'),
        ('architect', 'Architect'),
    ]

    ACTION_CHOICES = [
        # Project actions
        ('status_change', 'Status Change'),
        ('note_added', 'Note Added'),
        ('field_updated', 'Field Updated'),
        ('inspection_scheduled', 'Inspection Scheduled'),
        ('due_date_changed', 'Due Date Changed'),
        ('project_created', 'Project Created'),
        ('project_updated', 'Project Updated'),
        ('client_changed', 'Client Changed'),
        ('architect_changed', 'Architect Changed'),
        ('manager_changed', 'Manager Changed'),
        # Client actions
        ('client_created', 'Client Created'),
        ('client_updated', 'Client Updated'),
        ('client_archived', 'Client Archived'),
        ('client_restored', 'Client Restored'),
        # Architect actions
        ('architect_created', 'Architect Created'),
        ('architect_updated', 'Architect Updated'),
        ('architect_deactivated', 'Architect Deactivated'),
        ('architect_activated', 'Architect Activated'),
    ]

    # Entity type identifier
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES, default='project')

    # Entity foreign keys (all nullable, at least one should be set)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='activity_logs',
        null=True,
        blank=True
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='activity_logs',
        null=True,
        blank=True
    )
    architect = models.ForeignKey(
        Architect,
        on_delete=models.CASCADE,
        related_name='activity_logs',
        null=True,
        blank=True
    )

    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    changed_field = models.CharField(max_length=100, blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    def __str__(self):
        entity_name = self.get_entity_display_name()
        return f"{entity_name} - {self.get_action_type_display()} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    def get_entity_display_name(self):
        """Get a display name for the associated entity"""
        if self.entity_type == 'project' and self.project:
            return self.project.job_number
        elif self.entity_type == 'client' and self.client:
            return self.client.name
        elif self.entity_type == 'architect' and self.architect:
            return self.architect.name
        return 'Unknown'

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        indexes = [
            models.Index(fields=['entity_type', 'timestamp']),
            models.Index(fields=['project', 'timestamp']),
            models.Index(fields=['client', 'timestamp']),
            models.Index(fields=['architect', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]