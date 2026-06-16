import { useEffect, useRef, useCallback, useState } from 'react';
import { usePipeline } from '../hooks/usePipeline';
import PipelineStage from './PipelineStage';

export default function Studio() {
  const pipeline = usePipeline();

  const {
    stages,
    isRunning,
    finalOutput,
    error,
    availableModels,
    modelError,
    addStage,
    removeStage,
    updateStage,
    runPipeline,
    clearPipeline,
    fetchModels,
  } = pipeline;

  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch available models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // ---- Drag-like model selection ----
  const [dragging, setDragging] = useState(false);
  const dragData = useRef<{ id: string; name: string } | null>(null);

  const handleModelDragStart = useCallback(
    (model: { id: string; name: string }) => (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', model.id);
      e.dataTransfer.effectAllowed = 'copy';
      dragData.current = model;
      setDragging(true);
    },
    []
  );

  const handleModelDragEnd = useCallback(() => {
    setDragging(false);
    dragData.current = null;
  }, []);

  const handleModelClick = useCallback(
    (model: { id: string; name: string }) => {
      addStage(model.id);
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.scrollTop = canvasRef.current.scrollHeight;
        }
      }, 50);
    },
    [addStage]
  );

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const modelId = e.dataTransfer.getData('text/plain');
      if (modelId) {
        addStage(modelId);
      }
      dragData.current = null;
    },
    [addStage]
  );

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ---- Pipeline actions ----

  const handleRun = useCallback(async () => {
    try {
      await runPipeline();
    } catch {
      // error already handled in hook
    }
  }, [runPipeline]);

  const handleSave = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ stages, timestamp: Date.now() }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lychee-pipeline-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning) handleRun();
      }
    },
    [isRunning, handleRun]
  );

  return (
    <div className="studio" onKeyDown={handleKeyDown}>
      {/* Header */}
      <header className="studio-header">
        <h1 className="studio-title">⚡ Pipeline Builder</h1>
        <span className="studio-subtitle">
          {stages.length} stage{stages.length !== 1 ? 's' : ''} — chain LLMs
          together for multi-step reasoning
        </span>
      </header>

      {/* Main grid: sidebar + canvas */}
      <div className="studio-main">
        {/* Left Sidebar — Model Library */}
        <aside className="studio-sidebar">
          <h3 className="sidebar-title">🧠 Models</h3>
          {modelError && (
            <div className="sidebar-error">Using fallback list: {modelError}</div>
          )}
          <div className="model-list">
            {availableModels.map((model) => (
              <div
                key={model.id}
                className="model-card"
                draggable
                onDragStart={handleModelDragStart(model)}
                onDragEnd={handleModelDragEnd}
                onClick={() => handleModelClick(model)}
                title={`Click to add ${model.name} pipeline stage`}
              >
                <div className="model-name">{model.name}</div>
                {model.provider && (
                  <div className="model-provider">{model.provider}</div>
                )}
              </div>
            ))}
          </div>
          <div className="sidebar-hint">
            Drag a model to the canvas or click to add a stage
          </div>
        </aside>

        {/* Center — Canvas drop zone */}
        <main
          ref={canvasRef}
          className={`studio-canvas ${dragging ? 'drag-over' : ''}`}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {stages.length === 0 ? (
            <div className="canvas-empty">
              <div className="empty-icon">📥</div>
              <p>Drop models here to build your pipeline</p>
              <p className="empty-hint">
                Or click a model from the sidebar to get started
              </p>
            </div>
          ) : (
            <div className="pipeline-flow">
              {stages.map((stage, idx) => (
                <PipelineStage
                  key={stage.id}
                  stage={stage}
                  index={idx}
                  total={stages.length}
                  models={availableModels}
                  disabled={isRunning}
                  onChange={updateStage}
                  onDelete={removeStage}
                />
              ))}
            </div>
          )}

          <button
            className="add-stage-btn"
            onClick={() => addStage()}
            disabled={isRunning}
            title="Add a new pipeline stage"
          >
            + Add Stage
          </button>
        </main>
      </div>

      {/* Output Panel */}
      {finalOutput && (
        <section className="studio-output">
          <div className="output-header">
            <h3 className="output-title">📤 Final Output</h3>
            <button
              className="output-copy-btn"
              onClick={() => navigator.clipboard.writeText(finalOutput)}
            >
              Copy
            </button>
          </div>
          <pre className="output-content">{finalOutput}</pre>
        </section>
      )}

      {error && (
        <section className="studio-error">
          <div className="output-header">
            <h3 className="output-title" style={{ color: '#ff6b6b' }}>
              ⚠️ Pipeline Error
            </h3>
          </div>
          <pre className="output-content" style={{ color: '#ff6b6b' }}>
            {error}
          </pre>
        </section>
      )}

      {/* Bottom Toolbar */}
      <footer className="studio-toolbar">
        <button
          className="toolbar-btn toolbar-btn-primary"
          onClick={handleRun}
          disabled={isRunning || stages.length === 0}
        >
          {isRunning ? (
            <>
              <span className="spinner" /> Running…
            </>
          ) : (
            '▶ Run Pipeline'
          )}
        </button>
        <button
          className="toolbar-btn"
          onClick={handleSave}
          disabled={isRunning || stages.length === 0}
        >
          💾 Save
        </button>
        <button
          className="toolbar-btn toolbar-btn-danger"
          onClick={clearPipeline}
          disabled={isRunning}
        >
          🗑 Clear
        </button>
        <span className="toolbar-hint">Ctrl+Enter to run</span>
      </footer>

      {/* Inline Styles */}
      <style>{`
        /* ===== LAYOUT ===== */
        .studio {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: rgba(27, 38, 54, 1);
          color: #e0e0e0;
          font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          overflow: hidden;
        }

        /* ---- Header ---- */
        .studio-header {
          padding: 16px 24px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .studio-title {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
          color: #fff;
        }
        .studio-subtitle {
          font-size: 0.8rem;
          color: #8892a4;
        }

        /* ---- Main Grid ---- */
        .studio-main {
          display: grid;
          grid-template-columns: 220px 1fr;
          flex: 1;
          min-height: 0;
        }

        /* ---- Sidebar ---- */
        .studio-sidebar {
          background: rgba(34, 46, 68, 1);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .sidebar-title {
          margin: 0 0 12px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #b0b8c8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sidebar-error {
          font-size: 0.7rem;
          color: #e8a838;
          margin-bottom: 10px;
          padding: 6px 8px;
          background: rgba(232, 168, 56, 0.1);
          border-radius: 4px;
        }
        .model-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .model-card {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          cursor: grab;
          transition: all 0.15s;
          user-select: none;
        }
        .model-card:hover {
          background: rgba(74, 158, 255, 0.12);
          border-color: rgba(74, 158, 255, 0.3);
        }
        .model-card:active {
          cursor: grabbing;
          transform: scale(0.97);
        }
        .model-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: #d0d8e0;
        }
        .model-provider {
          font-size: 0.65rem;
          color: #6b7a90;
          margin-top: 2px;
          text-transform: uppercase;
        }
        .sidebar-hint {
          margin-top: 16px;
          font-size: 0.68rem;
          color: #556070;
          text-align: center;
          line-height: 1.5;
        }

        /* ---- Canvas ---- */
        .studio-canvas {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(27, 38, 54, 1);
          transition: background 0.2s;
        }
        .studio-canvas.drag-over {
          background: rgba(74, 158, 255, 0.04);
          outline: 2px dashed rgba(74, 158, 255, 0.25);
          outline-offset: -8px;
        }
        .canvas-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: #556070;
          text-align: center;
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .canvas-empty p {
          margin: 4px 0;
          font-size: 0.9rem;
        }
        .empty-hint {
          font-size: 0.75rem !important;
          color: #3e4d60;
        }
        .pipeline-flow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          width: 100%;
          max-width: 600px;
        }

        /* ---- Stage Card ---- */
        .pipeline-stage {
          width: 100%;
          background: rgba(34, 46, 68, 1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .pipeline-stage.running {
          border-color: rgba(74, 158, 255, 0.5);
          box-shadow: 0 0 12px rgba(74, 158, 255, 0.15);
        }
        .pipeline-stage.done {
          border-color: rgba(76, 175, 80, 0.4);
        }
        .pipeline-stage.error {
          border-color: rgba(255, 107, 107, 0.5);
          box-shadow: 0 0 8px rgba(255, 107, 107, 0.1);
        }
        .stage-header {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          gap: 10px;
        }
        .stage-number {
          font-size: 0.75rem;
          font-weight: 600;
          color: #8892a4;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stage-status {
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
        }
        .status-icon {
          font-size: 0.85rem;
        }
        .status-idle {
          color: #6b7a90;
        }
        .status-running {
          color: #4a9eff;
        }
        .status-done {
          color: #4caf50;
        }
        .status-error {
          color: #ff6b6b;
        }
        .stage-delete-btn {
          margin-left: 8px;
          background: none;
          border: none;
          color: #6b7a90;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          border-radius: 3px;
          transition: all 0.15s;
        }
        .stage-delete-btn:hover {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
        }
        .stage-delete-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .stage-body {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .stage-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stage-field-row {
          flex-direction: row;
          gap: 14px;
        }
        .stage-field-half {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stage-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8892a4;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .stage-select,
        .stage-input,
        .stage-textarea {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          color: #d0d8e0;
          font-family: inherit;
          font-size: 0.82rem;
          padding: 8px 10px;
          transition: border-color 0.15s;
          outline: none;
        }
        .stage-select:focus,
        .stage-input:focus,
        .stage-textarea:focus {
          border-color: rgba(74, 158, 255, 0.5);
        }
        .stage-select:disabled,
        .stage-input:disabled,
        .stage-textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .stage-select {
          cursor: pointer;
        }
        .stage-textarea {
          resize: vertical;
          min-height: 56px;
        }
        .stage-range {
          accent-color: #4a9eff;
          cursor: pointer;
        }
        .stage-range:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .stage-input {
          width: 100%;
          box-sizing: border-box;
        }
        .stage-output {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 8px 10px;
          margin-top: 4px;
        }
        .stage-output-label {
          font-size: 0.68rem;
          font-weight: 600;
          color: #6b7a90;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .stage-output-text {
          margin: 0;
          font-size: 0.78rem;
          color: #b0b8c8;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 120px;
          overflow-y: auto;
          font-family: "Consolas", "Fira Code", monospace;
        }
        .stage-error-msg {
          font-size: 0.75rem;
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.08);
          padding: 6px 10px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stage-connector {
          display: flex;
          justify-content: center;
          padding: 2px 0;
        }

        /* ---- Add Stage Button ---- */
        .add-stage-btn {
          margin-top: 16px;
          padding: 10px 24px;
          background: rgba(74, 158, 255, 0.1);
          border: 1px dashed rgba(74, 158, 255, 0.3);
          border-radius: 8px;
          color: #4a9eff;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .add-stage-btn:hover {
          background: rgba(74, 158, 255, 0.18);
          border-color: rgba(74, 158, 255, 0.5);
        }
        .add-stage-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ---- Output Panel ---- */
        .studio-output,
        .studio-error {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          max-height: 180px;
          overflow-y: auto;
        }
        .output-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          background: rgba(34, 46, 68, 1);
        }
        .output-title {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: #4caf50;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .output-copy-btn {
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: #8892a4;
          font-family: inherit;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .output-copy-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #d0d8e0;
        }
        .output-content {
          margin: 0;
          padding: 12px 24px 16px;
          font-size: 0.8rem;
          color: #b0b8c8;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: "Consolas", "Fira Code", monospace;
          background: rgba(27, 38, 54, 1);
        }

        /* ---- Toolbar ---- */
        .studio-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(34, 46, 68, 1);
          flex-shrink: 0;
        }
        .toolbar-btn {
          padding: 8px 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #d0d8e0;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .toolbar-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }
        .toolbar-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .toolbar-btn-primary {
          background: rgba(74, 158, 255, 0.15);
          border-color: rgba(74, 158, 255, 0.3);
          color: #4a9eff;
          font-weight: 600;
        }
        .toolbar-btn-primary:hover:not(:disabled) {
          background: rgba(74, 158, 255, 0.25);
        }
        .toolbar-btn-danger {
          color: #ff6b6b;
        }
        .toolbar-btn-danger:hover:not(:disabled) {
          background: rgba(255, 107, 107, 0.1);
        }
        .toolbar-hint {
          margin-left: auto;
          font-size: 0.7rem;
          color: #556070;
        }

        /* ---- Spinner ---- */
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(74, 158, 255, 0.25);
          border-top-color: #4a9eff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
