"""
Email-to-CRM Linking Service

Automatically associates synced emails with Projects and Clients
by matching email addresses and parsing subject lines for job numbers.
"""
import logging
import re

from django.db.models import Q

from apps.clients.models import Client
from apps.projects.models import Project
from .models import SyncedEmail, EmailThread

logger = logging.getLogger(__name__)


class EmailLinkingService:
    """Service that links synced emails to CRM entities (projects, clients)"""

    # Pattern to match KEEN job numbers: YYYY-XXXX
    JOB_NUMBER_PATTERN = re.compile(r'\b(\d{4}-\d{4})\b')

    @classmethod
    def link_email(cls, synced_email: SyncedEmail):
        """
        Attempt to link a synced email to a project and/or client.
        Uses multiple strategies in priority order.
        """
        project = None
        client = None

        # Strategy 1: Match job number in subject line
        project = cls._match_by_job_number(synced_email.subject)

        # Strategy 2: Match by email address to client contact
        if not client:
            client = cls._match_client_by_email(synced_email)

        # Strategy 3: If we found a project, link to its client
        if project and not client:
            client = project.client

        # Strategy 4: If we found a client but no project, try to find
        # the most recent active project for that client
        if client and not project:
            project = cls._find_active_project_for_client(client)

        # Apply links
        updated_fields = []
        if project and synced_email.project_id != project.id:
            synced_email.project = project
            updated_fields.append('project')
        if client and synced_email.client_id != client.id:
            synced_email.client = client
            updated_fields.append('client')

        if updated_fields:
            synced_email.save(update_fields=updated_fields)

            # Also update the thread if the email belongs to one
            if synced_email.thread:
                cls._update_thread_links(synced_email.thread, project, client)

        return {
            'project': project,
            'client': client,
            'linked': bool(updated_fields),
        }

    @classmethod
    def link_thread(cls, thread: EmailThread):
        """Link all unlinked emails in a thread based on the thread's links"""
        linked_count = 0
        for msg in thread.messages.filter(
            Q(project__isnull=True) | Q(client__isnull=True)
        ):
            result = cls.link_email(msg)
            if result['linked']:
                linked_count += 1
        return linked_count

    @classmethod
    def bulk_link_unlinked(cls, account_id=None):
        """Process all unlinked synced emails and attempt to link them"""
        queryset = SyncedEmail.objects.filter(
            project__isnull=True, client__isnull=True
        )
        if account_id:
            queryset = queryset.filter(account_id=account_id)

        linked_count = 0
        for email_obj in queryset.iterator(chunk_size=100):
            result = cls.link_email(email_obj)
            if result['linked']:
                linked_count += 1

        logger.info("Bulk linking complete: %d emails linked", linked_count)
        return linked_count

    # ------------------------------------------------------------------
    # Matching strategies
    # ------------------------------------------------------------------

    @classmethod
    def _match_by_job_number(cls, subject):
        """Extract job number from subject and find matching project"""
        matches = cls.JOB_NUMBER_PATTERN.findall(subject)
        for job_number in matches:
            try:
                return Project.objects.get(job_number=job_number)
            except Project.DoesNotExist:
                continue
        return None

    @classmethod
    def _match_client_by_email(cls, synced_email):
        """Match the sender/recipient email to a client's contact email"""
        addresses = set()
        addresses.add(synced_email.from_address.lower())

        for addr_info in synced_email.to_addresses:
            if isinstance(addr_info, dict):
                addresses.add(addr_info.get('address', '').lower())
            elif isinstance(addr_info, str):
                addresses.add(addr_info.lower())

        for addr_info in synced_email.cc_addresses:
            if isinstance(addr_info, dict):
                addresses.add(addr_info.get('address', '').lower())
            elif isinstance(addr_info, str):
                addresses.add(addr_info.lower())

        # Remove empty strings
        addresses.discard('')

        # Check against client contact emails
        if addresses:
            client = Client.objects.filter(
                contact_email__in=addresses,
                is_active=True,
            ).first()
            if client:
                return client

        return None

    @classmethod
    def _find_active_project_for_client(cls, client):
        """Find the most recent active project for a given client"""
        return Project.objects.filter(
            client=client,
            status__in=['in_progress', 'not_started', 'submitted'],
        ).order_by('-created_at').first()

    @classmethod
    def _update_thread_links(cls, thread, project, client):
        """Propagate project/client links to the thread"""
        updated = []
        if project and thread.project_id != project.id:
            thread.project = project
            updated.append('project')
        if client and thread.client_id != client.id:
            thread.client = client
            updated.append('client')
        if updated:
            thread.save(update_fields=updated)

    @classmethod
    def manually_link_email(cls, synced_email_id, project_id=None, client_id=None):
        """Manually link an email to a project and/or client"""
        try:
            synced_email = SyncedEmail.objects.get(id=synced_email_id)
        except SyncedEmail.DoesNotExist:
            return {'success': False, 'error': 'Email not found'}

        updated_fields = []

        if project_id is not None:
            if project_id:
                try:
                    project = Project.objects.get(id=project_id)
                    synced_email.project = project
                except Project.DoesNotExist:
                    return {'success': False, 'error': 'Project not found'}
            else:
                synced_email.project = None
            updated_fields.append('project')

        if client_id is not None:
            if client_id:
                try:
                    client = Client.objects.get(id=client_id)
                    synced_email.client = client
                except Client.DoesNotExist:
                    return {'success': False, 'error': 'Client not found'}
            else:
                synced_email.client = None
            updated_fields.append('client')

        if updated_fields:
            synced_email.save(update_fields=updated_fields)

            # Propagate to thread
            if synced_email.thread:
                cls._update_thread_links(
                    synced_email.thread,
                    synced_email.project,
                    synced_email.client,
                )

        return {'success': True}
