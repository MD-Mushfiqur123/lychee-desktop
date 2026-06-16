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
        <h1 className="studio-title">Pipeline Builder</h1>
        <span className="studio-subtitle">
          {stages.length} stage{stages.length !== 1 ? 's' : ''} — chain LLMs
          together for multi-step reasoning
        </span>
      </header>

      {/* Main grid: sidebar + canvas */}
      <div className="studio-main">
        {/* Left Sidebar — Model Library */}
        <aside className="studio-sidebar">
          <h3 className="sidebar-title">Models</h3>
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
              <div className="empty-icon">&#128230;</div>
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
            <h3 className="output-title">Final Output</h3>
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
            <h3 className="output-title" style={{ color: 'var(--danger)' }}>
              Pipeline Error
            </h3>
          </div>
          <pre className="output-content" style={{ color: 'var(--danger)' }}>
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
              <span className="spinner" /> Running...
            </>
          ) : (
            'Run Pipeline'
          )}
        </button>
        <button
          className="toolbar-btn"
          onClick={handleSave}
          disabled={isRunning || stages.length === 0}
        >
          Save
        </button>
        <button
          className="toolbar-btn toolbar-btn-danger"
          onClick={clearPipeline}
          disabled={isRunning}
        >
          Clear
        </button>
        <span className="toolbar-hint">Ctrl+Enter to run</span>
      </footer>
    </div>
  );
}
