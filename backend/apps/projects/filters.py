import django_filters
from django.db.models import Q
from .models import Project

class ProjectFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    status = django_filters.MultipleChoiceFilter(choices=Project.STATUS_CHOICES)
    project_type = django_filters.CharFilter(method='filter_project_type')
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    due_date_range = django_filters.DateFromToRangeFilter(field_name='due_date')
    created_date_range = django_filters.DateFromToRangeFilter(field_name='created_at')
    
    class Meta:
        model = Project
        fields = {
            'year': ['exact'],
            'client': ['exact'],
            'architect_designer': ['exact'],
            'mechanical_manager': ['exact'],
        }
    
    def filter_search(self, queryset, name, value):
        """Search across multiple fields"""
        return queryset.filter(
            Q(job_number__icontains=value) |
            Q(project_name__icontains=value) |
            Q(client__name__icontains=value) |
            Q(architect_designer__name__icontains=value)
        )
    
    def filter_project_type(self, queryset, name, value):
        """Filter by project type (supports multiple types)"""
        if value:
            types = [pt.strip() for pt in value.split(',')]
            query = Q()
            for project_type in types:
                query |= Q(project_type__icontains=project_type)
            return queryset.filter(query)
        return queryset
    
    def filter_overdue(self, queryset, name, value):
        """Filter overdue projects"""
        from django.utils import timezone
        if value:
            return queryset.filter(
                due_date__lt=timezone.now().date(),
                status__in=['not_started', 'in_progress', 'submitted']
            )
        return queryset