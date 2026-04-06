import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type AuthRole = 'parent' | 'educator' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: AuthRole;
  parent_id: string | null;
  school_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  notification_preferences: NotificationPreferences | null;
  created_at: string;
  updated_at?: string;
}

export interface NotificationPreferences {
  email_updates: boolean;
  learning_reports: boolean;
  safety_alerts: boolean;
  product_news: boolean;
}

export interface ChildAccount {
  id: string;
  parent_id: string;
  child_name: string;
  child_email: string | null;
  child_user_id: string | null;
  age: number | null;
  grade_level: string | null;
  interests: string[];
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  children: ChildAccount[];
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AuthRole, schoolName?: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null; success: boolean }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  createChildAccount: (childName: string, age: number, gradeLevel: string, interests: string[]) => Promise<{ error: string | null }>;
  updateChildAccount: (childId: string, updates: Partial<ChildAccount>) => Promise<{ error: string | null }>;
  deleteChildAccount: (childId: string) => Promise<{ error: string | null }>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------------------
// Translate raw Supabase / network errors into user-friendly messages
// ---------------------------------------------------------------------------
function friendlyError(raw?: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  const lower = raw.toLowerCase();

  // Network-level failures (invalid API key, no internet, CORS, etc.)
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }
  // Invalid API key (wrong anon key configured)
  if (lower.includes('invalid api key') || lower.includes('apikey')) {
    return 'Server configuration error. Please contact support.';
  }
  // Auth-specific
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your email and confirm your account before signing in.';
  }
  if (lower.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('password') && lower.includes('at least')) {
    return raw; // Already descriptive
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  // Fall through – return the original message
  return raw;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [childAccounts, setChildAccounts] = useState<ChildAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch error:', error);
        return null;
      }
      return data as UserProfile;
    } catch (err) {
      console.warn('Profile fetch failed:', err);
      return null;
    }
  }, []);

  const fetchChildren = useCallback(async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from('child_accounts')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setChildAccounts(data as ChildAccount[]);
      }
    } catch (err) {
      console.warn('Children fetch failed:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const p = await fetchProfile(user.id);
    if (p) {
      setProfile(p);
      if (p.role === 'parent') {
        await fetchChildren(p.id);
      }
    }
  }, [user?.id, fetchProfile, fetchChildren]);

  // Listen for auth state changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (p) {
            setProfile(p);
            if (p.role === 'parent') {
              await fetchChildren(p.id);
            }
          }
        }
      } catch (err) {
        console.warn('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setTimeout(async () => {
          const p = await fetchProfile(session.user.id);
          if (p) {
            setProfile(p);
            if (p.role === 'parent') {
              await fetchChildren(p.id);
            }
          }
          setIsLoading(false);
        }, 500);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setChildAccounts([]);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchChildren]);

  // -----------------------------------------------------------------------
  // Auth methods – no pre-flight guards; let Supabase respond naturally
  // -----------------------------------------------------------------------

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: AuthRole,
    schoolName?: string
  ): Promise<{ error: string | null; needsVerification: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            school_name: schoolName || null,
          },
        },
      });

      if (error) {
        return { error: friendlyError(error.message), needsVerification: false };
      }

      if (data.user && !data.session) {
        return { error: null, needsVerification: true };
      }

      if (data.session && data.user && schoolName && role === 'educator') {
        await supabase
          .from('profiles')
          .update({ school_name: schoolName })
          .eq('id', data.user.id);
      }

      return { error: null, needsVerification: false };
    } catch (err: any) {
      return { error: friendlyError(err?.message), needsVerification: false };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: friendlyError(error.message) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: friendlyError(err?.message) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setChildAccounts([]);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null; success: boolean }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { error: friendlyError(error.message), success: false };
      }

      return { error: null, success: true };
    } catch (err: any) {
      return { error: friendlyError(err?.message), success: false };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: string | null }> => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) return { error: error.message };

      await refreshProfile();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Update failed' };
    }
  };

  const createChildAccount = async (
    childName: string,
    age: number,
    gradeLevel: string,
    interests: string[]
  ): Promise<{ error: string | null }> => {
    if (!user?.id || profile?.role !== 'parent') {
      return { error: 'Only parents can create child accounts' };
    }

    try {
      const { error } = await supabase
        .from('child_accounts')
        .insert({
          parent_id: user.id,
          child_name: childName,
          age,
          grade_level: gradeLevel,
          interests,
        });

      if (error) return { error: error.message };

      await fetchChildren(user.id);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to create child account' };
    }
  };

  const updateChildAccount = async (
    childId: string,
    updates: Partial<ChildAccount>
  ): Promise<{ error: string | null }> => {
    if (!user?.id || profile?.role !== 'parent') {
      return { error: 'Only parents can update child accounts' };
    }

    try {
      const { error } = await supabase
        .from('child_accounts')
        .update({
          child_name: updates.child_name,
          age: updates.age,
          grade_level: updates.grade_level,
          interests: updates.interests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', childId)
        .eq('parent_id', user.id);

      if (error) return { error: error.message };

      await fetchChildren(user.id);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update child account' };
    }
  };

  const deleteChildAccount = async (childId: string): Promise<{ error: string | null }> => {
    if (!user?.id || profile?.role !== 'parent') {
      return { error: 'Only parents can delete child accounts' };
    }

    try {
      const { error } = await supabase
        .from('child_accounts')
        .delete()
        .eq('id', childId)
        .eq('parent_id', user.id);

      if (error) return { error: error.message };

      await fetchChildren(user.id);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to delete child account' };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Password change failed' };
    }
  };

  const deleteAccount = async (): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: {},
      });

      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };

      setUser(null);
      setProfile(null);
      setChildAccounts([]);

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Account deletion failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        children: childAccounts,
        isAuthenticated: !!user && !!profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        createChildAccount,
        updateChildAccount,
        deleteChildAccount,
        changePassword,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
