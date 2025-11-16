from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['job_number', 'project_name', 'client', 'architect_designer', 'status', 'mechanical_manager', 'due_date']
    list_filter = ['status', 'year', 'project_type', 'client', 'architect_designer']
    search_fields = ['job_number', 'project_name', 'client__name']
    readonly_fields = ['created_at', 'updated_at', 'last_status_change']