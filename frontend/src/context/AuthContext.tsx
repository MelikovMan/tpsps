import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentUser } from '../api/auth';
import { useUserPermissions } from '../api/auth';
import { useLogout } from '../api/auth';
import { type UserResponse, type PermissionResponse } from '../api/types';

interface AuthContextType {
  user: UserResponse | null;
  permissions: PermissionResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { 
    data: user, 
    isLoading: userLoading, 
    isError: userError 
  } = useCurrentUser();
  
  const { 
    data: permissions, 
    isLoading: permLoading, 
    isError: permError 
  } = useUserPermissions();
  
  const { mutate: logoutMutation } = useLogout();

  const logout = () => {
    logoutMutation();
  };

  const isLoading = userLoading || permLoading;
  const isAuthenticated = !!user && !userError;
  
  const value = useMemo(() => ({
    user: user || null,
    permissions: permissions || null,
    isLoading,
    isAuthenticated,
    logout,
  }), [user, permissions, isLoading, isAuthenticated, logoutMutation]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}