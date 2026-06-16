import { useState } from 'react';
import Layout, { type TabId } from './components/Layout';
import Home from './components/Home';
import Chat from './components/Chat';
import Studio from './components/Studio';
import ModelManager from './components/ModelManager';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

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
