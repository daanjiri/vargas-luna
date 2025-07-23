'use client';

import { ExhibitFlow } from '@/components/ExhibitFlow';
import { FlowManager } from '@/components/FlowManager';
import { ProtectedWrapper } from '@/components/auth/protected-wrapper';
import { AuthButton } from '@/components/auth/auth-button';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useExhibitStore } from '@/lib/store';
import { useUser } from '@/components/user-context';

export default function FlowPage() {
  const params = useParams();
  const flowId = params.flowId as string;
  const { user } = useUser();
  const { currentFlow, loadFlow, createNewFlow } = useExhibitStore();

  useEffect(() => {
    if (user && flowId) {
      if (!currentFlow || currentFlow.flow_id !== flowId) {
        // Load specific flow
        loadFlow(flowId).catch((error) => {
          console.error('Failed to load flow:', error);
          // If flow doesn't exist, create a default one
          createNewFlow('Untitled Exhibit Flow', 'A new art exhibit documentation flow');
        });
      }
    }
  }, [user, flowId, currentFlow, loadFlow, createNewFlow]);

  return (
    <main className="w-full h-screen overflow-hidden">
      {/* Auth controls - always visible */}
      <AuthButton />
      
      {/* Protected content */}
      <ProtectedWrapper>
        <FlowManager>
          <ExhibitFlow />
        </FlowManager>
      </ProtectedWrapper>
    </main>
  );
} 