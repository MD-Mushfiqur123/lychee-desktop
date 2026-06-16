import { useState, useEffect } from 'react';

interface StatusBarProps {
  lycheeRunning?: boolean;
  modelCount?: number;
  version?: string;
}

export default function StatusBar({
  lycheeRunning: initialRunning,
  modelCount: initialCount,
  version: initialVersion,
}: StatusBarProps) {
  const [lycheeRunning, setLycheeRunning] = useState(initialRunning ?? false);
  const [modelCount, setModelCount] = useState(initialCount ?? 0);
  const [version, setVersion] = useState(initialVersion ?? 'v0.1');

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      // Check Lychee status
      try {
        const res = await fetch('http://localhost:11434/api/tags', {
          signal: AbortSignal.timeout(3000),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setModelCount((data.models || []).length);
          setLycheeRunning(true);
        }
      } catch {
        if (!cancelled) {
          setLycheeRunning(false);
          setModelCount(0);
        }
      }

      // Try version
      try {
        const verRes = await fetch('http://localhost:11434/api/version', {
          signal: AbortSignal.timeout(2000),
        });
        if (!cancelled && verRes.ok) {
          const verData = await verRes.json();
          setVersion(verData.version || 'unknown');
        }
      } catch {
        // version endpoint is optional
      }
    }

    // Use initial values if provided, otherwise fetch
    if (initialRunning !== undefined && initialCount !== undefined && initialVersion !== undefined) {
      setLycheeRunning(initialRunning);
      setModelCount(initialCount);
      setVersion(initialVersion);
    } else {
      checkStatus();
    }

    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [initialRunning, initialCount, initialVersion]);

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item">
          <span className={`statusbar-dot ${lycheeRunning ? 'running' : 'stopped'}`} />
          <span>{lycheeRunning ? 'Lychee Running' : 'Lychee Stopped'}</span>
        </div>
        <span className="statusbar-sep" />
        <div className="statusbar-item">
          <span>{modelCount} model{modelCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="statusbar-right">
        <div className="statusbar-item">
          <span>{version}</span>
        </div>
      </div>
    </div>
  );
}
