from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from apps.projects.models import Project
from apps.activity.models import ActivityLog
from .models import EmailLog, EmailTemplate
from .template_service import EmailTemplateRenderer


class CommunicationEmailService:
    """Service to send emails and log them"""

    @staticmethod
    def send_email_from_template(
        project_id,
        template_id,
        recipient_email=None,
        cc_emails=None,
        bcc_emails=None,
        custom_subject=None,
        custom_body=None,
        sent_by=None,
        attachments=None
    ):
        """
        Send email using a template

        Args:
            project_id: Project ID
            template_id: EmailTemplate ID
            recipient_email: Override default client email
            cc_emails: List of CC emails
            bcc_emails: List of BCC emails
            custom_subject: Override template subject
            custom_body: Override template body
            sent_by: User who sent the email
            attachments: List of file paths to attach
        """

        # Get project and template
        project = Project.objects.select_related(
            'client', 'mechanical_manager', 'architect_designer'
        ).get(id=project_id)
        template = EmailTemplate.objects.get(id=template_id, is_active=True)

        # Render template with project data
        rendered = EmailTemplateRenderer.render_email_template(template, project)

        # Use custom content if provided
        subject = custom_subject or rendered['subject']
        body_html = custom_body or rendered['body_html']
        body_text = rendered['body_text']

        # Determine recipient
        if not recipient_email:
            if not project.client.contact_email:
                raise ValueError("Client has no email address and no recipient specified")
            recipient_email = project.client.contact_email

        recipient_name = project.client.name

        # Prepare CC and BCC
        cc_list = cc_emails or []
        bcc_list = bcc_emails or []

        # Create email log entry
        email_log = EmailLog.objects.create(
            project=project,
            template=template,
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            cc_emails=cc_list,
            bcc_emails=bcc_list,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            sent_by=sent_by,
            status='pending'
        )

        try:
            # Determine sender email - use logged-in manager's email
            if sent_by and sent_by.email:
                # Format: "Manager Name" <manager@company.com>
                sender_name = sent_by.get_full_name() or sent_by.email
                from_email = f'"{sender_name}" <{sent_by.email}>'
                reply_to = [sent_by.email]
            else:
                # Fallback to default if no manager specified
                from_email = settings.DEFAULT_FROM_EMAIL
                reply_to = [project.mechanical_manager.email] if project.mechanical_manager and project.mechanical_manager.email else None

            # Create email message with manager as sender
            email = EmailMultiAlternatives(
                subject=subject,
                body=body_text or "Please view this email in HTML format",
                from_email=from_email,
                to=[recipient_email],
                cc=cc_list,
                bcc=bcc_list,
                reply_to=reply_to
            )

            # Attach HTML version
            email.attach_alternative(body_html, "text/html")

            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    email.attach_file(attachment)

            # Send email
            result = email.send()

            # Update log status
            email_log.status = 'sent'
            email_log.save()

            # Create activity log entry for the email sent
            sender_info = f' by {sent_by.get_full_name()}' if sent_by else ''
            ActivityLog.objects.create(
                entity_type='project',
                project=project,
                action_type='email_sent',
                description=f'Email sent{sender_info} to {recipient_email}: "{subject}"',
                new_value=f'Template: {template.name}',
                user=sent_by
            )

            return {
                'success': True,
                'email_log_id': email_log.id,
                'recipient': recipient_email,
                'subject': subject
            }

        except Exception as e:
            # Log failure
            email_log.status = 'failed'
            email_log.error_message = str(e)
            email_log.save()

            raise e

    @staticmethod
    def preview_email_template(template_id, project_id):
        """Preview email template without sending"""

        template = EmailTemplate.objects.get(id=template_id)
        project = Project.objects.select_related(
            'client', 'mechanical_manager', 'architect_designer'
        ).get(id=project_id)

        rendered = EmailTemplateRenderer.render_email_template(template, project)

        return rendered
