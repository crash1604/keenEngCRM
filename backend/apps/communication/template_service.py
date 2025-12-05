from django.template import Context, Template
from django.utils import timezone
from django.conf import settings


class EmailTemplateRenderer:
    """Service to render email templates with project data"""

    @staticmethod
    def get_template_context(project):
        """Build context dictionary with all available variables"""

        context = {
            # Project data
            'project': {
                'id': project.id,
                'project_name': project.project_name,
                'job_number': project.job_number,
                'status': project.get_status_display(),
                'status_code': project.status,
                'current_sub_status': project.current_sub_status or 'N/A',
                'due_date': project.due_date.strftime('%B %d, %Y') if project.due_date else 'Not set',
                'due_date_raw': project.due_date,
                'address': project.address,
                'current_open_items': project.current_open_items or 'None',
                'current_action_items': project.current_action_items or 'None',
                'rough_in_date': project.rough_in_date.strftime('%B %d, %Y') if project.rough_in_date else 'Not scheduled',
                'final_inspection_date': project.final_inspection_date.strftime('%B %d, %Y') if project.final_inspection_date else 'Not scheduled',
                'year': project.year,
                'project_types': ', '.join(project.project_types_list),
                'days_until_due': project.days_until_due,
                'is_overdue': project.is_overdue,
            },

            # Client data
            'client': {
                'name': project.client.name,
                'company_name': project.client.company_name or project.client.name,
                'contact_email': project.client.contact_email,
                'phone': project.client.phone or 'N/A',
                'contact_person': project.client.contact_person or 'N/A',
                'address': project.client.address or 'N/A',
            },

            # Manager data
            'manager': {
                'first_name': project.mechanical_manager.first_name,
                'last_name': project.mechanical_manager.last_name,
                'full_name': project.mechanical_manager.get_full_name(),
                'email': project.mechanical_manager.email,
                'phone': project.mechanical_manager.phone or 'N/A',
            },

            # Architect data (if exists)
            'architect': {
                'name': project.architect_designer.name if project.architect_designer else 'Not assigned',
                'company_name': project.architect_designer.company_name if project.architect_designer else 'N/A',
                'contact_email': project.architect_designer.contact_email if project.architect_designer else 'N/A',
                'phone': project.architect_designer.phone if project.architect_designer else 'N/A',
            } if project.architect_designer else {
                'name': 'Not assigned',
                'company_name': 'N/A',
                'contact_email': 'N/A',
                'phone': 'N/A',
            },

            # System/Company data
            'system': {
                'current_date': timezone.now().strftime('%B %d, %Y'),
                'current_datetime': timezone.now().strftime('%B %d, %Y %I:%M %p'),
                'company_name': getattr(settings, 'COMPANY_NAME', 'Keen Engineering CRM'),
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@keenengineering.com'),
                'website': getattr(settings, 'COMPANY_WEBSITE', 'www.keenengineering.com'),
            }
        }

        return context

    @staticmethod
    def render_template(template_string, context_dict):
        """Render a template string with context"""
        template = Template(template_string)
        context = Context(context_dict)
        return template.render(context)

    @classmethod
    def render_email_template(cls, email_template, project):
        """Render an EmailTemplate with project data"""
        context = cls.get_template_context(project)

        subject = cls.render_template(email_template.subject, context)
        body_html = cls.render_template(email_template.body_html, context)
        body_text = cls.render_template(email_template.body_text, context) if email_template.body_text else None

        return {
            'subject': subject,
            'body_html': body_html,
            'body_text': body_text,
            'context': context
        }
