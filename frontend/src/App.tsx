import { useState, useEffect } from 'react';
import Layout, { type TabId } from './components/Layout';
import Home from './components/Home';
import Chat from './components/Chat';
import Studio from './components/Studio';
import ModelManager from './components/ModelManager';
import Settings from './components/Settings';
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

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

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
        return <Settings />;
      default:
        return <Home onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
