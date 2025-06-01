import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { JSX } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Создаем тип для ключей разрешений
export type PermissionKey = 
  | 'can_edit'
  | 'can_delete'
  | 'can_moderate'
  | 'bypass_tag_restrictions';

export function RoleBasedRoute({ 
  children,
  requiredPermissions = [],
}: {
  children: JSX.Element;
  requiredPermissions?: PermissionKey[];
}) {
  const { permissions, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner/>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Проверка разрешений
  if (requiredPermissions.length > 0 && permissions) {
    const hasPermission = requiredPermissions.every(perm => {
      return permissions[perm];
    });
    
    if (!hasPermission) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children;
}