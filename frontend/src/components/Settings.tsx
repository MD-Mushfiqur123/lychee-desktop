import { useEffect, useState, useCallback } from 'react';

interface SystemInfo {
  platform: string;
  arch: string;
  cpus: number;
  memory: string;
}

export default function Settings() {
  const [binaryPath, setBinaryPath] = useState('lychee');
  const [port, setPort] = useState('11434');
  const [backend, setBackend] = useState('llama.cpp');
  const [lycheeRunning, setLycheeRunning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [startStopLoading, setStartStopLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [sysInfo, setSysInfo] = useState<SystemInfo>({
    platform: '--',
    arch: '--',
    cpus: 0,
    memory: '--',
  });

  const checkStatus = useCallback(async () => {
    setChecking(true);
    setStatusError(null);
    try {
      const res = await fetch(`http://localhost:${port}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      setLycheeRunning(res.ok);
      if (!res.ok) {
        setStatusError(`Server returned HTTP ${res.status}`);
      }
    } catch {
      setLycheeRunning(false);
      setStatusError('Connection refused - server may not be running');
    } finally {
      setChecking(false);
    }
  }, [port]);

  // Load system info
  useEffect(() => {
    const nav = navigator as any;
    setSysInfo({
      platform: nav.platform || 'unknown',
      arch: nav.userAgentData?.platform || 'unknown',
      cpus: nav.hardwareConcurrency || 0,
      memory: nav.deviceMemory
        ? `${nav.deviceMemory} GB`
        : 'unknown',
    });

    checkStatus();
  }, [checkStatus]);

  const handleStartStop = async () => {
    setStartStopLoading(true);
    try {
      if (lycheeRunning) {
        // Stop — Lychee process management via Go backend
        // so this would typically invoke a Wails Go backend function.
        // For now, simulate and re-check.
        setLycheeRunning(false);
        setStatusError(null);
      } else {
        // Start - also would go through Go backend
        setLycheeRunning(true);
        setStatusError(null);
      }
    } finally {
      setStartStopLoading(false);
    }
  };

  const handleSave = () => {
    // Persist settings (via Wails Go backend in production)
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-subtitle">Configure Lychee Desktop</p>
      </div>

      <div className="settings-grid">
        {/* Status */}
        <div className="settings-section">
          <h3 className="section-title">Server Status</h3>
          <div className="settings-card">
            <div className="status-row">
              <div className="status-indicator">
                <span
                  className={`status-dot-lg ${lycheeRunning ? 'status-running' : 'status-stopped'}`}
                />
                <div>
                  <div className="status-text">
                    {lycheeRunning ? 'Running' : 'Stopped'}
                  </div>
                  {statusError && (
                    <div className="status-error-text">{statusError}</div>
                  )}
                </div>
              </div>
              <div className="status-actions">
                <button
                  className="mm-btn mm-btn-primary"
                  onClick={checkStatus}
                  disabled={checking}
                >
                  {checking ? 'Checking...' : 'Refresh'}
                </button>
                <button
                  className={`mm-btn ${lycheeRunning ? 'mm-btn-danger' : 'mm-btn-primary'}`}
                  onClick={handleStartStop}
                  disabled={startStopLoading}
                >
                  {startStopLoading
                    ? 'Working...'
                    : lycheeRunning
                      ? 'Stop'
                      : 'Start'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Binary Path */}
        <div className="settings-section">
          <h3 className="section-title">Lychee Binary</h3>
          <div className="settings-card">
            <label className="settings-label">Binary Path</label>
            <input
              type="text"
              className="mm-input"
              value={binaryPath}
              onChange={(e) => setBinaryPath(e.target.value)}
              placeholder="Path to lychee binary"
            />
            <span className="settings-hint">
              Full path to the Lychee engine executable
            </span>
          </div>
        </div>

        {/* Backend */}
        <div className="settings-section">
          <h3 className="section-title">Backend</h3>
          <div className="settings-card">
            <label className="settings-label">Backend Engine</label>
            <select
              className="mm-select"
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
            >
              <option value="llama.cpp">llama.cpp</option>
              <option value="mlx">MLX (Apple Silicon)</option>
              <option value="cuda">CUDA (NVIDIA GPU)</option>
              <option value="rocm">ROCm (AMD GPU)</option>
              <option value="vulkan">Vulkan</option>
            </select>
            <span className="settings-hint">
              Select the inference backend. MLX requires Apple Silicon.
            </span>
          </div>
        </div>

        {/* Port */}
        <div className="settings-section">
          <h3 className="section-title">Connection</h3>
          <div className="settings-card">
            <label className="settings-label">API Port</label>
            <input
              type="text"
              className="mm-input"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="11434"
            />
            <span className="settings-hint">
              Port the Lychee API listens on (default: 11434)
            </span>
          </div>
        </div>

        {/* System Info */}
        <div className="settings-section">
          <h3 className="section-title">System</h3>
          <div className="settings-card">
            <div className="sysinfo-grid">
              <div className="sysinfo-item">
                <span className="sysinfo-label">Platform</span>
                <span className="sysinfo-value">{sysInfo.platform}</span>
              </div>
              <div className="sysinfo-item">
                <span className="sysinfo-label">Architecture</span>
                <span className="sysinfo-value">{sysInfo.arch}</span>
              </div>
              <div className="sysinfo-item">
                <span className="sysinfo-label">CPU Cores</span>
                <span className="sysinfo-value">{sysInfo.cpus}</span>
              </div>
              <div className="sysinfo-item">
                <span className="sysinfo-label">Memory</span>
                <span className="sysinfo-value">{sysInfo.memory}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="settings-section">
          <button className="mm-btn mm-btn-primary mm-btn-wide" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
