from rest_framework import serializers
from django.utils import timezone
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    architect_name = serializers.CharField(source='architect_designer.name', read_only=True)
    manager_name = serializers.CharField(source='mechanical_manager.get_full_name', read_only=True)
    project_types_list = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    days_until_due = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'year', 'job_number', 'project_name', 'project_type',
            'project_types_list', 'status', 'status_display', 'current_sub_status',
            'current_open_items', 'current_action_items', 'client', 'client_name',
            'architect_designer', 'architect_name', 'mechanical_manager', 'manager_name',
            'due_date', 'due_date_note', 'rough_in_date', 'rough_in_note',
            'final_inspection_date', 'final_inspection_note', 'address', 
            'legal_address', 'billing_info', 'created_at', 'updated_at',
            'is_overdue', 'days_until_due'
        ]
        read_only_fields = ['created_at', 'updated_at', 'job_number']
    
    def get_project_types_list(self, obj):
        return obj.get_project_types_list()
    
    def get_is_overdue(self, obj):
        return obj.due_date < timezone.now().date() if obj.due_date else False
    
    def get_days_until_due(self, obj):
        if obj.due_date:
            delta = obj.due_date - timezone.now().date()
            return delta.days
        return None

class ProjectDetailSerializer(ProjectSerializer):
    """Extended serializer for detailed project view"""
    activity_logs_count = serializers.SerializerMethodField()
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['activity_logs_count']
    
    def get_activity_logs_count(self, obj):
        return obj.activity_logs.count()

class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for project creation with validation"""
    
    class Meta:
        model = Project
        fields = [
            'year', 'project_name', 'project_type', 'status', 'current_sub_status',
            'current_open_items', 'current_action_items', 'client', 'architect_designer',
            'mechanical_manager', 'due_date', 'due_date_note', 'address',
            'legal_address', 'billing_info'
        ]
    
    def validate_project_type(self, value):
        """Validate project type format"""
        valid_types = ['M', 'E', 'P', 'EM', 'FP', 'TI', 'VI']
        if value:
            types_list = [pt.strip() for pt in value.split(',')]
            for pt in types_list:
                if pt not in valid_types:
                    raise serializers.ValidationError(f"Invalid project type: {pt}")
        return value
    
    def validate_due_date(self, value):
        """Ensure due date is not in the past"""
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value

class ProjectStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for status updates only"""
    
    class Meta:
        model = Project
        fields = ['status']
    
    def validate_status(self, value):
        """Validate status transition"""
        valid_statuses = dict(Project.STATUS_CHOICES)
        if value not in valid_statuses:
            raise serializers.ValidationError("Invalid status")
        return value
    

class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Serializer for project updates (all fields allowed)"""
    
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'job_number']
    
    def update(self, instance, validated_data):
        """Handle partial updates"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance