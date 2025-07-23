'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to sync user to DynamoDB
  const syncUserToDynamoDB = async (user: User) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('User synced to DynamoDB successfully');
        } else {
          console.error('Failed to sync user to DynamoDB');
        }
      }
    } catch (error) {
      console.error('Error syncing user to DynamoDB:', error);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        setUser(user);
        
        // Sync user to DynamoDB if they exist and not already initialized
        if (user && !isInitialized) {
          await syncUserToDynamoDB(user);
        }
        
        setLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      
      // Only update if the user actually changed
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setUser(user);
        
        // Sync user to DynamoDB on sign in
        if (event === 'SIGNED_IN' && user) {
          await syncUserToDynamoDB(user);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isInitialized]);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export useUser as an alias for useAuth to maintain compatibility
export const useUser = useAuth; 