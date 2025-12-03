# apps/clients/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Client

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user serializer for client details."""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_active']
        read_only_fields = fields

class ClientSerializer(serializers.ModelSerializer):
    """Default client serializer for list views."""
    is_user = serializers.BooleanField(read_only=True)
    user_account_email = serializers.EmailField(source='user_account.email', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_email', 'phone', 'company_name',
            'contact_person', 'is_user', 'user_account_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_user']

class ClientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new clients."""
    email = serializers.EmailField(write_only=True, required=False)
    create_user_account = serializers.BooleanField(write_only=True, default=False)
    
    class Meta:
        model = Client
        fields = [
            'name', 'contact_email', 'phone', 'address', 'company_name',
            'contact_person', 'billing_address', 'notes', 'email',
            'create_user_account'
        ]
    
    def validate(self, data):
        """Validate client data."""
        email = data.get('email')
        create_user_account = data.get('create_user_account', False)
        
        if create_user_account and not email:
            raise serializers.ValidationError({
                'email': 'Email is required when creating a user account.'
            })
        
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
        
        return data
    
    def create(self, validated_data):
        """Create client with optional user account."""
        email = validated_data.pop('email', None)
        create_user_account = validated_data.pop('create_user_account', False)
        
        # Create client
        client = Client.objects.create(**validated_data)
        
        # Create user account if requested
        if create_user_account and email:
            user = User.objects.create_user(
                email=email,
                username=email,
                password=User.objects.make_random_password(),
                is_active=True,
                role='client'
            )
            client.user_account = user
            client.save()
        
        return client

class ClientUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating clients."""
    class Meta:
        model = Client
        fields = [
            'name', 'contact_email', 'phone', 'address',
            'company_name', 'contact_person', 'billing_address', 'notes'
        ]
    
    def validate_contact_email(self, value):
        """Ensure contact email is unique if provided."""
        if value and Client.objects.filter(contact_email=value).exists():
            instance = self.instance
            if instance and instance.contact_email == value:
                return value
            raise serializers.ValidationError("This contact email is already in use.")
        return value

class ClientDetailSerializer(ClientSerializer):
    """Detailed client serializer with all fields."""
    user_account_details = UserMiniSerializer(source='user_account', read_only=True)
    
    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + [
            'address', 'billing_address', 'notes',
            'user_account_details'
        ]

class ClientExportSerializer(serializers.ModelSerializer):
    """Serializer for exporting client data."""
    created_by = serializers.CharField(source='user_account.email', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_email', 'phone', 'address',
            'company_name', 'contact_person', 'billing_address',
            'notes', 'created_at', 'updated_at', 'created_by'
        ]