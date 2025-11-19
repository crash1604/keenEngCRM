from rest_framework import permissions

class ProjectPermissions(permissions.BasePermission):
    """
    Custom permissions for Project model based on user roles
    """
    
    def has_permission(self, request, view):
        # All authenticated users can view projects (with filters applied in get_queryset)
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Only admins, managers, and employees can create projects
        if view.action == 'create':
            return request.user.role in ['admin', 'manager', 'employee']
        
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request with object-level filtering
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admins can do anything
        if request.user.role == 'admin':
            return True
        
        # Managers can modify any project
        if request.user.role == 'manager':
            return True
        
        # Employees can only modify projects they manage
        if request.user.role == 'employee':
            return obj.mechanical_manager == request.user
        
        # Clients and architects can only view (handled by get_queryset)
        return False