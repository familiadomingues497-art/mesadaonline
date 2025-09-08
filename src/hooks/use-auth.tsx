import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'parent' | 'child';

export interface Profile {
  id: string;
  family_id: string;
  role: UserRole;
  display_name: string;
  phone?: string;
  created_at: string;
}

export interface Daughter {
  id: string;
  monthly_allowance_cents: number;
  rewards_enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  daughter: Daughter | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: UserRole, familyName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  createFamily: (familyName: string, parentDisplayName: string, phone?: string) => Promise<{ error: string | null; familyId?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [daughter, setDaughter] = useState<Daughter | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setProfile(null);
        return;
      }

      if (!profileData) {
        // No profile found - user needs to complete setup
        setProfile(null);
        setDaughter(null);
        return;
      }

      setProfile(profileData as Profile);

      // If user is a child, fetch daughter data
      if (profileData.role === 'child') {
        const { data: daughterData, error: daughterError } = await supabase
          .from('daughters')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!daughterError && daughterData) {
          setDaughter(daughterData);
        } else {
          setDaughter(null);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setDaughter(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setDaughter(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: UserRole, familyName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            role: role,
            family_name: familyName
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.session) {
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar sua conta.",
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Erro inesperado ao criar conta' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Erro inesperado ao fazer login' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setDaughter(null);
      
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const createFamily = async (familyName: string, parentDisplayName: string, phone?: string) => {
    try {
      const { data, error } = await supabase.rpc('create_family_and_parent', {
        family_name: familyName,
        parent_display_name: parentDisplayName,
        parent_phone: phone
      });

      if (error) {
        return { error: error.message };
      }

      // Refresh profile data
      if (user) {
        await fetchProfile(user.id);
      }

      return { error: null, familyId: data };
    } catch (error: any) {
      return { error: error.message || 'Erro ao criar família' };
    }
  };

  const value = {
    user,
    session,
    profile,
    daughter,
    loading,
    signUp,
    signIn,
    signOut,
    createFamily,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}