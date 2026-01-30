from django.contrib.auth.models import AbstractUser
from django.db import models
from cryptography.fernet import Fernet
from django.conf import settings


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
        ('client', 'Client'),
        ('architect', 'Architect'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email} ({self.role})"


class EmailSettings(models.Model):
    """
    User-specific email/SMTP settings for sending emails.
    Supports Outlook, Gmail, and custom SMTP servers.
    """
    PROVIDER_CHOICES = (
        ('outlook', 'Microsoft Outlook / Office 365'),
        ('gmail', 'Gmail'),
        ('custom', 'Custom SMTP Server'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='email_settings'
    )

    # Provider selection
    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default='outlook'
    )

    # SMTP Configuration
    smtp_host = models.CharField(
        max_length=255,
        blank=True,
        help_text="SMTP server hostname (auto-filled for known providers)"
    )
    smtp_port = models.IntegerField(
        default=587,
        help_text="SMTP port (usually 587 for TLS)"
    )
    use_tls = models.BooleanField(
        default=True,
        help_text="Use TLS encryption"
    )

    # Authentication
    email_address = models.EmailField(
        help_text="Your email address for sending"
    )
    _email_password = models.BinaryField(
        blank=True,
        null=True,
        help_text="Encrypted app password"
    )

    # Display settings
    display_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Name to display as sender (e.g., 'John Smith')"
    )

    # Status
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether the email settings have been verified"
    )
    last_verified_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Email Settings"
        verbose_name_plural = "Email Settings"

    def __str__(self):
        return f"Email settings for {self.user.email}"

    def _get_encryption_key(self):
        """Get or generate encryption key from settings."""
        key = getattr(settings, 'EMAIL_ENCRYPTION_KEY', None)
        if not key:
            # Use SECRET_KEY as fallback (not ideal but works)
            import hashlib
            import base64
            key = base64.urlsafe_b64encode(
                hashlib.sha256(settings.SECRET_KEY.encode()).digest()
            )
        return key

    @property
    def email_password(self):
        """Decrypt and return the email password."""
        if not self._email_password:
            print("DEBUG: No encrypted password stored")
            return None
        try:
            f = Fernet(self._get_encryption_key())
            decrypted = f.decrypt(bytes(self._email_password)).decode()
            print(f"DEBUG: Password decrypted successfully (length: {len(decrypted)})")
            return decrypted
        except Exception as e:
            print(f"DEBUG: Password decryption failed: {e}")
            return None

    @email_password.setter
    def email_password(self, value):
        """Encrypt and store the email password."""
        if value:
            try:
                f = Fernet(self._get_encryption_key())
                encrypted = f.encrypt(value.encode())
                self._email_password = encrypted
                print(f"DEBUG: Password encrypted successfully (encrypted length: {len(encrypted)})")
            except Exception as e:
                print(f"DEBUG: Password encryption failed: {e}")
                self._email_password = None
        else:
            self._email_password = None

    def get_smtp_config(self):
        """Return SMTP configuration based on provider."""
        # Default configs for known providers
        provider_configs = {
            'outlook': {
                'host': 'smtp.office365.com',
                'port': 587,
                'use_tls': True,
            },
            'gmail': {
                'host': 'smtp.gmail.com',
                'port': 587,
                'use_tls': True,
            },
        }

        if self.provider in provider_configs:
            config = provider_configs[self.provider].copy()
        else:
            config = {
                'host': self.smtp_host,
                'port': self.smtp_port,
                'use_tls': self.use_tls,
            }

        config['email'] = self.email_address
        config['password'] = self.email_password
        config['display_name'] = self.display_name or self.user.get_full_name()

        return config

    def save(self, *args, **kwargs):
        """Auto-fill SMTP settings for known providers."""
        if self.provider == 'outlook':
            self.smtp_host = 'smtp.office365.com'
            self.smtp_port = 587
            self.use_tls = True
        elif self.provider == 'gmail':
            self.smtp_host = 'smtp.gmail.com'
            self.smtp_port = 587
            self.use_tls = True
        super().save(*args, **kwargs)