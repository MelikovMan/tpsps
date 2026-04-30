// context/AuthContext.tsx
'use client';
import React, { createContext, useContext } from 'react';
import type { UserResponse, PermissionResponse } from '@/types';

interface AuthContextType {
  user: UserResponse | null;
  permissions: PermissionResponse | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: null,
  isAuthenticated: false,
});

export function AuthProvider({
  user,
  permissions,
  children,
}: {
  user: UserResponse | null;
  permissions: PermissionResponse | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated: !!user,
      }}
    >
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