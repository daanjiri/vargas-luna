'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Globe } from 'lucide-react';
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
          <Link href="/" className="text-xl font-semibold">
            Vargas Luna
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Globe className="w-4 h-4" />
              Public Events
            </Link>
            
            {user && (
              <Link
                href="/my-events"
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/my-events" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Home className="w-4 h-4" />
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