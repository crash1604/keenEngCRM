"""
Microsoft OAuth2 service for Outlook email accounts.
Uses MSAL with Authorization Code Flow + PKCE.
"""
import logging

import msal
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_msal_app():
    """Build a ConfidentialClientApplication from settings."""
    config = settings.MICROSOFT_OAUTH2
    return msal.ConfidentialClientApplication(
        client_id=config['CLIENT_ID'],
        client_credential=config['CLIENT_SECRET'],
        authority=config['AUTHORITY'],
    )


def get_auth_url(state=None):
    """
    Generate the Microsoft OAuth2 authorization URL.

    Args:
        state: Opaque string passed through to callback.

    Returns:
        dict: MSAL flow dict containing 'auth_uri' and flow state.
    """
    app = _get_msal_app()
    config = settings.MICROSOFT_OAUTH2
    flow = app.initiate_auth_code_flow(
        scopes=config['SCOPES'],
        redirect_uri=config['REDIRECT_URI'],
        state=state,
    )
    return flow


def exchange_code_for_tokens(auth_code_flow, auth_response):
    """
    Exchange the authorization code for tokens.

    Args:
        auth_code_flow: The flow dict returned by get_auth_url.
        auth_response: The query params from the callback.

    Returns:
        dict with 'access_token', 'refresh_token', 'expires_in', or 'error'.
    """
    app = _get_msal_app()
    result = app.acquire_token_by_auth_code_flow(
        auth_code_flow=auth_code_flow,
        auth_response=auth_response,
    )
    if 'access_token' in result:
        return {
            'access_token': result['access_token'],
            'refresh_token': result.get('refresh_token', ''),
            'expires_in': result.get('expires_in', 3600),
            'id_token_claims': result.get('id_token_claims', {}),
        }
    error = result.get('error_description', result.get('error', 'Unknown error'))
    logger.error("OAuth2 token exchange failed: %s", error)
    return {'error': error}


def refresh_access_token(refresh_token_decrypted):
    """
    Use a refresh token to get a new access token.

    Args:
        refresh_token_decrypted: The plaintext refresh token.

    Returns:
        dict with 'access_token', 'refresh_token', 'expires_in', or 'error'.
    """
    app = _get_msal_app()
    config = settings.MICROSOFT_OAUTH2
    result = app.acquire_token_by_refresh_token(
        refresh_token=refresh_token_decrypted,
        scopes=config['SCOPES'],
    )
    if 'access_token' in result:
        return {
            'access_token': result['access_token'],
            'refresh_token': result.get('refresh_token', refresh_token_decrypted),
            'expires_in': result.get('expires_in', 3600),
        }
    error = result.get('error_description', result.get('error', 'Unknown error'))
    logger.error("OAuth2 token refresh failed: %s", error)
    return {'error': error}
