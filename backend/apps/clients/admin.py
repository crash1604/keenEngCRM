from django.contrib import admin
from .models import Client

# Register your models here.
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'company_name', 'contact_email', 'phone', 'is_user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'company_name', 'contact_email', 'phone']
    readonly_fields = ['created_at', 'updated_at']