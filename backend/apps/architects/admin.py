from django.contrib import admin
from .models import Architect
# Register your models here.

@admin.register(Architect)
class ArchitectAdmin(admin.ModelAdmin):
    list_display = ['name', 'company_name', 'contact_email', 'license_number', 'is_active', 'is_user']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'company_name', 'contact_email', 'license_number']
    readonly_fields = ['created_at', 'updated_at']