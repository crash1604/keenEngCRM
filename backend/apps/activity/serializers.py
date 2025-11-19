from rest_framework import serializers
from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    project_job_number = serializers.CharField(source='project.job_number', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'project', 'project_job_number', 'action_type', 'action_type_display',
            'description', 'old_value', 'new_value', 'changed_field', 'user',
            'user_name', 'user_email', 'timestamp', 'ip_address'
        ]
        read_only_fields = fields