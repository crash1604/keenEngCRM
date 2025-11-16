from django.db import models
from django.conf import settings
from apps.projects.models import Project

class ActivityLog(models.Model):
    ACTION_CHOICES = [
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
    ]
    
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='activity_logs'
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
        return f"{self.project.job_number} - {self.get_action_type_display()} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        indexes = [
            models.Index(fields=['project', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]