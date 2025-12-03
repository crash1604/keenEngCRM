# clients/permissions.py
from rest_framework import permissions

class IsAdminOrManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission:
    - Read permissions are allowed to any authenticated user (GET, HEAD, OPTIONS)
    - Write permissions (POST, PUT, PATCH, DELETE) are only allowed to admins and managers
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to users with admin or manager role
        if request.user and request.user.is_authenticated:
            return request.user.role in ['admin', 'manager']
        return False

class IsAdminOrManagerOrOwnerReadOnly(permissions.BasePermission):
    """
    Object-level permission:
    - Read permissions allowed to any authenticated user
    - Write permissions allowed only to admins, managers, or the owner
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to:
        # 1. Admins or managers
        # 2. The client's user account (if linked)
        if request.user and request.user.is_authenticated:
            is_admin_or_manager = request.user.role in ['admin', 'manager']
            is_owner = hasattr(obj, 'user_account') and obj.user_account == request.user
            return is_admin_or_manager or is_owner
        return False

class IsAdminOrManager(permissions.BasePermission):
    """
    Permission that only allows admins and managers (no read-only for others)
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return request.user.role in ['admin', 'manager']
        return False

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_authenticated:
            return request.user.role in ['admin', 'manager']
        return False