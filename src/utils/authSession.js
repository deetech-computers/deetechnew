// utils/authSession.js
import { supabase } from '../config/supabase';

/**
 * Get current session and user info
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Error fetching session:', error.message);
    return null;
  }

  if (session) {
    console.log('✅ Active session found:', session.user.email);
    return session;
  } else {
    console.log('ℹ️ No active session found');
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const subscribeAuthChanges = (callback) => {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`🔄 Auth event: ${event}`, session);
    callback(event, session);
  });

  return () => {
    listener.subscription.unsubscribe();
  };
};
