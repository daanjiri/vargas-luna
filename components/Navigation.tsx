'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Workflow, Satellite } from 'lucide-react';
import { AuthButton } from '@/components/auth/auth-button';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Satellite className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
          </Link>
          
          <nav className="flex items-center gap-4">
            {user && (
              <Link
                href="/my-events"
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/my-events" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Workflow className="w-4 h-4" />
                My Events
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <AuthButton />
        </div>
      </div>
    </header>
  );
} 