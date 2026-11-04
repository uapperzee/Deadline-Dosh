import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase.js';
import { authService } from '../services/authService.js';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  // Check for existing localStorage data
  const checkLocalStorageData = () => {
    try {
      const raw = localStorage.getItem('dd_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        const hasItems = (parsed.tasks && parsed.tasks.length > 0) ||
                         (parsed.subjects && parsed.subjects.length > 0) ||
                         (parsed.sessions && parsed.sessions.length > 0);
        const alreadyMigrated = localStorage.getItem('dd_migrated_to_cloud');
        if (hasItems && !alreadyMigrated) {
          setHasLocalData(true);
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  };

  // Fetch full user profile from backend
  const fetchProfile = async (accessToken) => {
    try {
      const res = await api.get('/api/profile');
      if (res.success && res.data) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.warn('[AuthContext] Could not load profile:', err.message);
    }
  };

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);

      if (initialSession?.user) {
        fetchProfile(initialSession.access_token);
        if (checkLocalStorageData()) {
          setShowMigrationModal(true);
        }
      }
      setLoading(false);
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        await fetchProfile(newSession.access_token);
        if (checkLocalStorageData()) {
          setShowMigrationModal(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const data = await authService.signIn({ email, password });
    return data;
  };

  const signUp = async (payload) => {
    const data = await authService.signUp(payload);
    return data;
  };

  const signInWithGoogle = async () => {
    return await authService.signInWithGoogle();
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfileData = (updated) => {
    setProfile(prev => ({ ...prev, ...updated }));
  };

  const dismissMigration = (markMigrated = false) => {
    setShowMigrationModal(false);
    if (markMigrated) {
      localStorage.setItem('dd_migrated_to_cloud', 'true');
      setHasLocalData(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    hasLocalData,
    showMigrationModal,
    setShowMigrationModal,
    dismissMigration,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfileData,
    refreshProfile: () => session && fetchProfile(session.access_token)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
