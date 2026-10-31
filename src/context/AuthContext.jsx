import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { recordPortalEntryTime, detectClientIp } from '../utils/auditService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid, email) => {
    try {
      // 1. Master Admin Sync
      if (email === 'admin@princeton.com' || email === 'kabirhaldar4444@gmail.com') {
        const adminProfile = {
          id: uid,
          email: email,
          role: 'admin',
          full_name: email === 'kabirhaldar4444@gmail.com' ? 'Super Admin' : 'Master Admin',
          profile_completed: true
        };
        
        // Ensure profile exists in DB for RLS to work properly
        const { data: existingAdmin } = await supabase.from('profiles').select('id').eq('id', uid).single();
        if (!existingAdmin) {
          await supabase.from('profiles').insert(adminProfile);
        }

        setProfile(adminProfile);
        setLoading(false);
        return;
      }

      // 2. Standard Profile Fetch
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, address, state, city, role, profile_completed, disclaimer_accepted, allotted_exam_ids, is_exam_locked, can_register, ip_address')
        .eq('id', uid)
        .single();

      if (error || !data) {
        console.warn('Profile not found, signing out...');
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        throw new Error('Profile not found');
      }

      setProfile(data);

      // Auto-detect and sync candidate IP if missing from profile
      if (data && !data.ip_address) {
        detectClientIp().then(detectedIp => {
          if (detectedIp) {
            localStorage.setItem('candidate_kyc_ip', detectedIp);
            supabase.from('profiles').update({ ip_address: detectedIp }).eq('id', uid).then();
            setProfile(prev => prev ? { ...prev, ip_address: detectedIp } : prev);
          }
        }).catch(() => {});
      } else if (data?.ip_address) {
        localStorage.setItem('candidate_kyc_ip', data.ip_address);
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        recordPortalEntryTime(session.user.id);
        fetchProfile(session.user.id, session.user.email);
      } else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        recordPortalEntryTime(session.user.id);
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
