from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.communication.models import EmailTemplate

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial email templates for the communication module'

    def handle(self, *args, **kwargs):
        # Get the first superuser or create a default user for template creation
        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = User.objects.filter(is_staff=True).first()
            if not admin_user:
                admin_user = User.objects.first()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error finding user: {str(e)}'))
            return

        if not admin_user:
            self.stdout.write(self.style.ERROR('No users found in database. Please create a user first.'))
            return

        templates = [
            {
                'name': 'Project Status Update',
                'template_type': 'status_update',
                'subject': 'Update on {{ project.project_name }} - Status: {{ project.status }}',
                'body_html': '''
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .info-section { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #4CAF50; }
                            .label { font-weight: bold; color: #555; }
                            .footer { margin-top: 30px; padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Project Status Update</h1>
                        </div>
                        <div class="content">
                            <p>Dear {{ client.contact_person }},</p>

                            <p>We wanted to provide you with an update on your project:</p>

                            <div class="info-section">
                                <p><span class="label">Project Name:</span> {{ project.project_name }}</p>
                                <p><span class="label">Project Type:</span> {{ project.project_type }}</p>
                                <p><span class="label">Current Status:</span> {{ project.status }}</p>
                                <p><span class="label">Location:</span> {{ project.location }}</p>
                            </div>

                            {% if project.admin_note %}
                            <div class="info-section">
                                <p><span class="label">Notes:</span></p>
                                <p>{{ project.admin_note }}</p>
                            </div>
                            {% endif %}

                            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>

                            <p>Best regards,<br>
                            {{ sent_by.get_full_name }}<br>
                            {{ company_name }}</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email from {{ company_name }}. Please do not reply directly to this email.</p>
                        </div>
                    </body>
                    </html>
                ''',
                'body_text': '''
Dear {{ client.contact_person }},

We wanted to provide you with an update on your project:

Project Name: {{ project.project_name }}
Project Type: {{ project.project_type }}
Current Status: {{ project.status }}
Location: {{ project.location }}

{% if project.admin_note %}
Notes:
{{ project.admin_note }}
{% endif %}

If you have any questions or concerns, please don't hesitate to contact us.

Best regards,
{{ sent_by.get_full_name }}
{{ company_name }}
                ''',
                'is_active': True,
                'is_default': True,
            },
            {
                'name': 'Inspection Reminder',
                'template_type': 'inspection_reminder',
                'subject': 'Upcoming Inspection for {{ project.project_name }}',
                'body_html': '''
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .info-section { margin: 20px 0; padding: 15px; background-color: #fff3e0; border-left: 4px solid #FF9800; }
                            .label { font-weight: bold; color: #555; }
                            .footer { margin-top: 30px; padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Inspection Reminder</h1>
                        </div>
                        <div class="content">
                            <p>Dear {{ client.contact_person }},</p>

                            <p>This is a reminder about the upcoming inspection for your project:</p>

                            <div class="info-section">
                                <p><span class="label">Project Name:</span> {{ project.project_name }}</p>
                                <p><span class="label">Location:</span> {{ project.location }}</p>
                                <p><span class="label">Due Date:</span> {{ project.due_date|date:"F d, Y" }}</p>
                            </div>

                            {% if project.inspection_note %}
                            <div class="info-section">
                                <p><span class="label">Inspection Details:</span></p>
                                <p>{{ project.inspection_note }}</p>
                            </div>
                            {% endif %}

                            <p>Please ensure that the site is accessible and ready for inspection.</p>

                            <p>Best regards,<br>
                            {{ sent_by.get_full_name }}<br>
                            {{ company_name }}</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email from {{ company_name }}. Please do not reply directly to this email.</p>
                        </div>
                    </body>
                    </html>
                ''',
                'body_text': '''
Dear {{ client.contact_person }},

This is a reminder about the upcoming inspection for your project:

Project Name: {{ project.project_name }}
Location: {{ project.location }}
Due Date: {{ project.due_date|date:"F d, Y" }}

{% if project.inspection_note %}
Inspection Details:
{{ project.inspection_note }}
{% endif %}

Please ensure that the site is accessible and ready for inspection.

Best regards,
{{ sent_by.get_full_name }}
{{ company_name }}
                ''',
                'is_active': True,
                'is_default': False,
            },
            {
                'name': 'Project Completion Notice',
                'template_type': 'completion_notice',
                'subject': 'Project Completed: {{ project.project_name }}',
                'body_html': '''
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .info-section { margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196F3; }
                            .label { font-weight: bold; color: #555; }
                            .footer { margin-top: 30px; padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Project Completion Notice</h1>
                        </div>
                        <div class="content">
                            <p>Dear {{ client.contact_person }},</p>

                            <p>We are pleased to inform you that your project has been completed:</p>

                            <div class="info-section">
                                <p><span class="label">Project Name:</span> {{ project.project_name }}</p>
                                <p><span class="label">Project Type:</span> {{ project.project_type }}</p>
                                <p><span class="label">Location:</span> {{ project.location }}</p>
                                <p><span class="label">Completion Date:</span> {{ project.updated_at|date:"F d, Y" }}</p>
                            </div>

                            {% if project.completion_note %}
                            <div class="info-section">
                                <p><span class="label">Completion Notes:</span></p>
                                <p>{{ project.completion_note }}</p>
                            </div>
                            {% endif %}

                            <p>Thank you for choosing {{ company_name }} for your project. We look forward to working with you again in the future.</p>

                            <p>Best regards,<br>
                            {{ sent_by.get_full_name }}<br>
                            {{ company_name }}</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email from {{ company_name }}. Please do not reply directly to this email.</p>
                        </div>
                    </body>
                    </html>
                ''',
                'body_text': '''
Dear {{ client.contact_person }},

We are pleased to inform you that your project has been completed:

Project Name: {{ project.project_name }}
Project Type: {{ project.project_type }}
Location: {{ project.location }}
Completion Date: {{ project.updated_at|date:"F d, Y" }}

{% if project.completion_note %}
Completion Notes:
{{ project.completion_note }}
{% endif %}

Thank you for choosing {{ company_name }} for your project. We look forward to working with you again in the future.

Best regards,
{{ sent_by.get_full_name }}
{{ company_name }}
                ''',
                'is_active': True,
                'is_default': False,
            },
            {
                'name': 'Permit Update Notification',
                'template_type': 'permit_update',
                'subject': 'Permit Update for {{ project.project_name }}',
                'body_html': '''
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .info-section { margin: 20px 0; padding: 15px; background-color: #f3e5f5; border-left: 4px solid #9C27B0; }
                            .label { font-weight: bold; color: #555; }
                            .footer { margin-top: 30px; padding: 20px; background-color: #f9f9f9; text-align: center; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Permit Update</h1>
                        </div>
                        <div class="content">
                            <p>Dear {{ client.contact_person }},</p>

                            <p>We have an update regarding the permit status for your project:</p>

                            <div class="info-section">
                                <p><span class="label">Project Name:</span> {{ project.project_name }}</p>
                                <p><span class="label">Location:</span> {{ project.location }}</p>
                                <p><span class="label">Current Status:</span> {{ project.status }}</p>
                            </div>

                            {% if project.permit_note %}
                            <div class="info-section">
                                <p><span class="label">Permit Details:</span></p>
                                <p>{{ project.permit_note }}</p>
                            </div>
                            {% endif %}

                            <p>We will keep you informed of any further developments.</p>

                            <p>Best regards,<br>
                            {{ sent_by.get_full_name }}<br>
                            {{ company_name }}</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email from {{ company_name }}. Please do not reply directly to this email.</p>
                        </div>
                    </body>
                    </html>
                ''',
                'body_text': '''
Dear {{ client.contact_person }},

We have an update regarding the permit status for your project:

Project Name: {{ project.project_name }}
Location: {{ project.location }}
Current Status: {{ project.status }}

{% if project.permit_note %}
Permit Details:
{{ project.permit_note }}
{% endif %}

We will keep you informed of any further developments.

Best regards,
{{ sent_by.get_full_name }}
{{ company_name }}
                ''',
                'is_active': True,
                'is_default': False,
            },
        ]

        created_count = 0
        for template_data in templates:
            template, created = EmailTemplate.objects.get_or_create(
                name=template_data['name'],
                template_type=template_data['template_type'],
                defaults={
                    'subject': template_data['subject'],
                    'body_html': template_data['body_html'],
                    'body_text': template_data['body_text'],
                    'is_active': template_data['is_active'],
                    'is_default': template_data.get('is_default', False),
                    'created_by': admin_user,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created template: {template.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'- Template already exists: {template.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nSeeding complete! Created {created_count} new templates.'))
