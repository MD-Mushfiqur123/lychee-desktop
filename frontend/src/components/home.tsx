import { useEffect, useState, useCallback } from 'react';
import type { TabId } from './Layout';

interface HomeProps {
  onNavigate: (tab: TabId) => void;
}

interface Stats {
  installedModels: number;
  lycheeRunning: boolean;
  lycheeVersion: string;
}

async function callBackend(method: string, ...args: any[]): Promise<any> {
  try {
    const w = window as any;
    if (w['go']?.main?.App?.[method]) {
      return await w['go']['main']['App'][method](...args);
    }
  } catch {
    // Not running inside Wails
  }
  return null;
}

export default function Home({ onNavigate }: HomeProps) {
  const [stats, setStats] = useState<Stats>({
    installedModels: 0,
    lycheeRunning: false,
    lycheeVersion: '--',
  });
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      // Check Lychee status
      const res = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        setStats((s) => ({
          ...s,
          installedModels: models.length,
          lycheeRunning: true,
        }));
      }
    } catch {
      setStats((s) => ({ ...s, lycheeRunning: false }));
    }

    // Try to get version
    try {
      const verRes = await fetch('http://localhost:11434/api/version', {
        signal: AbortSignal.timeout(2000),
      });
      if (verRes.ok) {
        const verData = await verRes.json();
        setStats((s) => ({ ...s, lycheeVersion: verData.version || 'unknown' }));
      }
    } catch {
      // version endpoint may not exist
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleStartLychee = useCallback(async () => {
    setStarting(true);
    try {
      const result = await callBackend('AutoStartLychee');
      if (result) {
        console.log('[lychee-desktop]', result);
      } else {
        await callBackend('StartLychee', 'lychee');
      }
      // Wait for server to come up then refresh stats
      await new Promise((r) => setTimeout(r, 3000));
      await loadStats();
    } catch {
      // ignore
    } finally {
      setStarting(false);
    }
  }, [loadStats]);

  return (
    <div className="home">
      <div className="home-header">
        <div className="home-brand">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
          </svg>
          <h1 className="home-title">Lychee Desktop</h1>
        </div>
        <p className="home-subtitle">Local AI, always available.</p>
      </div>

      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-value">
            {loading ? '...' : stats.installedModels}
          </div>
          <div className="stat-label">Installed Models</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {loading ? '...' : stats.lycheeVersion}
          </div>
          <div className="stat-label">Lychee Version</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            <span className={`status-dot ${stats.lycheeRunning ? 'status-running' : 'status-stopped'}`} />
            {loading ? '...' : stats.lycheeRunning ? 'Running' : 'Stopped'}
          </div>
          <div className="stat-label">Server Status</div>
        </div>
      </div>

      {!loading && !stats.lycheeRunning && (
        <div className="home-start-section">
          <p className="home-start-hint">
            Lychee server is not running. Start it to use Chat, Models, and Studio.
          </p>
          <button
            className="action-btn action-btn-primary"
            onClick={handleStartLychee}
            disabled={starting}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {starting ? 'Starting Lychee...' : 'Start Lychee'}
          </button>
        </div>
      )}

      <div className="home-actions">
        <button className="action-btn" onClick={() => onNavigate('chat')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Start Chat
        </button>
        <button className="action-btn" onClick={() => onNavigate('models')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          Pull Model
        </button>
        <button className="action-btn" onClick={() => onNavigate('studio')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Open Studio
        </button>
      </div>
    </div>
  );
}
