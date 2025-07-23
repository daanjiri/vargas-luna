'use client';

import React from 'react';
import { useAuth } from '@/components/auth-provider';
import { Lock, Loader2 } from 'lucide-react';

interface ProtectedWrapperProps {
  children: React.ReactNode;
}

export function ProtectedWrapper({ children }: ProtectedWrapperProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative w-full h-full min-h-screen">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[5] flex items-center justify-center pointer-events-auto">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative w-full h-full min-h-screen">
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
      </div>
    );
  }

  return <>{children}</>;
} 