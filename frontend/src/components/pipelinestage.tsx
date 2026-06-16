import { type PipelineStage as PipelineStageType, type StageStatus, type ModelInfo } from '../hooks/usePipeline';

interface PipelineStageProps {
  stage: PipelineStageType;
  index: number;
  total: number;
  models: ModelInfo[];
  disabled: boolean;
  onChange: (id: string, changes: Partial<PipelineStageType>) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<StageStatus, { label: string; className: string; icon: string }> = {
  idle: { label: 'Ready', className: 'status-idle', icon: '○' },
  running: { label: 'Running…', className: 'status-running', icon: '◉' },
  done: { label: 'Done', className: 'status-done', icon: '✓' },
  error: { label: 'Error', className: 'status-error', icon: '✗' },
};

export default function PipelineStage({
  stage,
  index,
  total,
  models,
  disabled,
  onChange,
  onDelete,
}: PipelineStageProps) {
  const status = statusConfig[stage.status];

  return (
    <div className={`pipeline-stage ${stage.status}`}>
      <div className="stage-header">
        <span className="stage-number">Stage {index + 1}</span>
        <span className={`stage-status ${status.className}`}>
          <span className="status-icon">{status.icon}</span>
          {status.label}
        </span>
        {!disabled && (
          <button
            className="stage-delete-btn"
            onClick={() => onDelete(stage.id)}
            title="Remove stage"
            disabled={disabled || total <= 1}
          >
            ×
          </button>
        )}
      </div>

      <div className="stage-body">
        <div className="stage-field">
          <label className="stage-label">Model</label>
          <select
            className="stage-select"
            value={stage.model}
            onChange={(e) => onChange(stage.id, { model: e.target.value })}
            disabled={disabled}
          >
            <option value="">-- Select model --</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="stage-field">
          <label className="stage-label">Prompt</label>
          <textarea
            className="stage-textarea"
            value={stage.prompt}
            onChange={(e) => onChange(stage.id, { prompt: e.target.value })}
            placeholder="System prompt for this stage…"
            rows={3}
            disabled={disabled}
          />
        </div>

        <div className="stage-field stage-field-row">
          <div className="stage-field-half">
            <label className="stage-label">Temperature: {stage.temperature}</label>
            <input
              type="range"
              className="stage-range"
              min="0"
              max="2"
              step="0.1"
              value={stage.temperature}
              onChange={(e) =>
                onChange(stage.id, { temperature: parseFloat(e.target.value) })
              }
              disabled={disabled}
            />
          </div>
          <div className="stage-field-half">
            <label className="stage-label">Max Tokens: {stage.maxTokens}</label>
            <input
              type="number"
              className="stage-input"
              min={1}
              max={32768}
              value={stage.maxTokens}
              onChange={(e) =>
                onChange(stage.id, { maxTokens: parseInt(e.target.value) || 2048 })
              }
              disabled={disabled}
            />
          </div>
        </div>

        {stage.output && (
          <div className="stage-output">
            <div className="stage-output-label">Output:</div>
            <pre className="stage-output-text">{stage.output}</pre>
          </div>
        )}

        {stage.error && (
          <div className="stage-error-msg">
            <span className="status-icon">✗</span> {stage.error}
          </div>
        )}
      </div>

      {/* Connector arrow between stages */}
      {index < total - 1 && (
        <div className="stage-connector">
          <svg width="24" height="32" viewBox="0 0 24 32">
            <line
              x1="12"
              y1="0"
              x2="12"
              y2="24"
              stroke="#4a9eff"
              strokeWidth="2"
              strokeDasharray={stage.status === 'running' ? '0' : '4,2'}
            />
            <polygon
              points="6,24 18,24 12,30"
              fill="#4a9eff"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
