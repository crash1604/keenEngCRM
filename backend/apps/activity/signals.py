from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from apps.projects.models import Project
from .models import ActivityLog

def get_client_ip(request):
    """Get the client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@receiver(post_save, sender=Project)
def log_project_activity(sender, instance, created, **kwargs):
    """
    Automatically create activity log entries when projects are created or updated
    """
    from django.contrib.auth.models import AnonymousUser
    
    # Get the current request (if available)
    import inspect
    for frame_record in inspect.stack():
        if frame_record[3] == 'get_response':
            request = frame_record[0].f_locals['request']
            user = getattr(request, 'user', None)
            if user and not isinstance(user, AnonymousUser):
                break
    else:
        user = None
    
    if created:
        # Project was created
        ActivityLog.objects.create(
            project=instance,
            action_type='project_created',
            description=f'Project {instance.job_number} was created',
            user=user,
            ip_address=get_client_ip(request) if request else None
        )
    else:
        # Project was updated - we'll handle specific field changes in pre_save
        pass

# Track field changes
@receiver(pre_save, sender=Project)
def track_project_changes(sender, instance, **kwargs):
    """
    Track specific field changes in projects
    """
    if instance.pk:
        try:
            old_instance = Project.objects.get(pk=instance.pk)
            
            # Check for status changes
            if old_instance.status != instance.status:
                ActivityLog.objects.create(
                    project=instance,
                    action_type='status_change',
                    description=f'Status changed from {old_instance.status} to {instance.status}',
                    old_value=old_instance.status,
                    new_value=instance.status,
                    changed_field='status',
                    user=getattr(instance, '_current_user', None),
                    ip_address=getattr(instance, '_current_ip', None)
                )
            
            # Check for client changes
            if old_instance.client != instance.client:
                ActivityLog.objects.create(
                    project=instance,
                    action_type='client_changed',
                    description=f'Client changed from {old_instance.client} to {instance.client}',
                    old_value=str(old_instance.client),
                    new_value=str(instance.client),
                    changed_field='client',
                    user=getattr(instance, '_current_user', None),
                    ip_address=getattr(instance, '_current_ip', None)
                )
            
            # Check for architect changes
            if old_instance.architect_designer != instance.architect_designer:
                ActivityLog.objects.create(
                    project=instance,
                    action_type='architect_changed',
                    description=f'Architect changed from {old_instance.architect_designer} to {instance.architect_designer}',
                    old_value=str(old_instance.architect_designer) if old_instance.architect_designer else 'None',
                    new_value=str(instance.architect_designer) if instance.architect_designer else 'None',
                    changed_field='architect_designer',
                    user=getattr(instance, '_current_user', None),
                    ip_address=getattr(instance, '_current_ip', None)
                )
            
            # Check for due date changes
            if old_instance.due_date != instance.due_date:
                ActivityLog.objects.create(
                    project=instance,
                    action_type='due_date_changed',
                    description=f'Due date changed from {old_instance.due_date} to {instance.due_date}',
                    old_value=str(old_instance.due_date),
                    new_value=str(instance.due_date),
                    changed_field='due_date',
                    user=getattr(instance, '_current_user', None),
                    ip_address=getattr(instance, '_current_ip', None)
                )
                
        except Project.DoesNotExist:
            pass