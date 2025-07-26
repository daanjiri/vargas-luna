'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      setMessage(`Session Error: ${error.message}`);
    } else {
      setMessage(`Session: ${session ? 'Active' : 'None'}`);
      setUser(session?.user || null);
    }
  };

  const testSignIn = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Success! User: ${data.user?.email}`);
        setUser(data.user);
      }
    } catch (err: any) {
      setMessage(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`Sign Out Error: ${error.message}`);
    } else {
      setMessage('Signed out successfully');
      setUser(null);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Auth Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={testSignIn} disabled={loading}>
              {loading ? 'Testing...' : 'Test Sign In'}
            </Button>
            <Button onClick={checkSession} variant="outline">
              Check Session
            </Button>
            <Button onClick={testSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
          
          {message && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              {message}
            </div>
          )}
          
          {user && (
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded text-sm">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 