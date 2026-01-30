import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from apps.projects.models import Project
from apps.activity.models import ActivityLog
from apps.users.models import EmailSettings
from .models import EmailLog, EmailTemplate
from .template_service import EmailTemplateRenderer


class CommunicationEmailService:
    """Service to send emails and log them"""

    @staticmethod
    def _send_via_user_smtp(smtp_config, subject, body_html, body_text, recipient_email, cc_list=None, bcc_list=None, attachments=None):
        """
        Send email using user's SMTP settings directly.

        Args:
            smtp_config: Dict with host, port, email, password, display_name, use_tls
            subject: Email subject
            body_html: HTML body content
            body_text: Plain text body content
            recipient_email: Primary recipient
            cc_list: List of CC recipients
            bcc_list: List of BCC recipients
            attachments: List of file paths to attach
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{smtp_config['display_name']} <{smtp_config['email']}>"
        msg['To'] = recipient_email

        if cc_list:
            msg['Cc'] = ', '.join(cc_list)

        # Attach text and HTML parts
        if body_text:
            msg.attach(MIMEText(body_text, 'plain'))
        msg.attach(MIMEText(body_html, 'html'))

        # Handle attachments
        if attachments:
            for file_path in attachments:
                if os.path.exists(file_path):
                    with open(file_path, 'rb') as f:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename="{os.path.basename(file_path)}"'
                        )
                        msg.attach(part)

        # Build recipient list
        all_recipients = [recipient_email]
        if cc_list:
            all_recipients.extend(cc_list)
        if bcc_list:
            all_recipients.extend(bcc_list)

        # Send via SMTP
        with smtplib.SMTP(smtp_config['host'], smtp_config['port']) as server:
            if smtp_config.get('use_tls', True):
                server.starttls()
            server.login(smtp_config['email'], smtp_config['password'])
            server.send_message(msg, to_addrs=all_recipients)

        return True

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
        Send email using a template.
        Uses user's SMTP settings if configured, otherwise falls back to system settings.

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
            # Check if user has configured email settings
            user_smtp_config = None
            if sent_by:
                try:
                    email_settings = sent_by.email_settings
                    if email_settings.is_verified and email_settings.email_password:
                        user_smtp_config = email_settings.get_smtp_config()
                except EmailSettings.DoesNotExist:
                    pass
                except Exception as e:
                    # Table might not exist yet (migration not run)
                    print(f"Could not check email settings: {e}")

            if user_smtp_config and user_smtp_config.get('password'):
                # Use user's SMTP settings
                CommunicationEmailService._send_via_user_smtp(
                    smtp_config=user_smtp_config,
                    subject=subject,
                    body_html=body_html,
                    body_text=body_text,
                    recipient_email=recipient_email,
                    cc_list=cc_list,
                    bcc_list=bcc_list,
                    attachments=attachments
                )
            else:
                # Check if we're in DEBUG mode - email will be printed to console
                if settings.DEBUG:
                    print("=" * 50)
                    print("DEBUG MODE: Email would be sent (console backend)")
                    print(f"To: {recipient_email}")
                    print(f"Subject: {subject}")
                    print("=" * 50)

                # Fallback to Django email backend (system settings)
                if sent_by and sent_by.email:
                    sender_name = sent_by.get_full_name() or sent_by.email
                    from_email = f'"{sender_name}" <{sent_by.email}>'
                    reply_to = [sent_by.email]
                else:
                    from_email = settings.DEFAULT_FROM_EMAIL
                    reply_to = [project.mechanical_manager.email] if project.mechanical_manager and project.mechanical_manager.email else None

                email = EmailMultiAlternatives(
                    subject=subject,
                    body=body_text or "Please view this email in HTML format",
                    from_email=from_email,
                    to=[recipient_email],
                    cc=cc_list,
                    bcc=bcc_list,
                    reply_to=reply_to
                )
                email.attach_alternative(body_html, "text/html")

                if attachments:
                    for attachment in attachments:
                        email.attach_file(attachment)

                email.send()

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
