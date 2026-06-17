import { useState, useEffect, useCallback } from 'react';
import Layout, { type TabId } from './components/Layout';
import Home from './components/home';
import Chat from './components/chat';
import Studio from './components/Studio';
import ModelManager from './components/ModelManager';
import Settings from './components/Settings';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { useTheme } from './useTheme';
import './App.css';

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

const TAB_NUMBER_MAP: Record<string, TabId> = {
  '1': 'home',
  '2': 'chat',
  '3': 'studio',
  '4': 'models',
  '5': 'settings',
};

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { theme, setTheme, cycleTheme } = useTheme();

  // Auto-start Lychee on app startup
  useEffect(() => {
    async function autoStart() {
      try {
        const result = await callBackend('AutoStartLychee');
        if (result) {
          console.log('[lychee-desktop]', result);
        }
      } catch {
        // Silently ignore — the useLychee hook will handle UI-level retry
      }
    }
    autoStart();
  }, []);

  // Global keyboard shortcuts
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Ctrl+/ or ? — toggle keyboard shortcuts
      if ((ctrl && key === '/') || (!ctrl && !shift && key === '?')) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // Ctrl+Shift+T — cycle theme
      if (ctrl && shift && key === 't') {
        e.preventDefault();
        cycleTheme();
        return;
      }

      // Ctrl+1-5 — switch tabs
      if (ctrl && !shift && TAB_NUMBER_MAP[key]) {
        e.preventDefault();
        setActiveTab(TAB_NUMBER_MAP[key]);
        return;
      }

      // Ctrl+Shift+N — New chat
      if (ctrl && shift && key === 'n') {
        e.preventDefault();
        setActiveTab('chat');
        return;
      }

      // Escape — close modals
      if (key === 'escape') {
        if (shortcutsOpen) {
          e.preventDefault();
          setShortcutsOpen(false);
          return;
        }
      }
    },
    [cycleTheme, shortcutsOpen],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={setActiveTab} />;
      case 'chat':
        return <Chat />;
      case 'studio':
        return <Studio />;
      case 'models':
        return <ModelManager />;
      case 'settings':
        return <Settings theme={theme} onThemeChange={setTheme} />;
      default:
        return <Home onNavigate={setActiveTab} />;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onShowShortcuts={() => setShortcutsOpen(true)}
      >
        {renderContent()}
      </Layout>
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}

export default App;
