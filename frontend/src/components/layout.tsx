import { ReactNode } from 'react';
import StatusBar from './StatusBar';
import { UserInfo } from './login';
import type { AuthUser } from '../useauth';

export type TabId = 'home' | 'chat' | 'studio' | 'models' | 'settings';

interface TabDef {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const tabs: TabDef[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
  },
  {
    id: 'studio',
    label: 'Studio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0l-1.4 1.4 3 3 1.4-1.4z" />
        <path d="M3.5 19.5L9 14" />
        <path d="M12 2l2.5 2.5" />
        <path d="M19 9l-3-3" />
        <path d="M22 12l-2.5-2.5" />
        <path d="M12 22l-2.5-2.5" />
        <path d="M5 15l3 3" />
      </svg>
    ),
  },
  {
    id: 'models',
    label: 'Models',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onShowShortcuts?: () => void;
  children: ReactNode;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export default function Layout({
  activeTab,
  onTabChange,
  onShowShortcuts,
  children,
  user,
  onLogout,
}: LayoutProps) {
  return (
    <div className="layout">
      {/* Desktop Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
          </svg>
        </div>

        <div className="sidebar-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-label={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          {user && onLogout && (
            <div className="sidebar-user">
              <UserInfo user={user} onLogout={onLogout} />
            </div>
          )}
          {onShowShortcuts && (
            <button
              className="sidebar-help-btn"
              onClick={onShowShortcuts}
              title="Keyboard Shortcuts (?)"
              aria-label="Keyboard Shortcuts"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          )}
          <div className="sidebar-version">v0.1</div>
        </div>
      </nav>

      {/* Main Content + StatusBar */}
      <main className="main-content">
        <div className="main-content-inner tab-content" key={activeTab}>
          {children}
        </div>
        <StatusBar />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="bottom-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`bottom-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
