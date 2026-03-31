'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const setData = async () => {
      try {
        console.log('AuthProvider: Fetching initial user and session...');
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.log('AuthProvider: getUser error:', error.message);
          // If error is related to session not found, it's fine
          if (error.message.includes('Auth session missing')) {
            setUser(null);
            setSession(null);
          } else {
            console.error('Error fetching user:', error);
          }
        } else {
          console.log('AuthProvider: Initial user found:', user.email);
          setUser(user);
          // Get session for state consistency
          const { data: { session } } = await supabase.auth.getSession();
          console.log('AuthProvider: Initial session found:', !!session);
          setSession(session);
        }
      } catch (e) {
        console.error('Unexpected error in AuthProvider:', e);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: onAuthStateChange event:', event);
      console.log('AuthProvider: onAuthStateChange session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const login = async (newSession?: Session | null) => {
    setLoading(true);
    try {
      console.log('AuthContext: login() called, refreshing state...');
      
      if (newSession) {
        console.log('AuthContext: Establishing session from provided data...');
        const { data, error } = await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        });
        
        if (error) {
          console.error('AuthContext: Error setting session:', error.message);
        } else {
          console.log('AuthContext: Session established successfully');
          setUser(data.user);
          setSession(data.session);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthContext: login() refreshed user:', !!user);
      console.log('AuthContext: login() refreshed session:', !!session);
      setUser(user);
      setSession(session);
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
