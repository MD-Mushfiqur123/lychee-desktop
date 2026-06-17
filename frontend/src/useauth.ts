import { useState, useEffect, useCallback } from 'react';

export type AuthProvider = 'google' | 'microsoft' | 'github';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: AuthProvider;
}

const STORAGE_KEY = 'lychee-auth-user';

async function callBackend(method: string, ...args: any[]): Promise<any> {
  try {
    const w = window as any;
    if (w['go']?.main?.App?.[method]) {
      return await w['go']['main']['App'][method](...args);
    }
  } catch {
    // Not running inside Wails — that's fine
  }
  return null;
}

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed?.id && parsed?.email) {
        return parsed;
      }
    }
  } catch {
    // Corrupted data — clear it
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

function saveUserToStorage(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = user !== null;

  /**
   * Initiate OAuth login for the given provider.
   * Opens system browser via Wails backend.
   */
  const login = useCallback(async (provider: AuthProvider) => {
    setLoading(true);
    setError(null);

    try {
      // Try Wails backend first
      const result = await callBackend('Login', provider);
      if (result) {
        const userData = result as AuthUser;
        setUser(userData);
        saveUserToStorage(userData);
        return userData;
      }

      // Fallback: if no Wails backend, open browser directly
      // Construct OAuth URL based on provider
      const oauthUrls: Record<AuthProvider, string> = {
        google: 'https://accounts.google.com/o/oauth2/v2/auth',
        microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        github: 'https://github.com/login/oauth/authorize',
      };

      const redirectUri = encodeURIComponent(
        `http://localhost:34115/callback/${provider}`
      );

      // Build URL with common params — client IDs would be configured via env/settings
      // In production, the Wails backend handles the full flow
      const url = `${oauthUrls[provider]}?redirect_uri=${redirectUri}&response_type=code&scope=openid profile email`;

      window.open(url, '_blank');
    } catch (err: any) {
      setError(err?.message || `Failed to login with ${provider}`);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle OAuth callback data.
   * Called when the Wails backend sends user info back after OAuth completes.
   */
  const handleCallback = useCallback((userData: AuthUser) => {
    setUser(userData);
    saveUserToStorage(userData);
    setLoading(false);
    setError(null);
    return userData;
  }, []);

  /**
   * Parse OAuth callback from URL hash/fragment.
   * Useful when the OAuth redirects back to the app via URL.
   */
  const parseCallback = useCallback(() => {
    try {
      const hash = window.location.hash;
      if (!hash) return null;

      const params = new URLSearchParams(hash.replace('#', ''));
      const userJson = params.get('user');

      if (userJson) {
        const userData = JSON.parse(decodeURIComponent(userJson)) as AuthUser;
        handleCallback(userData);
        // Clear the hash so it doesn't re-trigger
        window.history.replaceState(null, '', window.location.pathname);
        return userData;
      }
    } catch {
      // Silently ignore malformed callbacks
    }
    return null;
  }, [handleCallback]);

  /**
   * Logout — clear stored user and optionally notify backend.
   */
  const logout = useCallback(async () => {
    setUser(null);
    saveUserToStorage(null);
    setError(null);

    try {
      await callBackend('Logout');
    } catch {
      // Silently ignore
    }
  }, []);

  // Try to parse callback on mount (in case the app was opened via OAuth redirect)
  useEffect(() => {
    parseCallback();
  }, [parseCallback]);

  return {
    user,
    loading,
    error,
    isLoggedIn,
    login,
    logout,
    handleCallback,
    parseCallback,
  } as const;
}
