import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseUser() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          // Don't throw an error if it's just missing session
          if (userError.name !== 'AuthSessionMissingError') {
            throw userError;
          }
          // For missing session, just return null data
          setUserData(null);
          setLoading(false);
          return;
        }

        if (user) {
          // Get additional user info from the users table
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.warn('Error fetching user profile:', profileError);
          }

          setUserData({
            ...user,
            profile: profileData || null
          });
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  return { userData, loading, error };
}