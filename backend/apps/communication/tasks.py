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


# =============================================================================
# Email Sync Tasks
# =============================================================================


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def sync_email_account(self, account_id):
    """
    Sync a single email account via IMAP.

    Args:
        account_id: UUID of the EmailAccount to sync

    Returns:
        dict: Sync result with counts and errors
    """
    from .models import EmailAccount
    from .sync_service import IMAPSyncService
    from .linking_service import EmailLinkingService

    try:
        account = EmailAccount.objects.get(
            id=account_id, is_active=True, sync_enabled=True
        )
    except EmailAccount.DoesNotExist:
        logger.warning('Email account %s not found or disabled', account_id)
        return {'success': False, 'error': 'Account not found or disabled'}

    try:
        service = IMAPSyncService(account)
        result = service.sync()

        # Auto-link newly synced emails
        if result.get('new_emails', 0) > 0:
            linked = EmailLinkingService.bulk_link_unlinked(
                account_id=account_id
            )
            result['linked_emails'] = linked

        logger.info(
            'Sync complete for %s: %d new emails',
            account.email_address, result.get('new_emails', 0),
        )
        return result

    except Exception as exc:
        logger.error('Sync failed for %s: %s', account_id, exc)
        raise self.retry(exc=exc)


@shared_task
def sync_all_active_accounts():
    """
    Periodic task: Sync all active email accounts.
    Called by Celery Beat on schedule.
    """
    from .models import EmailAccount

    accounts = EmailAccount.objects.filter(
        is_active=True, sync_enabled=True
    )

    queued = 0
    for account in accounts:
        sync_email_account.delay(str(account.id))
        queued += 1

    logger.info('Queued sync for %d active email accounts', queued)
    return {'queued': queued}


@shared_task
def link_unlinked_emails():
    """
    Periodic task: Attempt to link any unlinked synced emails.
    Useful when new projects/clients are added after emails were synced.
    """
    from .linking_service import EmailLinkingService

    linked = EmailLinkingService.bulk_link_unlinked()
    logger.info('Periodic linking: %d emails linked', linked)
    return {'linked': linked}
