from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

from apps.communication.models import EmailLog, EmailTemplate
from apps.projects.models import Project

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds sample email logs for the communication module'

    def handle(self, *args, **kwargs):
        # Get users, templates, and projects
        try:
            users = list(User.objects.all())
            if not users:
                self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
                return

            templates = list(EmailTemplate.objects.all())
            if not templates:
                self.stdout.write(self.style.ERROR('No templates found. Please run seed_email_templates first.'))
                return

            projects = list(Project.objects.all())
            if not projects:
                self.stdout.write(self.style.ERROR('No projects found. Please create projects first.'))
                return

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching data: {str(e)}'))
            return

        # Sample email subjects and bodies
        sample_emails = []
        statuses = ['sent', 'delivered', 'failed', 'pending']
        status_weights = [0.3, 0.5, 0.1, 0.1]  # More delivered emails

        # Create 30 sample email logs
        for i in range(30):
            project = random.choice(projects)
            template = random.choice(templates)
            user = random.choice(users)
            status = random.choices(statuses, weights=status_weights)[0]

            # Random date within last 60 days
            days_ago = random.randint(0, 60)
            sent_at = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))

            # Create email log data
            email_data = {
                'project': project,
                'template': template,
                'subject': f"{template.subject.replace('{{ project.project_name }}', project.project_name).replace('{{ project.status }}', project.status)}",
                'recipient_email': project.client.email if project.client else f"client{i}@example.com",
                'recipient_name': project.client.contact_person if project.client else f"Client {i}",
                'body_html': template.body_html,
                'body_text': template.body_text or '',
                'status': status,
                'sent_by': user,
                'sent_at': sent_at,
            }

            # Add CC/BCC for some emails
            if random.random() > 0.7:
                email_data['cc_emails'] = [f'manager{random.randint(1,3)}@company.com']

            if random.random() > 0.9:
                email_data['bcc_emails'] = ['admin@company.com']

            # Add opened/clicked timestamps for delivered emails
            if status == 'delivered':
                if random.random() > 0.3:
                    email_data['opened_at'] = sent_at + timedelta(hours=random.randint(1, 48))
                if random.random() > 0.7:
                    email_data['clicked_at'] = sent_at + timedelta(hours=random.randint(2, 72))

            # Add error message for failed emails
            if status == 'failed':
                error_messages = [
                    'SMTP connection timeout',
                    'Invalid recipient email address',
                    'Message rejected by mail server',
                    'Recipient mailbox full',
                    'Temporary mail server failure',
                ]
                email_data['error_message'] = random.choice(error_messages)

            sample_emails.append(email_data)

        # Create email logs
        created_count = 0
        for email_data in sample_emails:
            try:
                EmailLog.objects.create(**email_data)
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created email log: {email_data["subject"][:50]}...'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Failed to create email log: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'\nSeeding complete! Created {created_count} email logs.'))

        # Print statistics
        total_logs = EmailLog.objects.count()
        sent_count = EmailLog.objects.filter(status='sent').count()
        delivered_count = EmailLog.objects.filter(status='delivered').count()
        failed_count = EmailLog.objects.filter(status='failed').count()
        pending_count = EmailLog.objects.filter(status='pending').count()

        self.stdout.write(self.style.SUCCESS(f'\nEmail Log Statistics:'))
        self.stdout.write(f'  Total: {total_logs}')
        self.stdout.write(f'  Sent: {sent_count}')
        self.stdout.write(f'  Delivered: {delivered_count}')
        self.stdout.write(f'  Failed: {failed_count}')
        self.stdout.write(f'  Pending: {pending_count}')
