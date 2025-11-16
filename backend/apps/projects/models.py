from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

def default_due_date():
    return timezone.now().date() + timedelta(weeks=2)

class Project(models.Model):
    # Project Type Choices with multiple selection capability
    PROJECT_TYPE_CHOICES = [
        ('M', 'Mechanical'),
        ('E', 'Electrical'),
        ('P', 'Plumbing'),
        ('EM', 'Energy Modelling'),
        ('FP', 'Fire Protection'),
        ('TI', 'Tenant Improvement'),
        ('VI', 'Verification Pending'),
    ]
    
    # Status Choices
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
        ('closed_paid', 'Closed & Paid'),
        ('cancelled', 'Cancelled / Voided'),
        ('on_hold', 'On Hold'),
    ]
    
    # Basic Information
    year = models.IntegerField(default=timezone.now().year)
    job_number = models.CharField(max_length=50, unique=True)
    project_name = models.CharField(max_length=255)
    
    # Project Type (multiple selection using CharField with comma-separated values)
    project_type = models.CharField(max_length=50, help_text="Comma-separated types: M,E,P,EM,FP,TI,VI")
    
    # Status Information
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    current_sub_status = models.CharField(max_length=200, blank=True, null=True)
    current_open_items = models.TextField(blank=True, null=True)
    current_action_items = models.TextField(blank=True, null=True)
    
    # Relationships
    client = models.ForeignKey('clients.Client', on_delete=models.PROTECT)
    architect_designer = models.ForeignKey('architects.Architect', on_delete=models.SET_NULL, null=True, blank=True)
    mechanical_manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                          limit_choices_to={'role': 'manager'},
                                          related_name='managed_projects')
    
    # uncomment when all clients and architects supposed to be users
    # client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, 
    #                           limit_choices_to={'role': 'client'},
    #                           related_name='client_projects')
    # architect_designer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
    #                                       null=True, blank=True,
    #                                       limit_choices_to={'role': 'architect'},
    #                                       related_name='architect_projects')
    
    # Dates
    due_date = models.DateField(default=default_due_date)
    due_date_note = models.TextField(blank=True, null=True)
    
    # Inspections
    rough_in_date = models.DateField(blank=True, null=True)
    rough_in_note = models.TextField(blank=True, null=True)
    final_inspection_date = models.DateField(blank=True, null=True)
    final_inspection_note = models.TextField(blank=True, null=True)
    
    # Address Information
    address = models.TextField()
    legal_address = models.TextField(blank=True, null=True, help_text="Parcel no, block no, lot no")
    billing_info = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_status_change = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.job_number} - {self.project_name}"
    
    def get_project_types_list(self):
        """Return project types as a list"""
        return [pt.strip() for pt in self.project_type.split(',')] if self.project_type else []
    
    def set_project_types(self, types_list):
        """Set project types from a list"""
        self.project_type = ','.join(types_list)
    
    def has_project_type(self, project_type):
        """Check if project has specific type"""
        return project_type in self.get_project_types_list()
    
    class Meta:
        ordering = ['-year', 'job_number']