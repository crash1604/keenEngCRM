from django.contrib import admin
from .models import ActivityLog

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = [
        'project', 
        'action_type_display', 
        'user', 
        'timestamp', 
        'changed_field'
    ]
    list_filter = [
        'action_type',
        'timestamp',
        'user',
    ]
    search_fields = [
        'project__job_number',
        'project__project_name', 
        'description',
        'user__username',
        'user__email',
    ]
    readonly_fields = [
        'project', 
        'action_type', 
        'description', 
        'old_value', 
        'new_value',
        'changed_field', 
        'user', 
        'timestamp',
        'ip_address',
    ]
    date_hierarchy = 'timestamp'
    
    def action_type_display(self, obj):
        return obj.get_action_type_display()
    action_type_display.short_description = 'Action Type'
    
    def has_add_permission(self, request):
        # Prevent manual adding of activity logs - they should be auto-generated
        return False
    
    def has_change_permission(self, request, obj=None):
        # Activity logs should be read-only
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Only superusers can delete activity logs
        return request.user.is_superuser