'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { useTheme } from '@/components/theme-provider';
import { AuthModal } from './auth-modal';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 right-4 z-10 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-gray-300 dark:border-white/10"
        disabled
      >
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="fixed top-4 right-4 z-10 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-gray-300 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20"
          >
            <User className="h-4 w-4 mr-2" />
            {user.email?.split('@')[0]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-gray-200 dark:border-gray-800">
          <DropdownMenuItem disabled className="text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
            {theme === 'light' ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAuthModalOpen(true)}
        className="fixed top-4 right-4 z-10 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-gray-300 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20"
      >
        Sign In
      </Button>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
} 