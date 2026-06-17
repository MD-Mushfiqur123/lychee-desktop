import { type AuthProvider, type AuthUser } from '../useauth';

interface LoginProps {
  onLogin: (provider: AuthProvider) => Promise<AuthUser | undefined>;
  loading: boolean;
  error: string | null;
}

const PROVIDER_INFO: Record<
  AuthProvider,
  { label: string; icon: JSX.Element; color: string }
> = {
  google: {
    label: 'Continue with Google',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
          fill="#EA4335"
        />
      </svg>
    ),
    color: '#4285F4',
  },
  microsoft: {
    label: 'Continue with Microsoft',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" rx="1.5" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" rx="1.5" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" rx="1.5" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" rx="1.5" />
      </svg>
    ),
    color: '#00A4EF',
  },
  github: {
    label: 'Continue with GitHub',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
      </svg>
    ),
    color: '#24292f',
  },
};

export default function Login({ onLogin, loading, error }: LoginProps) {
  const handleClick = async (provider: AuthProvider) => {
    if (loading) return;
    await onLogin(provider);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="login-title">Welcome to Lychee</h1>
          <p className="login-subtitle">Sign in to continue with your account</p>
        </div>

        {error && (
          <div className="login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="login-buttons">
          {(Object.keys(PROVIDER_INFO) as AuthProvider[]).map((provider) => {
            const info = PROVIDER_INFO[provider];
            return (
              <button
                key={provider}
                className={`login-btn login-btn-${provider}`}
                onClick={() => handleClick(provider)}
                disabled={loading}
                title={`Sign in with ${info.label}`}
              >
                <span className="login-btn-icon">{info.icon}</span>
                <span className="login-btn-label">{info.label}</span>
                {loading && <span className="spinner login-spinner" />}
              </button>
            );
          })}
        </div>

        <p className="login-footer-text">
          Your credentials are handled securely via OAuth.
          <br />
          We never see your password.
        </p>
      </div>
    </div>
  );
}

/* ---- User Info Panel (shown after login, in App header area) ---- */
interface UserInfoProps {
  user: AuthUser;
  onLogout: () => void;
}

export function UserInfo({ user, onLogout }: UserInfoProps) {
  return (
    <div className="user-info">
      <div className="user-info-main">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="user-avatar"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="user-avatar user-avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="user-details">
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>
      <button className="user-logout-btn" onClick={onLogout} title="Sign out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  );
}
