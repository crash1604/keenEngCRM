"""
IMAP Email Sync Service

Handles connecting to IMAP servers, fetching emails incrementally,
parsing message content, and storing them as SyncedEmail records.
Supports Gmail, Outlook, and generic IMAP providers.
"""
import email
import email.header
import email.utils
import imaplib
import logging
import re
from datetime import datetime, timedelta
from email.policy import default as default_policy

from django.utils import timezone

from .models import (
    EmailAccount, EmailThread, SyncedEmail,
    SyncedEmailAttachment, SyncCursor,
)

logger = logging.getLogger(__name__)


class IMAPSyncService:
    """Service for syncing emails from IMAP accounts"""

    def __init__(self, account: EmailAccount):
        self.account = account
        self.connection = None

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------

    def connect(self):
        """Establish IMAP connection with password or OAuth2 auth."""
        config = self.account.get_imap_config()
        try:
            if config['ssl']:
                self.connection = imaplib.IMAP4_SSL(
                    config['host'], config['port']
                )
            else:
                self.connection = imaplib.IMAP4(
                    config['host'], config['port']
                )

            if self.account.auth_method == 'oauth2':
                self._authenticate_oauth2()
            else:
                self.connection.login(
                    self.account.email_address,
                    self.account.password,
                )

            logger.info("Connected to IMAP: %s", self.account.email_address)
            return True
        except imaplib.IMAP4.error as exc:
            logger.error(
                "IMAP login failed for %s: %s",
                self.account.email_address, exc,
            )
            raise ConnectionError(f"IMAP login failed: {exc}") from exc

    def _authenticate_oauth2(self):
        """Authenticate via XOAUTH2 SASL mechanism, refreshing token if needed."""
        if self.account.is_oauth2_token_expired():
            self._refresh_oauth2_token()

        access_token = self.account.get_oauth2_access_token()
        if not access_token:
            raise ConnectionError("No valid OAuth2 access token available")

        auth_string = (
            f"user={self.account.email_address}\x01"
            f"auth=Bearer {access_token}\x01\x01"
        )
        self.connection.authenticate('XOAUTH2', lambda x: auth_string.encode())

    def _refresh_oauth2_token(self):
        """Use the refresh token to obtain a fresh access token."""
        from .oauth2_service import refresh_access_token

        refresh_token = self.account.get_oauth2_refresh_token()
        if not refresh_token:
            raise ConnectionError(
                "No OAuth2 refresh token stored -- re-authorize required"
            )

        result = refresh_access_token(refresh_token)
        if 'error' in result:
            raise ConnectionError(
                f"OAuth2 token refresh failed: {result['error']}"
            )

        self.account.set_oauth2_tokens(
            access_token=result['access_token'],
            refresh_token=result.get('refresh_token', refresh_token),
            expires_in=result.get('expires_in', 3600),
        )

    def disconnect(self):
        """Close IMAP connection"""
        if self.connection:
            try:
                self.connection.logout()
            except Exception:
                pass
            self.connection = None

    def test_connection(self):
        """Test that we can connect and authenticate"""
        try:
            self.connect()
            self.disconnect()
            return {'success': True, 'message': 'Connection successful'}
        except Exception as exc:
            return {'success': False, 'message': str(exc)}

    # ------------------------------------------------------------------
    # Folder discovery
    # ------------------------------------------------------------------

    def list_folders(self):
        """List available IMAP folders"""
        self.connect()
        try:
            status, folder_data = self.connection.list()
            if status != 'OK':
                return []

            folders = []
            for item in folder_data:
                if isinstance(item, bytes):
                    decoded = item.decode('utf-8', errors='replace')
                    # Parse IMAP LIST response: (\\flags) "delimiter" "name"
                    match = re.search(r'"([^"]*)"$|(\S+)$', decoded)
                    if match:
                        folder_name = match.group(1) or match.group(2)
                        folders.append(folder_name)
            return folders
        finally:
            self.disconnect()

    # ------------------------------------------------------------------
    # Incremental sync
    # ------------------------------------------------------------------

    def sync(self):
        """Run a full incremental sync across configured folders"""
        folders = self.account.sync_folders or ['INBOX', '[Gmail]/Sent Mail']
        total_new = 0
        errors = []

        self.connect()
        try:
            for folder in folders:
                try:
                    new_count = self._sync_folder(folder)
                    total_new += new_count
                except Exception as exc:
                    logger.error(
                        "Error syncing folder %s for %s: %s",
                        folder, self.account.email_address, exc,
                    )
                    errors.append(f"{folder}: {exc}")

            # Update account sync status
            self.account.last_sync_at = timezone.now()
            self.account.last_sync_status = 'error' if errors else 'success'
            self.account.last_sync_error = '; '.join(errors) if errors else ''
            self.account.total_synced += total_new
            self.account.save(update_fields=[
                'last_sync_at', 'last_sync_status',
                'last_sync_error', 'total_synced',
            ])

            return {
                'success': not errors,
                'new_emails': total_new,
                'errors': errors,
            }
        finally:
            self.disconnect()

    def _sync_folder(self, folder_name):
        """Sync a single IMAP folder incrementally using UIDs"""
        status, _ = self.connection.select(folder_name, readonly=True)
        if status != 'OK':
            logger.warning("Cannot select folder: %s", folder_name)
            return 0

        # Get or create sync cursor for this folder
        cursor, _ = SyncCursor.objects.get_or_create(
            account=self.account,
            folder=folder_name,
        )

        # Check UIDVALIDITY - if it changed, folder was rebuilt
        status, data = self.connection.status(
            f'"{folder_name}"', '(UIDVALIDITY MESSAGES)'
        )
        if status == 'OK' and data[0]:
            match = re.search(
                r'UIDVALIDITY (\d+).*MESSAGES (\d+)',
                data[0].decode('utf-8', errors='replace')
            )
            if match:
                uidvalidity = int(match.group(1))
                if cursor.uidvalidity and cursor.uidvalidity != uidvalidity:
                    # Folder was rebuilt, reset cursor
                    logger.info(
                        "UIDVALIDITY changed for %s, resetting cursor",
                        folder_name,
                    )
                    cursor.last_uid = 0
                cursor.uidvalidity = uidvalidity

        # Build search criteria for incremental fetch
        search_criteria = self._build_search_criteria(cursor)

        status, data = self.connection.uid('SEARCH', None, *search_criteria)
        if status != 'OK' or not data[0]:
            cursor.last_sync_at = timezone.now()
            cursor.save()
            return 0

        uids = data[0].split()
        new_count = 0

        for uid_bytes in uids:
            uid_str = uid_bytes.decode('utf-8')
            uid_int = int(uid_str)

            # Skip already-synced UIDs
            if uid_int <= cursor.last_uid:
                continue

            try:
                synced = self._fetch_and_store_email(uid_str, folder_name)
                if synced:
                    new_count += 1
            except Exception as exc:
                logger.error(
                    "Error fetching UID %s in %s: %s",
                    uid_str, folder_name, exc,
                )

            # Update cursor progressively
            if uid_int > cursor.last_uid:
                cursor.last_uid = uid_int

        cursor.last_sync_at = timezone.now()
        cursor.message_count += new_count
        cursor.save()

        return new_count

    def _build_search_criteria(self, cursor):
        """Build IMAP search criteria for incremental sync"""
        criteria = []

        # Only fetch emails newer than max_sync_age_days
        if self.account.max_sync_age_days:
            since_date = datetime.now() - timedelta(
                days=self.account.max_sync_age_days
            )
            criteria.append(f'SINCE {since_date.strftime("%d-%b-%Y")}')

        # Fetch UIDs greater than last synced
        if cursor.last_uid > 0:
            criteria.append(f'UID {cursor.last_uid + 1}:*')

        return criteria if criteria else ['ALL']

    # ------------------------------------------------------------------
    # Email fetching and parsing
    # ------------------------------------------------------------------

    def _fetch_and_store_email(self, uid, folder_name):
        """Fetch a single email by UID and store it"""
        status, data = self.connection.uid(
            'FETCH', uid, '(RFC822 FLAGS)'
        )
        if status != 'OK' or not data or not data[0]:
            return False

        raw_email = data[0][1]
        flags_data = data[0][0].decode('utf-8', errors='replace')

        msg = email.message_from_bytes(raw_email, policy=default_policy)

        # Extract message ID for deduplication
        message_id = msg.get('Message-ID', '').strip()
        if not message_id:
            message_id = f"<generated-{uid}-{folder_name}@{self.account.email_address}>"

        # Skip if already synced (dedup by message_id)
        if SyncedEmail.objects.filter(
            account=self.account,
            message_id=message_id,
        ).exists():
            return False

        # Parse email fields
        parsed = self._parse_email(msg, flags_data)
        parsed['message_id'] = message_id
        parsed['imap_uid'] = uid
        parsed['folder'] = folder_name

        # Determine direction
        account_email = self.account.email_address.lower()
        from_lower = parsed['from_address'].lower()
        direction = 'outbound' if from_lower == account_email else 'inbound'

        # Find or create thread
        thread = self._get_or_create_thread(parsed)

        # Create synced email
        synced_email = SyncedEmail.objects.create(
            account=self.account,
            thread=thread,
            message_id=parsed['message_id'],
            imap_uid=parsed['imap_uid'],
            folder=parsed['folder'],
            in_reply_to=parsed.get('in_reply_to', ''),
            references=parsed.get('references', []),
            from_address=parsed['from_address'],
            from_name=parsed.get('from_name', ''),
            to_addresses=parsed['to_addresses'],
            cc_addresses=parsed.get('cc_addresses', []),
            bcc_addresses=parsed.get('bcc_addresses', []),
            reply_to=parsed.get('reply_to', ''),
            subject=parsed['subject'],
            date=parsed['date'],
            direction=direction,
            body_text=parsed.get('body_text', ''),
            body_html=parsed.get('body_html', ''),
            has_attachments=parsed.get('has_attachments', False),
            is_read='\\Seen' in flags_data,
            is_starred='\\Flagged' in flags_data,
            is_draft='\\Draft' in flags_data,
            raw_headers=parsed.get('headers', {}),
        )

        # Store attachments
        for att_data in parsed.get('attachments', []):
            SyncedEmailAttachment.objects.create(
                email=synced_email,
                file_name=att_data['filename'],
                content_type=att_data['content_type'],
                file_size=att_data.get('size', 0),
                is_inline=att_data.get('is_inline', False),
                content_id=att_data.get('content_id', ''),
            )

        # Update thread counts
        if thread:
            thread.update_counts()

        return True

    def _parse_email(self, msg, flags_data=''):
        """Parse an email.message.Message into a dict"""
        result = {}

        # Subject
        result['subject'] = self._decode_header(msg.get('Subject', ''))[:500]

        # From
        from_addr = msg.get('From', '')
        name, addr = email.utils.parseaddr(from_addr)
        result['from_name'] = self._decode_header(name)
        result['from_address'] = addr or from_addr

        # To
        result['to_addresses'] = self._parse_address_list(msg.get('To', ''))

        # CC
        result['cc_addresses'] = self._parse_address_list(msg.get('Cc', ''))

        # BCC
        result['bcc_addresses'] = self._parse_address_list(msg.get('Bcc', ''))

        # Reply-To
        result['reply_to'] = msg.get('Reply-To', '')

        # Date
        date_str = msg.get('Date', '')
        result['date'] = self._parse_date(date_str)

        # Threading headers
        result['in_reply_to'] = msg.get('In-Reply-To', '').strip()
        refs = msg.get('References', '')
        result['references'] = [
            r.strip() for r in refs.split() if r.strip()
        ] if refs else []

        # Important headers for debugging
        result['headers'] = {
            'Message-ID': msg.get('Message-ID', ''),
            'In-Reply-To': msg.get('In-Reply-To', ''),
            'References': msg.get('References', ''),
            'X-Mailer': msg.get('X-Mailer', ''),
        }

        # Body and attachments
        result['body_text'] = ''
        result['body_html'] = ''
        result['attachments'] = []
        result['has_attachments'] = False

        if msg.is_multipart():
            self._walk_multipart(msg, result)
        else:
            content_type = msg.get_content_type()
            charset = msg.get_content_charset() or 'utf-8'
            payload = msg.get_payload(decode=True)
            if payload:
                try:
                    body = payload.decode(charset, errors='replace')
                except (UnicodeDecodeError, LookupError):
                    body = payload.decode('utf-8', errors='replace')

                if content_type == 'text/html':
                    result['body_html'] = body
                else:
                    result['body_text'] = body

        return result

    def _walk_multipart(self, msg, result):
        """Walk multipart message and extract text, HTML, and attachments"""
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get('Content-Disposition', ''))

            if content_type == 'multipart':
                continue

            # Attachment
            if 'attachment' in disposition or (
                part.get_filename() and 'inline' not in disposition
            ):
                filename = self._decode_header(
                    part.get_filename() or 'attachment'
                )
                payload = part.get_payload(decode=True)
                result['attachments'].append({
                    'filename': filename,
                    'content_type': content_type,
                    'size': len(payload) if payload else 0,
                    'is_inline': 'inline' in disposition,
                    'content_id': part.get('Content-ID', '').strip('<>'),
                })
                result['has_attachments'] = True
                continue

            # Text body
            if content_type == 'text/plain' and not result['body_text']:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        result['body_text'] = payload.decode(
                            charset, errors='replace'
                        )
                    except (UnicodeDecodeError, LookupError):
                        result['body_text'] = payload.decode(
                            'utf-8', errors='replace'
                        )

            # HTML body
            elif content_type == 'text/html' and not result['body_html']:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        result['body_html'] = payload.decode(
                            charset, errors='replace'
                        )
                    except (UnicodeDecodeError, LookupError):
                        result['body_html'] = payload.decode(
                            'utf-8', errors='replace'
                        )

    # ------------------------------------------------------------------
    # Threading
    # ------------------------------------------------------------------

    def _get_or_create_thread(self, parsed):
        """Find an existing thread or create a new one based on References/In-Reply-To"""
        # Try to find thread by References or In-Reply-To
        references = parsed.get('references', [])
        in_reply_to = parsed.get('in_reply_to', '')

        all_refs = list(references)
        if in_reply_to and in_reply_to not in all_refs:
            all_refs.append(in_reply_to)

        if all_refs:
            # Find any existing synced email with one of these message IDs
            existing = SyncedEmail.objects.filter(
                account=self.account,
                message_id__in=all_refs,
                thread__isnull=False,
            ).select_related('thread').first()

            if existing and existing.thread:
                thread = existing.thread
                # Update participants
                participants = set(thread.participants)
                participants.add(parsed['from_address'])
                for addr_info in parsed.get('to_addresses', []):
                    if isinstance(addr_info, dict):
                        participants.add(addr_info.get('address', ''))
                    else:
                        participants.add(str(addr_info))
                thread.participants = list(participants)
                thread.save(update_fields=['participants'])
                return thread

        # Build normalized subject for grouping
        normalized_subject = self._normalize_subject(parsed['subject'])

        # Try to match by normalized subject + overlapping participants
        all_addresses = {parsed['from_address']}
        for addr_info in parsed.get('to_addresses', []):
            if isinstance(addr_info, dict):
                all_addresses.add(addr_info.get('address', ''))
            else:
                all_addresses.add(str(addr_info))

        existing_thread = EmailThread.objects.filter(
            account=self.account,
            subject=normalized_subject,
        ).first()

        if existing_thread:
            participants = set(existing_thread.participants)
            participants.update(all_addresses)
            existing_thread.participants = list(participants)
            existing_thread.save(update_fields=['participants'])
            return existing_thread

        # Create new thread
        return EmailThread.objects.create(
            account=self.account,
            subject=normalized_subject,
            participants=list(all_addresses),
        )

    @staticmethod
    def _normalize_subject(subject):
        """Remove Re:/Fwd: prefixes for thread matching"""
        normalized = re.sub(
            r'^(Re|Fwd|Fw)\s*:\s*', '', subject, flags=re.IGNORECASE
        ).strip()
        return normalized or subject

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _decode_header(value):
        """Decode RFC 2047 encoded header value"""
        if not value:
            return ''
        decoded_parts = email.header.decode_header(value)
        result = []
        for part, charset in decoded_parts:
            if isinstance(part, bytes):
                try:
                    result.append(part.decode(charset or 'utf-8', errors='replace'))
                except (UnicodeDecodeError, LookupError):
                    result.append(part.decode('utf-8', errors='replace'))
            else:
                result.append(part)
        return ''.join(result)

    @staticmethod
    def _parse_address_list(header_value):
        """Parse a comma-separated address header into a list of dicts"""
        if not header_value:
            return []
        addresses = email.utils.getaddresses([header_value])
        return [
            {'name': name, 'address': addr}
            for name, addr in addresses if addr
        ]

    @staticmethod
    def _parse_date(date_str):
        """Parse email date string into timezone-aware datetime"""
        if not date_str:
            return timezone.now()
        try:
            parsed = email.utils.parsedate_to_datetime(date_str)
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed)
            return parsed
        except (ValueError, TypeError):
            return timezone.now()
