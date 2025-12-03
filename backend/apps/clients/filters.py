# clients/filters.py
import django_filters
from .models import Client

class ClientFilter(django_filters.FilterSet):
    """Filter for clients with various options."""
    name = django_filters.CharFilter(lookup_expr='icontains')
    company_name = django_filters.CharFilter(lookup_expr='icontains')
    contact_email = django_filters.CharFilter(lookup_expr='icontains')
    phone = django_filters.CharFilter(lookup_expr='icontains')
    
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    has_user_account = django_filters.BooleanFilter(
        field_name='user_account',
        lookup_expr='isnull',
        exclude=True
    )
    
    class Meta:
        model = Client
        fields = [
            'name', 'company_name', 'contact_email', 'phone',
            'created_after', 'created_before', 'has_user_account'
        ]