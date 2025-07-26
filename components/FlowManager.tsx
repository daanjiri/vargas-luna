'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useExhibitStore } from '@/lib/store';
import { useAuth } from '@/components/auth-provider';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';

interface FlowManagerProps {
  children: React.ReactNode;
}

export const FlowManager: React.FC<FlowManagerProps> = ({ children }) => {
  const { user } = useAuth();
  const { currentFlow } = useExhibitStore();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Flow Controls - positioned next to Add Node button */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
        {/* Back to Events Button */}
        <Link href="/my-events">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        {/* Add Node Button - keeping the original position */}
        <Button
          onClick={() => {
            // This will trigger the same functionality as the original Add Node button
            const event = new CustomEvent('addNodeClick');
            window.dispatchEvent(event);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Node
        </Button>

        {/* Flow Info */}
        {currentFlow && (
          <div className="flex items-center gap-2 bg-white/90 dark:bg-black/90 backdrop-blur rounded-lg px-3 py-2 shadow-sm border text-sm">
            <span className="font-medium">{currentFlow.title}</span>
            {currentFlow.is_saving && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                <span className="text-blue-600 text-xs">Saving...</span>
              </>
            )}
            {currentFlow.last_saved && !currentFlow.is_saving && (
              <span className="text-green-600 text-xs">
                Saved {new Date(currentFlow.last_saved).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}; 