'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  login: (session?: Session | null) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const setData = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        const user = data?.user;

        if (error) {
          setUser(null);
          setSession(null);
        } else if (user) {
          setUser(user);

          const { data: sessionData } = await supabase.auth.getSession();
          setSession(sessionData?.session ?? null);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (e) {
        console.error('Unexpected error in AuthProvider:', e);
      } finally {
        setLoading(false);
      }
    };

    const authStateListener = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const subscription = authStateListener.data.subscription;

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const login = async (newSession?: Session | null) => {
    setLoading(true);
    try {
      if (newSession) {
        const { data, error } = await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        });
        
        if (error) {
          console.error('AuthContext: Error setting session:', error.message);
        } else {
          setUser(data.user);
          setSession(data.session);
          return;
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      setUser(userData?.user ?? null);
      setSession(sessionData?.session ?? null);
    } catch (e) {
      console.error('Error in login refresh:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error) {
      setUser(user);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Error signing out');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInWithGoogle, login, refreshUser }}>
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
}
