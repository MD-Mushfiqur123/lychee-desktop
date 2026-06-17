import { useEffect, useRef, useCallback, useState } from 'react';
import { usePipeline } from '../hooks/usepipeline';
import PipelineStage from './PipelineStage';

// ---- Pipeline export format ----

interface PipelineExport {
  name: string;
  version: string;
  createdAt: string;
  stages: ReturnType<typeof usePipeline>['stages'];
}

const PIPELINE_VERSION = '1.0.0';
const PIPELINE_EXTENSION = '.lychee-pipeline';

function buildExportData(stages: ReturnType<typeof usePipeline>['stages']): PipelineExport {
  return {
    name: 'Lychee Pipeline',
    version: PIPELINE_VERSION,
    createdAt: new Date().toISOString(),
    stages,
  };
}

function pipelineToBase64(stages: ReturnType<typeof usePipeline>['stages']): string {
  const data = buildExportData(stages);
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

function base64ToPipeline(base64: string): PipelineExport | null {
  try {
    const json = decodeURIComponent(escape(atob(base64)));
    const data = JSON.parse(json) as PipelineExport;
    if (!data.stages || !Array.isArray(data.stages)) return null;
    return data;
  } catch {
    return null;
  }
}

// ---- Component ----

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
    loadPipeline,
    fetchModels,
  } = pipeline;

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Fetch available models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Load pipeline from URL ?pipeline=<base64> param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pipelineParam = params.get('pipeline');
    if (pipelineParam) {
      const data = base64ToPipeline(pipelineParam);
      if (data) {
        loadPipeline(data.stages);
        // Clean URL after loading
        const url = new URL(window.location.href);
        url.searchParams.delete('pipeline');
        window.history.replaceState({}, '', url.toString());
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Export: download pipeline as .lychee-pipeline JSON file
  const handleExport = useCallback(() => {
    const data = buildExportData(stages);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lychee-pipeline-${new Date().toISOString().slice(0, 10)}${PIPELINE_EXTENSION}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stages]);

  // Import: open file picker for .lychee-pipeline files
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as PipelineExport;
          if (data.stages && Array.isArray(data.stages) && data.stages.length > 0) {
            loadPipeline(data.stages);
          }
        } catch {
          // Invalid file
        }
      };
      reader.readAsText(file);
      // Reset input so the same file can be re-imported
      e.target.value = '';
    },
    [loadPipeline]
  );

  // Share: copy pipeline as base64 URL param
  const handleShare = useCallback(async () => {
    const b64 = pipelineToBase64(stages);
    const shareUrl = `${window.location.origin}${window.location.pathname}?pipeline=${b64}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback: show URL in a prompt
      prompt('Copy this link to share your pipeline:', shareUrl);
    }
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
      {/* Hidden file input for importing pipelines */}
      <input
        ref={fileInputRef}
        type="file"
        accept={PIPELINE_EXTENSION}
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

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
          onClick={handleExport}
          disabled={isRunning || stages.length === 0}
        >
          Export
        </button>
        <button
          className="toolbar-btn"
          onClick={handleImportClick}
          disabled={isRunning}
        >
          Import
        </button>
        <button
          className="toolbar-btn"
          onClick={handleShare}
          disabled={isRunning || stages.length === 0}
        >
          {shareCopied ? 'Copied!' : 'Share'}
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
