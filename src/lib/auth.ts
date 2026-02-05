import { supabase } from "@/integrations/supabase/client";

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/student`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }

  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }

  return data;
};

export const signUpWithEmail = async (email: string, password: string, metadata: { full_name?: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }

  return data;
};

export const signOut = async () => {
  try {
    // Delete FCM tokens before signing out
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id);
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear session storage
    }
  } catch (e) {
    console.error('Sign out exception:', e);
  }
  
  // Always clear session storage to ensure clean logout
  sessionStorage.clear();
  
  // Force a page reload to ensure complete cleanup
  setTimeout(() => {
    window.location.href = '/';
  }, 300);
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  return session.user;
};
