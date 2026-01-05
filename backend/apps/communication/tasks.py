from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_async(self, project_id, template_id, sent_by_id, **kwargs):
    """
    Async Celery task to send email from manager's email address.

    Args:
        project_id: Project ID
        template_id: EmailTemplate ID
        sent_by_id: User ID of the manager sending the email
        **kwargs: Additional arguments (recipient_email, cc_emails, etc.)

    Returns:
        dict: Result with success status and email details
    """
    from django.contrib.auth import get_user_model
    from .email_service import CommunicationEmailService

    User = get_user_model()

    try:
        # Get the user who is sending the email
        sent_by = None
        if sent_by_id:
            try:
                sent_by = User.objects.get(id=sent_by_id)
            except User.DoesNotExist:
                logger.warning(f'User with id {sent_by_id} not found, sending without user context')

        # Send the email
        result = CommunicationEmailService.send_email_from_template(
            project_id=project_id,
            template_id=template_id,
            sent_by=sent_by,
            **kwargs
        )

        logger.info(f'Email sent successfully: {result}')
        return result

    except Exception as exc:
        logger.error(f'Failed to send email: {exc}')
        # Retry the task on failure
        raise self.retry(exc=exc)


@shared_task
def send_bulk_emails_async(email_data_list):
    """
    Send multiple emails asynchronously.

    Args:
        email_data_list: List of dicts with project_id, template_id, sent_by_id, etc.

    Returns:
        list: Results for each email
    """
    results = []
    for email_data in email_data_list:
        try:
            result = send_email_async.delay(
                project_id=email_data.get('project_id'),
                template_id=email_data.get('template_id'),
                sent_by_id=email_data.get('sent_by_id'),
                **email_data.get('kwargs', {})
            )
            results.append({'task_id': result.id, 'status': 'queued'})
        except Exception as e:
            results.append({'error': str(e), 'status': 'failed'})

    return results
