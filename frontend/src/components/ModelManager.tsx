import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLychee, type LycheeModel } from '../hooks/uselychee';

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function ModelManager() {
  const { models, loadingModels, modelError, fetchModels, lycheeStopped, startingLychee, startLychee } = useLychee();

  const [search, setSearch] = useState('');
  const [pullName, setPullName] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const filteredModels = useMemo(() => {
    if (!search.trim()) return models;
    const q = search.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.details?.family?.toLowerCase().includes(q) ||
        m.details?.parameter_size?.toLowerCase().includes(q),
    );
  }, [models, search]);

  const handlePull = useCallback(async () => {
    const name = pullName.trim();
    if (!name) return;

    setPulling(true);
    setPullError(null);
    setPullStatus(`Pulling ${name}...`);

    try {
      const res = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stream: false }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text);
          errMsg = j.error || errMsg;
        } catch {
          errMsg = text || errMsg;
        }
        throw new Error(errMsg);
      }

      setPullStatus(`Successfully pulled ${name}`);
      setPullName('');
      fetchModels();
    } catch (err: any) {
      setPullError(err.message || 'Pull failed');
      setPullStatus(null);
    } finally {
      setPulling(false);
    }
  }, [pullName, fetchModels]);

  const handleDelete = useCallback(
    async (modelName: string) => {
      setDeleting(modelName);
      setDeleteError(null);

      try {
        const res = await fetch('http://localhost:11434/api/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: modelName }),
        });

        if (!res.ok) {
          const text = await res.text();
          let errMsg = `HTTP ${res.status}`;
          try {
            const j = JSON.parse(text);
            errMsg = j.error || errMsg;
          } catch {
            errMsg = text || errMsg;
          }
          throw new Error(errMsg);
        }

        fetchModels();
      } catch (err: any) {
        setDeleteError(err.message || 'Delete failed');
      } finally {
        setDeleting(null);
      }
    },
    [fetchModels],
  );

  return (
    <div className="model-manager">
      <div className="mm-header">
        <h2 className="mm-title">Model Manager</h2>
        <p className="mm-subtitle">Browse, pull, and manage your local models</p>
      </div>

      {/* Pull Section */}
      <div className="mm-pull-section">
        <div className="mm-pull-form">
          <input
            type="text"
            className="mm-input"
            placeholder="model name (e.g. llama3.2:1b)"
            value={pullName}
            onChange={(e) => setPullName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePull()}
            disabled={pulling}
          />
          <button
            className="mm-btn mm-btn-primary"
            onClick={handlePull}
            disabled={pulling || !pullName.trim()}
          >
            {pulling ? 'Pulling...' : 'Pull'}
          </button>
        </div>
        {pullStatus && <div className="mm-status success">{pullStatus}</div>}
        {pullError && <div className="mm-status error">{pullError}</div>}
      </div>

      {/* Search */}
      <div className="mm-search">
        <svg
          className="mm-search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="mm-input mm-search-input"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error */}
      {modelError && (
        <div className="mm-status error">
          {modelError}
          {lycheeStopped && (
            <button
              className="mm-btn mm-btn-primary"
              onClick={startLychee}
              disabled={startingLychee}
              style={{ marginLeft: 8, whiteSpace: 'nowrap' }}
            >
              {startingLychee ? 'Starting...' : 'Start Lychee'}
            </button>
          )}
        </div>
      )}
      {deleteError && <div className="mm-status error">{deleteError}</div>}

      {/* Model List */}
      <div className="mm-grid">
        {loadingModels && (
          <div className="mm-empty">
            <p>Loading models...</p>
          </div>
        )}

        {!loadingModels && filteredModels.length === 0 && (
          <div className="mm-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
            <p>{search ? 'No models match your search' : 'No models installed'}</p>
            <p className="mm-empty-hint">
              {search ? 'Try a different query' : 'Pull a model to get started'}
            </p>
          </div>
        )}

        {filteredModels.map((model) => (
          <ModelCard
            key={model.digest || model.name}
            model={model}
            onDelete={handleDelete}
            deleting={deleting === model.name}
          />
        ))}
      </div>
    </div>
  );
}

function ModelCard({
  model,
  onDelete,
  deleting,
}: {
  model: LycheeModel;
  onDelete: (name: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="mm-card">
      <div className="mm-card-header">
        <div className="mm-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
        </div>
        <h3 className="mm-card-name">{model.name}</h3>
      </div>

      <div className="mm-card-details">
        {model.details?.parameter_size && (
          <span className="mm-tag">{model.details.parameter_size}</span>
        )}
        {model.details?.quantization_level && (
          <span className="mm-tag">{model.details.quantization_level}</span>
        )}
        {model.details?.family && (
          <span className="mm-tag">{model.details.family}</span>
        )}
        {model.details?.format && (
          <span className="mm-tag">{model.details.format}</span>
        )}
      </div>

      <div className="mm-card-meta">
        <span className="mm-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {formatBytes(model.size)}
        </span>
        <span className="mm-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(model.modified_at)}
        </span>
      </div>

      <button
        className="mm-btn mm-btn-danger"
        onClick={() => onDelete(model.name)}
        disabled={deleting}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
