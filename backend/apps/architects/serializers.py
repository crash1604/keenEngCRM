from rest_framework import serializers
from .models import Architect


class ArchitectSerializer(serializers.ModelSerializer):
    is_user = serializers.SerializerMethodField()

    class Meta:
        model = Architect
        fields = [
            'id',
            'name',
            'contact_email',
            'phone',
            'address',
            'company_name',
            'license_number',
            'professional_affiliations',
            'website',
            'notes',
            'is_active',
            'is_user',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_user']

    def get_is_user(self, obj):
        return obj.user_account is not None


class ArchitectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    is_user = serializers.SerializerMethodField()

    class Meta:
        model = Architect
        fields = [
            'id',
            'name',
            'company_name',
            'contact_email',
            'phone',
            'license_number',
            'is_active',
            'is_user',
            'created_at',
            'updated_at',
        ]

    def get_is_user(self, obj):
        return obj.user_account is not None
