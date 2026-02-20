from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.clients.models import Client
from apps.architects.models import Architect
from apps.projects.models import Project
from .models import (
    EmailAccount, EmailThread, SyncedEmail,
    SyncedEmailAttachment, SyncCursor,
)
from .linking_service import EmailLinkingService
from .sync_service import IMAPSyncService

User = get_user_model()


# =============================================================================
# Model Tests
# =============================================================================


class EmailAccountModelTests(TestCase):
    """Test EmailAccount model functionality"""

    def setUp(self):
        EmailAccount.objects.all().delete()
        User.objects.all().delete()

        self.user = User.objects.create_user(
            username="syncuser@test.com",
            email="syncuser@test.com",
            password="testpass123",
            first_name="Sync",
            last_name="User",
            role="manager",
        )

    def test_create_gmail_account(self):
        """Test creating a Gmail email account"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="syncuser@gmail.com",
            provider="gmail",
            password="app-password-123",
        )
        self.assertEqual(account.email_address, "syncuser@gmail.com")
        self.assertEqual(account.provider, "gmail")
        self.assertTrue(account.is_active)
        self.assertTrue(account.sync_enabled)
        self.assertIsNotNone(account.id)

    def test_create_outlook_account(self):
        """Test creating an Outlook email account"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="syncuser@outlook.com",
            provider="outlook",
            password="app-password-456",
        )
        self.assertEqual(account.provider, "outlook")

    def test_create_custom_imap_account(self):
        """Test creating a custom IMAP account"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="syncuser@custom.com",
            provider="imap",
            imap_host="imap.custom.com",
            imap_port=993,
            smtp_host="smtp.custom.com",
            smtp_port=587,
            password="custom-pass",
        )
        self.assertEqual(account.imap_host, "imap.custom.com")
        self.assertEqual(account.smtp_host, "smtp.custom.com")

    def test_get_imap_config_gmail_preset(self):
        """Test Gmail IMAP config uses preset values"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="test@gmail.com",
            provider="gmail",
        )
        config = account.get_imap_config()
        self.assertEqual(config['host'], 'imap.gmail.com')
        self.assertEqual(config['port'], 993)
        self.assertTrue(config['ssl'])

    def test_get_imap_config_outlook_preset(self):
        """Test Outlook IMAP config uses preset values"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="test@outlook.com",
            provider="outlook",
        )
        config = account.get_imap_config()
        self.assertEqual(config['host'], 'outlook.office365.com')

    def test_get_imap_config_custom_overrides(self):
        """Test custom IMAP host overrides presets"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="test@custom.com",
            provider="imap",
            imap_host="mail.custom.com",
            imap_port=143,
            imap_use_ssl=False,
        )
        config = account.get_imap_config()
        self.assertEqual(config['host'], 'mail.custom.com')
        self.assertEqual(config['port'], 143)
        self.assertFalse(config['ssl'])

    def test_get_smtp_config_gmail_preset(self):
        """Test Gmail SMTP config uses preset values"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="test@gmail.com",
            provider="gmail",
        )
        config = account.get_smtp_config()
        self.assertEqual(config['host'], 'smtp.gmail.com')
        self.assertEqual(config['port'], 587)
        self.assertTrue(config['tls'])

    def test_unique_together_constraint(self):
        """Test that same user cannot have duplicate email addresses"""
        EmailAccount.objects.create(
            user=self.user,
            email_address="duplicate@test.com",
            provider="gmail",
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            EmailAccount.objects.create(
                user=self.user,
                email_address="duplicate@test.com",
                provider="outlook",
            )

    def test_default_sync_settings(self):
        """Test default sync configuration values"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="defaults@test.com",
            provider="gmail",
        )
        self.assertEqual(account.sync_interval_minutes, 5)
        self.assertEqual(account.max_sync_age_days, 30)
        self.assertEqual(account.total_synced, 0)
        self.assertIsNone(account.last_sync_at)

    def test_str_representation(self):
        """Test string representation of account"""
        account = EmailAccount.objects.create(
            user=self.user,
            email_address="str@gmail.com",
            provider="gmail",
        )
        self.assertIn("str@gmail.com", str(account))
        self.assertIn("Gmail", str(account))


class EmailThreadModelTests(TestCase):
    """Test EmailThread model functionality"""

    def setUp(self):
        User.objects.all().delete()
        Client.objects.all().delete()

        self.user = User.objects.create_user(
            username="threaduser@test.com",
            email="threaduser@test.com",
            password="testpass123",
            role="manager",
        )
        self.client_obj = Client.objects.create(
            name="Thread Client",
            contact_email="threadclient@test.com",
        )
        self.account = EmailAccount.objects.create(
            user=self.user,
            email_address="threaduser@gmail.com",
            provider="gmail",
        )

    def test_create_thread(self):
        """Test creating an email thread"""
        thread = EmailThread.objects.create(
            account=self.account,
            subject="Test Thread Subject",
            participants=["a@test.com", "b@test.com"],
        )
        self.assertEqual(thread.subject, "Test Thread Subject")
        self.assertEqual(len(thread.participants), 2)
        self.assertEqual(thread.message_count, 0)
        self.assertEqual(thread.unread_count, 0)

    def test_thread_update_counts(self):
        """Test thread count updates when messages are added"""
        thread = EmailThread.objects.create(
            account=self.account,
            subject="Count Test",
            participants=["a@test.com"],
        )

        # Add some messages
        SyncedEmail.objects.create(
            account=self.account,
            thread=thread,
            message_id="<msg1@test.com>",
            from_address="a@test.com",
            to_addresses=[{"name": "B", "address": "b@test.com"}],
            subject="Count Test",
            date=timezone.now(),
            is_read=False,
        )
        SyncedEmail.objects.create(
            account=self.account,
            thread=thread,
            message_id="<msg2@test.com>",
            from_address="b@test.com",
            to_addresses=[{"name": "A", "address": "a@test.com"}],
            subject="Re: Count Test",
            date=timezone.now(),
            is_read=True,
        )

        thread.update_counts()
        self.assertEqual(thread.message_count, 2)
        self.assertEqual(thread.unread_count, 1)
        self.assertIsNotNone(thread.last_message_at)

    def test_thread_link_to_project(self):
        """Test linking thread to a project"""
        manager = User.objects.create_user(
            username="projmanager@test.com",
            email="projmanager@test.com",
            password="testpass123",
            role="manager",
        )
        project = Project.objects.create(
            year=2026,
            project_name="Thread Link Project",
            project_type="M",
            status="in_progress",
            client=self.client_obj,
            mechanical_manager=manager,
            due_date=timezone.now().date() + timedelta(days=30),
        )
        thread = EmailThread.objects.create(
            account=self.account,
            subject="Project Related Thread",
            participants=["a@test.com"],
            project=project,
            client=self.client_obj,
        )
        self.assertEqual(thread.project.id, project.id)
        self.assertEqual(thread.client.id, self.client_obj.id)


class SyncedEmailModelTests(TestCase):
    """Test SyncedEmail model functionality"""

    def setUp(self):
        User.objects.all().delete()

        self.user = User.objects.create_user(
            username="emailuser@test.com",
            email="emailuser@test.com",
            password="testpass123",
            role="manager",
        )
        self.account = EmailAccount.objects.create(
            user=self.user,
            email_address="emailuser@gmail.com",
            provider="gmail",
        )

    def test_create_inbound_email(self):
        """Test creating an inbound synced email"""
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<inbound-123@example.com>",
            from_address="sender@example.com",
            from_name="Sender Name",
            to_addresses=[{"name": "User", "address": "emailuser@gmail.com"}],
            subject="Test Inbound Email",
            date=timezone.now(),
            direction="inbound",
            body_text="Hello, this is a test email.",
        )
        self.assertEqual(email.direction, "inbound")
        self.assertEqual(email.from_address, "sender@example.com")
        self.assertFalse(email.is_read)
        self.assertFalse(email.is_starred)

    def test_create_outbound_email(self):
        """Test creating an outbound synced email"""
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<outbound-456@gmail.com>",
            from_address="emailuser@gmail.com",
            to_addresses=[{"name": "Client", "address": "client@example.com"}],
            subject="Test Outbound Email",
            date=timezone.now(),
            direction="outbound",
            body_text="Hello client, here's an update.",
        )
        self.assertEqual(email.direction, "outbound")

    def test_snippet_auto_generation(self):
        """Test that snippet is auto-generated from body_text"""
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<snippet-test@example.com>",
            from_address="sender@example.com",
            to_addresses=[],
            subject="Snippet Test",
            date=timezone.now(),
            body_text="This is a long email body that should be truncated into a snippet for preview purposes.",
        )
        self.assertTrue(len(email.snippet) > 0)
        self.assertTrue(email.snippet.startswith("This is a long"))

    def test_unique_together_message_id(self):
        """Test deduplication by account + message_id"""
        SyncedEmail.objects.create(
            account=self.account,
            message_id="<duplicate@example.com>",
            from_address="sender@example.com",
            to_addresses=[],
            subject="Original",
            date=timezone.now(),
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            SyncedEmail.objects.create(
                account=self.account,
                message_id="<duplicate@example.com>",
                from_address="sender@example.com",
                to_addresses=[],
                subject="Duplicate",
                date=timezone.now(),
            )

    def test_email_ordering(self):
        """Test emails are ordered by date descending"""
        now = timezone.now()
        SyncedEmail.objects.create(
            account=self.account,
            message_id="<older@test.com>",
            from_address="a@test.com",
            to_addresses=[],
            subject="Older",
            date=now - timedelta(hours=2),
        )
        SyncedEmail.objects.create(
            account=self.account,
            message_id="<newer@test.com>",
            from_address="a@test.com",
            to_addresses=[],
            subject="Newer",
            date=now,
        )
        emails = list(SyncedEmail.objects.filter(account=self.account))
        self.assertEqual(emails[0].subject, "Newer")
        self.assertEqual(emails[1].subject, "Older")


class SyncCursorModelTests(TestCase):
    """Test SyncCursor model functionality"""

    def setUp(self):
        User.objects.all().delete()

        self.user = User.objects.create_user(
            username="cursoruser@test.com",
            email="cursoruser@test.com",
            password="testpass123",
            role="manager",
        )
        self.account = EmailAccount.objects.create(
            user=self.user,
            email_address="cursoruser@gmail.com",
            provider="gmail",
        )

    def test_create_sync_cursor(self):
        """Test creating a sync cursor"""
        cursor = SyncCursor.objects.create(
            account=self.account,
            folder="INBOX",
            uidvalidity=12345,
            last_uid=100,
        )
        self.assertEqual(cursor.folder, "INBOX")
        self.assertEqual(cursor.uidvalidity, 12345)
        self.assertEqual(cursor.last_uid, 100)

    def test_unique_together_account_folder(self):
        """Test uniqueness constraint on account + folder"""
        SyncCursor.objects.create(
            account=self.account,
            folder="INBOX",
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            SyncCursor.objects.create(
                account=self.account,
                folder="INBOX",
            )


# =============================================================================
# Linking Service Tests
# =============================================================================


class EmailLinkingServiceTests(TestCase):
    """Test the EmailLinkingService for auto-associating emails to CRM entities"""

    def setUp(self):
        User.objects.all().delete()
        Client.objects.all().delete()
        Project.objects.all().delete()

        self.user = User.objects.create_user(
            username="linktest@test.com",
            email="linktest@test.com",
            password="testpass123",
            role="manager",
        )
        self.client_obj = Client.objects.create(
            name="Link Test Client",
            contact_email="linkclient@example.com",
            phone="+1234567890",
        )
        self.project = Project.objects.create(
            year=2026,
            project_name="Link Test Project",
            project_type="M,E",
            status="in_progress",
            client=self.client_obj,
            mechanical_manager=self.user,
            due_date=timezone.now().date() + timedelta(days=30),
        )
        self.account = EmailAccount.objects.create(
            user=self.user,
            email_address="linktest@gmail.com",
            provider="gmail",
        )

    def test_link_by_job_number_in_subject(self):
        """Test matching project by job number in email subject"""
        job_number = self.project.job_number  # e.g., "2026-0001"
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<jobnumber@test.com>",
            from_address="external@example.com",
            to_addresses=[{"address": "linktest@gmail.com"}],
            subject=f"Update on project {job_number} - electrical work",
            date=timezone.now(),
        )
        result = EmailLinkingService.link_email(email)
        self.assertTrue(result['linked'])
        self.assertEqual(result['project'].id, self.project.id)
        self.assertEqual(result['client'].id, self.client_obj.id)

    def test_link_by_client_email(self):
        """Test matching client by sender email address"""
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<clientemail@test.com>",
            from_address="linkclient@example.com",  # matches client contact_email
            to_addresses=[{"address": "linktest@gmail.com"}],
            subject="General inquiry about our project",
            date=timezone.now(),
        )
        result = EmailLinkingService.link_email(email)
        self.assertTrue(result['linked'])
        self.assertEqual(result['client'].id, self.client_obj.id)

    def test_link_by_recipient_client_email(self):
        """Test matching client when client email is in recipients"""
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<recipientclient@test.com>",
            from_address="linktest@gmail.com",
            to_addresses=[{"address": "linkclient@example.com"}],
            subject="Sending you an update",
            date=timezone.now(),
            direction="outbound",
        )
        result = EmailLinkingService.link_email(email)
        self.assertTrue(result['linked'])
        self.assertEqual(result['client'].id, self.client_obj.id)

    def test_no_link_for_unknown_email(self):
        """Test no links created for completely unknown email"""
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<unknown@test.com>",
            from_address="nobody@unknown.com",
            to_addresses=[{"address": "linktest@gmail.com"}],
            subject="Random marketing email",
            date=timezone.now(),
        )
        result = EmailLinkingService.link_email(email)
        self.assertFalse(result['linked'])
        self.assertIsNone(result['project'])
        self.assertIsNone(result['client'])

    def test_manual_link_email(self):
        """Test manually linking an email to a project"""
        email = SyncedEmail.objects.create(
            account=self.account,
            message_id="<manual@test.com>",
            from_address="someone@example.com",
            to_addresses=[],
            subject="Manual link test",
            date=timezone.now(),
        )
        result = EmailLinkingService.manually_link_email(
            synced_email_id=email.id,
            project_id=self.project.id,
            client_id=self.client_obj.id,
        )
        self.assertTrue(result['success'])
        email.refresh_from_db()
        self.assertEqual(email.project_id, self.project.id)
        self.assertEqual(email.client_id, self.client_obj.id)

    def test_manual_link_nonexistent_email(self):
        """Test manually linking a nonexistent email fails gracefully"""
        import uuid
        result = EmailLinkingService.manually_link_email(
            synced_email_id=uuid.uuid4(),
            project_id=self.project.id,
        )
        self.assertFalse(result['success'])
        self.assertIn('not found', result['error'])

    def test_bulk_link_unlinked(self):
        """Test bulk linking of unlinked emails"""
        job_number = self.project.job_number
        # Create some unlinked emails
        for i in range(3):
            SyncedEmail.objects.create(
                account=self.account,
                message_id=f"<bulk{i}@test.com>",
                from_address="linkclient@example.com",
                to_addresses=[{"address": "linktest@gmail.com"}],
                subject=f"Update {i} for {job_number}",
                date=timezone.now() - timedelta(hours=i),
            )
        linked = EmailLinkingService.bulk_link_unlinked(
            account_id=self.account.id
        )
        self.assertEqual(linked, 3)

    def test_thread_propagation(self):
        """Test that linking an email propagates to its thread"""
        thread = EmailThread.objects.create(
            account=self.account,
            subject="Propagation Test",
            participants=["a@test.com"],
        )
        job_number = self.project.job_number
        email = SyncedEmail.objects.create(
            account=self.account,
            thread=thread,
            message_id="<propagation@test.com>",
            from_address="linkclient@example.com",
            to_addresses=[{"address": "linktest@gmail.com"}],
            subject=f"Thread propagation {job_number}",
            date=timezone.now(),
        )
        EmailLinkingService.link_email(email)
        thread.refresh_from_db()
        self.assertEqual(thread.project_id, self.project.id)
        self.assertEqual(thread.client_id, self.client_obj.id)


# =============================================================================
# Sync Service Unit Tests
# =============================================================================


class IMAPSyncServiceUnitTests(TestCase):
    """Test IMAPSyncService helper methods (no actual IMAP connection)"""

    def setUp(self):
        User.objects.all().delete()
        self.user = User.objects.create_user(
            username="imaptest@test.com",
            email="imaptest@test.com",
            password="testpass123",
            role="manager",
        )
        self.account = EmailAccount.objects.create(
            user=self.user,
            email_address="imaptest@gmail.com",
            provider="gmail",
            password="test-app-password",
        )
        self.service = IMAPSyncService(self.account)

    def test_normalize_subject_removes_re(self):
        """Test Re: prefix is stripped for threading"""
        self.assertEqual(
            IMAPSyncService._normalize_subject("Re: Project Update"),
            "Project Update",
        )

    def test_normalize_subject_removes_fwd(self):
        """Test Fwd: prefix is stripped for threading"""
        self.assertEqual(
            IMAPSyncService._normalize_subject("Fwd: Important Document"),
            "Important Document",
        )

    def test_normalize_subject_removes_fw(self):
        """Test Fw: prefix is stripped"""
        self.assertEqual(
            IMAPSyncService._normalize_subject("Fw: Meeting Notes"),
            "Meeting Notes",
        )

    def test_normalize_subject_case_insensitive(self):
        """Test subject normalization is case insensitive"""
        self.assertEqual(
            IMAPSyncService._normalize_subject("RE: Urgent Matter"),
            "Urgent Matter",
        )
        self.assertEqual(
            IMAPSyncService._normalize_subject("FWD: Document"),
            "Document",
        )

    def test_normalize_subject_preserves_normal_subjects(self):
        """Test that normal subjects are not modified"""
        self.assertEqual(
            IMAPSyncService._normalize_subject("Project 2026-0001 Update"),
            "Project 2026-0001 Update",
        )

    def test_decode_header_plain_text(self):
        """Test decoding plain text header"""
        self.assertEqual(
            IMAPSyncService._decode_header("Simple Subject"),
            "Simple Subject",
        )

    def test_decode_header_empty(self):
        """Test decoding empty header"""
        self.assertEqual(IMAPSyncService._decode_header(""), "")
        self.assertEqual(IMAPSyncService._decode_header(None), "")

    def test_parse_address_list(self):
        """Test parsing email address header"""
        result = IMAPSyncService._parse_address_list(
            "John Doe <john@example.com>, jane@example.com"
        )
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['name'], 'John Doe')
        self.assertEqual(result[0]['address'], 'john@example.com')
        self.assertEqual(result[1]['address'], 'jane@example.com')

    def test_parse_address_list_empty(self):
        """Test parsing empty address header"""
        self.assertEqual(IMAPSyncService._parse_address_list(""), [])
        self.assertEqual(IMAPSyncService._parse_address_list(None), [])

    def test_parse_date_valid(self):
        """Test parsing a valid RFC 2822 date"""
        result = IMAPSyncService._parse_date("Mon, 17 Feb 2026 10:30:00 +0000")
        self.assertEqual(result.year, 2026)
        self.assertEqual(result.month, 2)
        self.assertEqual(result.day, 17)

    def test_parse_date_invalid_returns_now(self):
        """Test parsing invalid date returns current time"""
        result = IMAPSyncService._parse_date("not a date")
        # Should be close to now (within a few seconds)
        diff = abs((timezone.now() - result).total_seconds())
        self.assertLess(diff, 5)

    def test_parse_date_empty_returns_now(self):
        """Test parsing empty date returns current time"""
        result = IMAPSyncService._parse_date("")
        diff = abs((timezone.now() - result).total_seconds())
        self.assertLess(diff, 5)

    def test_parse_email_basic(self):
        """Test parsing a basic email message"""
        import email
        from email.mime.text import MIMEText

        msg = MIMEText("Hello, this is a test email body.")
        msg['Subject'] = 'Test Email'
        msg['From'] = 'Sender Name <sender@example.com>'
        msg['To'] = 'recipient@example.com'
        msg['Date'] = 'Mon, 17 Feb 2026 10:30:00 +0000'
        msg['Message-ID'] = '<test-parse@example.com>'

        result = self.service._parse_email(msg)

        self.assertEqual(result['subject'], 'Test Email')
        self.assertEqual(result['from_address'], 'sender@example.com')
        self.assertEqual(result['from_name'], 'Sender Name')
        self.assertEqual(len(result['to_addresses']), 1)
        self.assertIn('Hello, this is a test', result['body_text'])

    def test_parse_email_multipart(self):
        """Test parsing a multipart email with text and HTML"""
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Multipart Test'
        msg['From'] = 'sender@example.com'
        msg['To'] = 'recipient@example.com'
        msg['Date'] = 'Mon, 17 Feb 2026 10:30:00 +0000'

        text_part = MIMEText("Plain text body", 'plain')
        html_part = MIMEText("<p>HTML body</p>", 'html')
        msg.attach(text_part)
        msg.attach(html_part)

        result = self.service._parse_email(msg)

        self.assertEqual(result['subject'], 'Multipart Test')
        self.assertIn('Plain text body', result['body_text'])
        self.assertIn('<p>HTML body</p>', result['body_html'])

    def test_threading_by_references(self):
        """Test that emails with matching References are grouped into threads"""
        # Create first email
        thread = EmailThread.objects.create(
            account=self.account,
            subject="Thread Test",
            participants=["a@test.com"],
        )
        SyncedEmail.objects.create(
            account=self.account,
            thread=thread,
            message_id="<original@test.com>",
            from_address="a@test.com",
            to_addresses=[{"address": "imaptest@gmail.com"}],
            subject="Thread Test",
            date=timezone.now(),
        )

        # Get or create thread for a reply that references the original
        parsed = {
            'subject': 'Re: Thread Test',
            'from_address': 'imaptest@gmail.com',
            'to_addresses': [{'address': 'a@test.com'}],
            'references': ['<original@test.com>'],
            'in_reply_to': '<original@test.com>',
        }
        result_thread = self.service._get_or_create_thread(parsed)

        # Should be the same thread
        self.assertEqual(result_thread.id, thread.id)

    def test_threading_creates_new_thread(self):
        """Test that new subject creates a new thread"""
        parsed = {
            'subject': 'Brand New Conversation',
            'from_address': 'a@test.com',
            'to_addresses': [{'address': 'b@test.com'}],
            'references': [],
            'in_reply_to': '',
        }
        thread = self.service._get_or_create_thread(parsed)
        self.assertIsNotNone(thread)
        self.assertEqual(thread.subject, 'Brand New Conversation')


# =============================================================================
# API Tests
# =============================================================================


class EmailAccountAPITests(APITestCase):
    """Test Email Account API endpoints"""

    def setUp(self):
        User.objects.all().delete()
        EmailAccount.objects.all().delete()

        self.manager_user = User.objects.create_user(
            username="apimanager@test.com",
            email="apimanager@test.com",
            password="testpass123",
            first_name="API",
            last_name="Manager",
            role="manager",
        )
        self.other_user = User.objects.create_user(
            username="otheruser@test.com",
            email="otheruser@test.com",
            password="testpass123",
            first_name="Other",
            last_name="User",
            role="manager",
        )
        self.account = EmailAccount.objects.create(
            user=self.manager_user,
            email_address="apimanager@gmail.com",
            provider="gmail",
            password="test-pass",
        )
        self.other_account = EmailAccount.objects.create(
            user=self.other_user,
            email_address="otheruser@gmail.com",
            provider="gmail",
            password="other-pass",
        )

        self.client = APIClient()

    def test_list_accounts_only_own(self):
        """Test user can only see their own accounts"""
        self.client.force_authenticate(user=self.manager_user)

        url = reverse('email-account-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        accounts = response.data if isinstance(response.data, list) else response.data.get('results', response.data)
        # Should only see own account, not other user's
        emails = [a['email_address'] for a in accounts]
        self.assertIn('apimanager@gmail.com', emails)
        self.assertNotIn('otheruser@gmail.com', emails)

    def test_create_account(self):
        """Test creating a new email account via API"""
        self.client.force_authenticate(user=self.manager_user)

        url = reverse('email-account-list')
        data = {
            'email_address': 'newemail@outlook.com',
            'provider': 'outlook',
            'password': 'new-app-password',
            'sync_enabled': True,
            'sync_folders': ['INBOX', 'Sent'],
        }
        response = self.client.post(url, data, format='json')

        if response.status_code != status.HTTP_201_CREATED:
            print(f"Create account failed: {response.data}")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email_address'], 'newemail@outlook.com')

    def test_update_account(self):
        """Test updating an email account"""
        self.client.force_authenticate(user=self.manager_user)

        url = reverse('email-account-detail', kwargs={'pk': str(self.account.id)})
        data = {
            'display_name': 'My Work Email',
            'sync_interval_minutes': 10,
        }
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_name'], 'My Work Email')
        self.assertEqual(response.data['sync_interval_minutes'], 10)

    def test_delete_account(self):
        """Test deleting an email account"""
        self.client.force_authenticate(user=self.manager_user)

        url = reverse('email-account-detail', kwargs={'pk': str(self.account.id)})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            EmailAccount.objects.filter(id=self.account.id).exists()
        )

    def test_cannot_access_other_users_account(self):
        """Test user cannot access another user's account"""
        self.client.force_authenticate(user=self.manager_user)

        url = reverse('email-account-detail', kwargs={'pk': str(self.other_account.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_access_denied(self):
        """Test unauthenticated requests are rejected"""
        url = reverse('email-account-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_account_statistics(self):
        """Test getting account statistics"""
        self.client.force_authenticate(user=self.manager_user)

        url = reverse('email-account-statistics', kwargs={'pk': str(self.account.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_synced', response.data)
        self.assertIn('unread', response.data)
        self.assertIn('threads', response.data)
        self.assertIn('inbound', response.data)
        self.assertIn('outbound', response.data)


class EmailThreadAPITests(APITestCase):
    """Test Email Thread API endpoints"""

    def setUp(self):
        User.objects.all().delete()
        Client.objects.all().delete()
        Project.objects.all().delete()

        self.user = User.objects.create_user(
            username="threadapi@test.com",
            email="threadapi@test.com",
            password="testpass123",
            first_name="Thread",
            last_name="Tester",
            role="manager",
        )
        self.client_obj = Client.objects.create(
            name="API Thread Client",
            contact_email="apithreadclient@test.com",
        )
        self.project = Project.objects.create(
            year=2026,
            project_name="API Thread Project",
            project_type="M",
            status="in_progress",
            client=self.client_obj,
            mechanical_manager=self.user,
            due_date=timezone.now().date() + timedelta(days=30),
        )
        self.account = EmailAccount.objects.create(
            user=self.user,
            email_address="threadapi@gmail.com",
            provider="gmail",
        )
        self.thread = EmailThread.objects.create(
            account=self.account,
            subject="API Test Thread",
            participants=["a@test.com", "threadapi@gmail.com"],
            message_count=2,
            unread_count=1,
            last_message_at=timezone.now(),
        )
        # Add a message to the thread
        self.synced_email = SyncedEmail.objects.create(
            account=self.account,
            thread=self.thread,
            message_id="<threadapi-msg1@test.com>",
            from_address="a@test.com",
            to_addresses=[{"address": "threadapi@gmail.com"}],
            subject="API Test Thread",
            date=timezone.now(),
            body_text="Test message body",
            is_read=False,
        )

        self.client = APIClient()

    def test_list_threads(self):
        """Test listing email threads"""
        self.client.force_authenticate(user=self.user)

        url = reverse('email-thread-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        threads = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertTrue(len(threads) >= 1)

    def test_retrieve_thread_detail(self):
        """Test retrieving thread detail with messages"""
        self.client.force_authenticate(user=self.user)

        url = reverse('email-thread-detail', kwargs={'pk': str(self.thread.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], 'API Test Thread')
        self.assertIn('messages', response.data)

    def test_star_thread(self):
        """Test toggling thread star"""
        self.client.force_authenticate(user=self.user)

        url = reverse('email-thread-star', kwargs={'pk': str(self.thread.id)})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_starred'])

        # Toggle again
        response = self.client.post(url)
        self.assertFalse(response.data['is_starred'])

    def test_archive_thread(self):
        """Test toggling thread archive"""
        self.client.force_authenticate(user=self.user)

        url = reverse('email-thread-archive', kwargs={'pk': str(self.thread.id)})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_archived'])

    def test_mark_thread_read(self):
        """Test marking all messages in thread as read"""
        self.client.force_authenticate(user=self.user)

        url = reverse('email-thread-mark-read', kwargs={'pk': str(self.thread.id)})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 0)

        # Verify email is now read
        self.synced_email.refresh_from_db()
        self.assertTrue(self.synced_email.is_read)

    def test_link_thread_to_project(self):
        """Test manually linking a thread to a project"""
        self.client.force_authenticate(user=self.user)

        url = reverse('email-thread-link', kwargs={'pk': str(self.thread.id)})
        data = {
            'project_id': self.project.id,
            'client_id': self.client_obj.id,
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project'], self.project.id)
        self.assertEqual(response.data['client'], self.client_obj.id)

        # Verify message also got linked
        self.synced_email.refresh_from_db()
        self.assertEqual(self.synced_email.project_id, self.project.id)


class SyncedEmailAPITests(APITestCase):
    """Test Synced Email API endpoints"""

    def setUp(self):
        User.objects.all().delete()

        self.user = User.objects.create_user(
            username="emailapi@test.com",
            email="emailapi@test.com",
            password="testpass123",
            first_name="Email",
            last_name="Tester",
            role="manager",
        )
        self.account = EmailAccount.objects.create(
            user=self.user,
            email_address="emailapi@gmail.com",
            provider="gmail",
        )
        self.email1 = SyncedEmail.objects.create(
            account=self.account,
            message_id="<api-email1@test.com>",
            from_address="sender@example.com",
            from_name="Test Sender",
            to_addresses=[{"address": "emailapi@gmail.com"}],
            subject="API Email Test 1",
            date=timezone.now(),
            direction="inbound",
            body_text="First email body",
            is_read=False,
            is_starred=False,
        )
        self.email2 = SyncedEmail.objects.create(
            account=self.account,
            message_id="<api-email2@test.com>",
            from_address="emailapi@gmail.com",
            to_addresses=[{"address": "recipient@example.com"}],
            subject="API Email Test 2",
            date=timezone.now() - timedelta(hours=1),
            direction="outbound",
            body_text="Second email body",
            is_read=True,
        )

        self.client = APIClient()

    def test_list_emails(self):
        """Test listing synced emails"""
        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(emails), 2)

    def test_retrieve_email_detail(self):
        """Test retrieving full email detail"""
        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-detail', kwargs={'pk': str(self.email1.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], 'API Email Test 1')
        self.assertEqual(response.data['from_address'], 'sender@example.com')
        self.assertIn('body_text', response.data)
        self.assertIn('body_html', response.data)

    def test_filter_by_direction(self):
        """Test filtering emails by direction"""
        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-list') + '?direction=inbound'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(emails), 1)
        self.assertEqual(emails[0]['direction'], 'inbound')

    def test_filter_by_read_status(self):
        """Test filtering emails by read status"""
        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-list') + '?is_read=false'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(emails), 1)

    def test_search_emails(self):
        """Test searching emails by subject"""
        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-list') + '?search=Test%201'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(emails), 1)

    def test_mark_email_read(self):
        """Test marking an email as read"""
        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-mark-read', kwargs={'pk': str(self.email1.id)})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])

        self.email1.refresh_from_db()
        self.assertTrue(self.email1.is_read)

    def test_toggle_email_star(self):
        """Test toggling email starred status"""
        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-toggle-star', kwargs={'pk': str(self.email1.id)})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_starred'])

        # Toggle again
        response = self.client.post(url)
        self.assertFalse(response.data['is_starred'])

    def test_link_email_to_project(self):
        """Test manually linking an email to a project and client"""
        client_obj = Client.objects.create(
            name="Email Link Client",
            contact_email="elc@test.com",
        )
        project = Project.objects.create(
            year=2026,
            project_name="Email Link Project",
            project_type="E",
            status="in_progress",
            client=client_obj,
            mechanical_manager=self.user,
            due_date=timezone.now().date() + timedelta(days=30),
        )

        self.client.force_authenticate(user=self.user)

        url = reverse('synced-email-link', kwargs={'pk': str(self.email1.id)})
        data = {
            'project_id': project.id,
            'client_id': client_obj.id,
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project'], project.id)
        self.assertEqual(response.data['client'], client_obj.id)
