from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from apps.projects.models import Project
from .models import ActivityLog

# List of fields to track (exclude auto-generated fields)
TRACKED_FIELDS = [
    'year',
    'job_number',
    'project_name',
    'project_type',
    'status',
    'current_sub_status',
    'current_open_items',
    'current_action_items',
    'client',
    'architect_designer',
    'mechanical_manager',
    'due_date',
    'due_date_note',
    'rough_in_date',
    'rough_in_note',
    'final_inspection_date',
    'final_inspection_note',
    'address',
    'legal_address',
    'billing_info',
]

# Exclude these fields from tracking (auto-managed fields)
EXCLUDED_FIELDS = ['created_at', 'updated_at', 'last_status_change', 'id']

def get_client_ip(request):
    """Get the client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_current_request():
    """Get the current request object from the call stack"""
    import inspect
    for frame_record in inspect.stack():
        if frame_record[3] == 'get_response':
            return frame_record[0].f_locals.get('request')
    return None

@receiver(post_save, sender=Project)
def log_project_activity(sender, instance, created, **kwargs):
    """
    Automatically create activity log entries when projects are created or updated
    """
    request = get_current_request()
    user = getattr(request, 'user', None) if request else None
    
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
        # For general updates (fallback)
        changed_fields = getattr(instance, '_changed_fields', [])
        if not changed_fields:
            # If no specific fields were tracked, log a general update
            ActivityLog.objects.create(
                project=instance,
                action_type='project_updated',
                description=f'Project {instance.job_number} was updated',
                user=user,
                ip_address=get_client_ip(request) if request else None
            )

@receiver(pre_save, sender=Project)
def track_all_project_changes(sender, instance, **kwargs):
    """
    Track ALL field changes in projects automatically
    """
    if not instance.pk:
        return  # New instance, no changes to track
    
    try:
        old_instance = Project.objects.get(pk=instance.pk)
        changed_fields = []
        
        for field_name in TRACKED_FIELDS:
            if field_name in EXCLUDED_FIELDS:
                continue
                
            old_value = getattr(old_instance, field_name)
            new_value = getattr(instance, field_name)
            
            # Handle special cases for ForeignKey fields
            if hasattr(old_instance, field_name) and hasattr(old_instance, f'{field_name}_id'):
                old_value = getattr(old_instance, field_name)
                new_value = getattr(instance, field_name)
            
            # Compare values properly
            if old_value != new_value:
                changed_fields.append(field_name)
                
                # Get human-readable field names
                field_verbose_name = get_field_verbose_name(Project, field_name)
                
                # Format values for display
                old_display = format_field_value(old_value)
                new_display = format_field_value(new_value)
                
                # Determine action type based on field
                action_type = get_action_type_for_field(field_name)
                
                # Create activity log for this field change
                request = get_current_request()
                user = getattr(request, 'user', None) if request else None
                
                ActivityLog.objects.create(
                    project=instance,
                    action_type=action_type,
                    description=f'{field_verbose_name} changed from "{old_display}" to "{new_display}"',
                    old_value=str(old_value),
                    new_value=str(new_value),
                    changed_field=field_name,
                    user=user,
                    ip_address=get_client_ip(request) if request else None
                )
        
        # Store changed fields for post_save signal
        instance._changed_fields = changed_fields
        
    except Project.DoesNotExist:
        pass

def get_field_verbose_name(model, field_name):
    """Get the verbose name of a field"""
    try:
        return model._meta.get_field(field_name).verbose_name.title()
    except:
        return field_name.replace('_', ' ').title()

def format_field_value(value):
    """Format field values for human-readable display"""
    if value is None:
        return "None"
    elif value == "":
        return "[Empty]"
    elif hasattr(value, 'all'):  # Many-to-many field
        return ", ".join(str(item) for item in value.all())
    elif hasattr(value, '__str__'):
        return str(value)
    else:
        return value

def get_action_type_for_field(field_name):
    """Determine the appropriate action type for different fields"""
    action_mapping = {
        'status': 'status_change',
        'client': 'client_changed',
        'architect_designer': 'architect_changed',
        'mechanical_manager': 'manager_changed',
        'due_date': 'due_date_changed',
        'rough_in_date': 'inspection_scheduled',
        'final_inspection_date': 'inspection_scheduled',
    }
    return action_mapping.get(field_name, 'field_updated')