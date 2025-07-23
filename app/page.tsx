import { ExhibitFlow } from '@/components/ExhibitFlow';
import { ProtectedWrapper } from '@/components/auth/protected-wrapper';
import { AuthButton } from '@/components/auth/auth-button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      {/* Auth and Theme controls - always visible */}
      <AuthButton />
      <ThemeToggle />
      
      {/* Protected content */}
      <ProtectedWrapper>
        <ExhibitFlow />
      </ProtectedWrapper>
    </main>
  );
}
