"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import {
  getSupabase,
  isSupabaseConfigured,
  pullUserDataFromCloud,
} from "@/lib/supabase";
import { hydrateLocalCache, clearLocalData } from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: string | null }>;
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
  verifyEmailCode: async () => ({ error: "Not initialized" }),
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
          jobs: cloudData.jobs,
          invoices: cloudData.invoices,
        });
      }
    } catch (err) {
      console.warn("Failed to synchronize cloud data on auth:", err);
    }
  }, [configured]);

  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!configured) return;

    const sb = getSupabase();
    if (!sb) return;

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      const userId = newSession?.user?.id ?? null;
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && userId) {
        if (syncedUserId.current !== userId) {
          syncedUserId.current = userId;
          // Do not await Supabase calls inside this callback.
          window.setTimeout(() => {
            void syncFromCloud();
          }, 0);
        }
      } else if (event === "SIGNED_OUT") {
        syncedUserId.current = null;
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

    const { error } = await sb.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const verifyEmailCode = async (email: string, code: string): Promise<{ error: string | null }> => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase authentication is not configured in this environment." };

    const token = code.replace(/\D/g, "");
    if (token.length !== 6) return { error: "Enter the 6-digit code from the email." };

    const { error } = await sb.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
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
    clearLocalData();
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
        verifyEmailCode,
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
