import { useEffect } from 'react';
import type { LycheeModel } from '../hooks/useLychee';

interface ModelSelectorProps {
  models: LycheeModel[];
  selectedModel: string;
  onSelect: (model: string) => void;
  loading: boolean;
  error: string | null;
  onFetch: () => void;
  lycheeStopped?: boolean;
  startingLychee?: boolean;
  onStartLychee?: () => void;
}

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function ModelSelector({
  models,
  selectedModel,
  onSelect,
  loading,
  error,
  onFetch,
  lycheeStopped,
  startingLychee,
  onStartLychee,
}: ModelSelectorProps) {
  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <div className="model-selector">
      <select
        value={selectedModel}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading || models.length === 0}
        className="model-select"
      >
        {loading ? (
          <option value="">Loading models...</option>
        ) : models.length === 0 ? (
          <option value="">No models found</option>
        ) : (
          models.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name} ({formatSize(m.size)})
            </option>
          ))
        )}
      </select>
      {error && (
        <div className="model-error-row">
          <span className="model-error">⚠ {error}</span>
          {lycheeStopped && onStartLychee && (
            <button
              className="mm-btn mm-btn-primary"
              onClick={onStartLychee}
              disabled={startingLychee}
              style={{ marginLeft: 8, whiteSpace: 'nowrap', padding: '4px 12px', fontSize: 12 }}
            >
              {startingLychee ? 'Starting...' : 'Start Lychee'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
