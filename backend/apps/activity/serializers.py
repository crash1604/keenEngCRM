# apps/activity/serializers.py
from rest_framework import serializers
from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    # User fields
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    # Action type display
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    entity_type_display = serializers.CharField(source='get_entity_type_display', read_only=True)

    # Project fields (nullable)
    project_job_number = serializers.CharField(source='project.job_number', read_only=True, allow_null=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True, allow_null=True)

    # Client fields (nullable)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    client_company = serializers.CharField(source='client.company_name', read_only=True, allow_null=True)

    # Architect fields (nullable)
    architect_name = serializers.CharField(source='architect.name', read_only=True, allow_null=True)
    architect_company = serializers.CharField(source='architect.company_name', read_only=True, allow_null=True)

    # Computed field for entity display name
    entity_display_name = serializers.SerializerMethodField()

    def get_entity_display_name(self, obj):
        """Get a display name for the associated entity"""
        return obj.get_entity_display_name()

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'entity_type', 'entity_type_display', 'entity_display_name',
            'project', 'project_job_number', 'project_name',
            'client', 'client_name', 'client_company',
            'architect', 'architect_name', 'architect_company',
            'action_type', 'action_type_display',
            'description', 'old_value', 'new_value', 'changed_field',
            'user', 'user_name', 'user_email',
            'timestamp', 'ip_address'
        ]
        read_only_fields = fields