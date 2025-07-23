'use client';

import React from 'react';
import { useAuth } from '@/components/auth-provider';
import { Lock } from 'lucide-react';

interface ProtectedWrapperProps {
  children: React.ReactNode;
}

export function ProtectedWrapper({ children }: ProtectedWrapperProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[5] flex items-center justify-center pointer-events-auto">
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            </div>
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[5] flex items-center justify-center pointer-events-auto">
          <div className="text-center space-y-4 p-8 bg-card rounded-lg shadow-lg border">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Sign In Required</h2>
            <p className="text-muted-foreground max-w-sm">
              Please sign in to create and edit exhibit documentation
            </p>
            <p className="text-sm text-muted-foreground">
              Use the Sign In button in the top right corner
            </p>
          </div>
        </div>
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 