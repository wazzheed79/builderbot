"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import {
  getSupabase,
  isSupabaseConfigured,
  pullUserDataFromCloud,
} from "@/lib/supabase";
import { hydrateLocalCache, loadDemoSampleData, clearLocalData } from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshCloudData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  isDemoMode: true,
  signInWithOtp: async () => ({ error: "Not initialized" }),
  signInWithPassword: async () => ({ error: "Not initialized" }),
  signUp: async () => ({ error: "Not initialized" }),
  signOut: async () => {},
  refreshCloudData: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(() => (isSupabaseConfigured() ? true : false));

  const syncFromCloud = useCallback(async () => {
    if (!configured) return;
    try {
      const cloudData = await pullUserDataFromCloud();
      if (cloudData) {
        hydrateLocalCache({
          profile: cloudData.profile,
          customers: cloudData.customers,
          quotes: cloudData.quotes,
        });
      }
    } catch (err) {
      console.warn("Failed to synchronize cloud data on auth:", err);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    const sb = getSupabase();
    if (!sb) return;

    // 1. Initial Session Check
    sb.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        syncFromCloud().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // 2. Auth State Listener
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN" && newSession?.user) {
        await syncFromCloud();
      } else if (event === "SIGNED_OUT") {
        clearLocalData();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, syncFromCloud]);

  const signInWithOtp = async (email: string): Promise<{ error: string | null }> => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase authentication is not configured in this environment." };

    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${siteUrl}/dashboard`,
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase authentication is not configured in this environment." };

    const { error } = await sb.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase authentication is not configured in this environment." };

    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await sb.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${siteUrl}/dashboard`,
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async (): Promise<void> => {
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
    }
    setUser(null);
    setSession(null);
    loadDemoSampleData();
  };

  const isDemoMode = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: configured,
        isDemoMode,
        signInWithOtp,
        signInWithPassword,
        signUp,
        signOut,
        refreshCloudData: syncFromCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
