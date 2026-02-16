import { supabase } from "@/integrations/supabase/client";
import { logSuccessfulLogin, logFailedLogin, logAdminAction } from "@/lib/auditLog";

export const signInWithGoogle = async () => {
  try {
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
      await logFailedLogin('', `Google OAuth error: ${error.message}`);
      throw error;
    }

    // Log successful Google OAuth login
    await logSuccessfulLogin('google');
    return data;
  } catch (error: any) {
    await logFailedLogin('', error.message || 'Google OAuth failed');
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      await logFailedLogin(email, error.message);
      throw error;
    }

    // Log successful login
    await logSuccessfulLogin('email');
    return data;
  } catch (error: any) {
    await logFailedLogin(email, error.message || 'Sign in failed');
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, metadata: { full_name?: string }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      await logFailedLogin(email, `Sign up failed: ${error.message}`);
      throw error;
    }

    // Log account creation
    const userId = data.user?.id;
    if (userId) {
      await logAdminAction('ACCOUNT_CREATE', 'users', userId, {
        email,
        signupMethod: 'email',
        metadata,
      });
    }

    return data;
  } catch (error: any) {
    await logFailedLogin(email, error.message || 'Sign up failed');
    throw error;
  }
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

      // Log logout
      await logAdminAction('LOGOUT', 'auth', user.id);
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
