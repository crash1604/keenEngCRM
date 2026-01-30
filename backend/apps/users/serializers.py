from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, EmailSettings

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'phone', 'role')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # Check if email already exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['email'],  # Using email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', 'employee')
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                if not user.check_password(password):
                    raise serializers.ValidationError("Invalid credentials.")
                if not user.is_active:
                    raise serializers.ValidationError("User account is disabled.")
                
                attrs['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")
        else:
            raise serializers.ValidationError("Both email and password are required.")

        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'created_at', 'updated_at')
        read_only_fields = ('id', 'email', 'created_at', 'updated_at')


class EmailSettingsSerializer(serializers.ModelSerializer):
    """Serializer for user email settings."""
    email_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="App password for email authentication"
    )
    has_password = serializers.SerializerMethodField()
    provider_display = serializers.SerializerMethodField()

    class Meta:
        model = EmailSettings
        fields = (
            'id',
            'provider',
            'provider_display',
            'smtp_host',
            'smtp_port',
            'use_tls',
            'email_address',
            'email_password',
            'has_password',
            'display_name',
            'is_verified',
            'last_verified_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'is_verified', 'last_verified_at', 'created_at', 'updated_at')

    def get_has_password(self, obj):
        """Check if password is set without exposing it."""
        return obj._email_password is not None

    def get_provider_display(self, obj):
        """Return human-readable provider name."""
        return obj.get_provider_display()

    def create(self, validated_data):
        password = validated_data.pop('email_password', None)
        instance = EmailSettings.objects.create(**validated_data)
        if password:
            instance.email_password = password
            instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('email_password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Only update password if provided
        if password:
            instance.email_password = password
            # Reset verification status when credentials change
            instance.is_verified = False

        instance.save()
        return instance