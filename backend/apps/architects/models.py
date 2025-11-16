from django.db import models
from django.conf import settings

class Architect(models.Model):
    # Basic Information
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Professional Information
    company_name = models.CharField(max_length=200, blank=True, null=True)
    license_number = models.CharField(max_length=100, blank=True, null=True)
    professional_affiliations = models.TextField(blank=True, null=True)
    
    # Optional: Link to User account if some architects are also users
    user_account = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'role': 'architect'},
        related_name='architect_profile'
    )
    
    # Additional Fields
    website = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.company_name:
            return f"{self.company_name} - {self.name}"
        return self.name
    
    def is_user(self):
        """Check if this architect has a user account"""
        return self.user_account is not None
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Architect/Designer'
        verbose_name_plural = 'Architects/Designers'