import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Account, authApi, Session, setUnauthorizedHandler, SignupPayload, UpdateProfilePayload } from './api';
import { clearSession, loadSession, saveSession } from './storage';

type AuthState = {
  session: Session | null;
  initializing: boolean;
  signIn: (username: string, password: string, rememberMe: boolean) => Promise<Session>;
  signUp: (payload: SignupPayload) => Promise<Session>;
  activate: (newPassword: string, confirmPassword: string) => Promise<Session>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<Account>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadSession().then((stored) => {
      setSession(stored);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setSession(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (username: string, password: string, rememberMe: boolean) => {
    const next = await authApi.login(username, password, rememberMe);
    await saveSession(next);
    setSession(next);
    return next;
  }, []);

  const signUp = useCallback(async (payload: SignupPayload) => {
    const next = await authApi.signup(payload);
    await saveSession(next);
    setSession(next);
    return next;
  }, []);

  const activate = useCallback(
    async (newPassword: string, confirmPassword: string) => {
      if (!session) {
        throw new Error('You are not signed in');
      }
      const next = await authApi.activate(newPassword, confirmPassword, session.accessToken);
      await saveSession(next);
      setSession(next);
      return next;
    },
    [session],
  );

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!session) {
        throw new Error('You are not signed in');
      }
      const account = await authApi.updateProfile(payload, session.accessToken);
      const next = { ...session, account };
      await saveSession(next);
      setSession(next);
      return account;
    },
    [session],
  );

  const signOut = useCallback(async () => {
    if (session) {
      try {
        await authApi.logout(session.refreshToken);
      } catch {
        setSession(null);
      }
    }
    await clearSession();
    setSession(null);
  }, [session]);

  const value = useMemo(
    () => ({ session, initializing, signIn, signUp, activate, updateProfile, signOut }),
    [session, initializing, signIn, signUp, activate, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
