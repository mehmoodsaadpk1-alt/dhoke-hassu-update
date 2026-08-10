import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

interface AdminContextProps {
  isAdmin: boolean;
  loading: boolean;
}

const AdminContext = createContext<AdminContextProps>({ isAdmin: false, loading: true });

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async (userId?: string) => {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        let currentUserId = userId;
        if (!currentUserId) {
          const { data: { session } } = await supabase.auth.getSession();
          currentUserId = session?.user?.id;
        }

        if (!currentUserId) {
          if (isMounted) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase.rpc('is_admin');
        
        if (isMounted) {
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(!!data);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Exception checking admin status:', err);
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    let authListener: any = null;
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          checkAdmin(session.user.id);
        } else {
          if (isMounted) {
            setIsAdmin(false);
            setLoading(false);
          }
        }
      });
      authListener = subscription;
    }

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
