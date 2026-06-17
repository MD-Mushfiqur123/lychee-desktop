import { useState, useCallback, useRef } from 'react';

// ---- Types ----

export type StageStatus = 'idle' | 'running' | 'done' | 'error';

export interface PipelineStage {
  id: string;
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  status: StageStatus;
  output: string;
  error: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider?: string;
}

export interface PipelineResult {
  stageId: string;
  status: StageStatus;
  output: string;
  error: string;
}

export interface UsePipelineReturn {
  stages: PipelineStage[];
  isRunning: boolean;
  finalOutput: string;
  error: string;
  availableModels: ModelInfo[];
  modelError: string;
  addStage: (model?: string) => void;
  removeStage: (id: string) => void;
  updateStage: (id: string, changes: Partial<PipelineStage>) => void;
  moveStage: (id: string, direction: 'up' | 'down') => void;
  runPipeline: () => Promise<PipelineResult[]>;
  clearPipeline: () => void;
  loadPipeline: (stages: PipelineStage[]) => void;
  fetchModels: () => Promise<void>;
}

// ---- Defaults ----

const API_BASE = 'http://localhost:11434';

function generateId(): string {
  return 'stage_' + Math.random().toString(36).substring(2, 10);
}

function createStage(model?: string): PipelineStage {
  return {
    id: generateId(),
    model: model || '',
    prompt: '',
    temperature: 0.7,
    maxTokens: 2048,
    status: 'idle',
    output: '',
    error: '',
  };
}

// ---- Hook ----

export function usePipeline(): UsePipelineReturn {
  const [stages, setStages] = useState<PipelineStage[]>([createStage()]);
  const [isRunning, setIsRunning] = useState(false);
  const [finalOutput, setFinalOutput] = useState('');
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [modelError, setModelError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // ---- Model fetching ----

  const fetchModels = useCallback(async () => {
    setModelError('');
    try {
      // Try Lychee /api/tags endpoint first (matches useLychee.ts)
      let res = await fetch(`${API_BASE}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        // Fallback 1: OpenAI-compatible /v1/models
        res = await fetch(`${API_BASE}/v1/models`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: ModelInfo[] = (data.data || data.models || data).map(
          (m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: m.owned_by || m.provider,
          })
        );
        setAvailableModels(list);
      } else {
        const data = await res.json();
        const list: ModelInfo[] = (data.models || data || []).map((m: any) => ({
          id: m.name || m.model || m.id,
          name: m.name || m.model || m.id,
          provider: m.details?.family || undefined,
        }));
        setAvailableModels(list);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch models';
      setModelError(msg);
      // Fallback models if server not reachable
      setAvailableModels([
        { id: 'llama3.2', name: 'llama3.2', provider: 'llama' },
        { id: 'qwen2.5', name: 'qwen2.5', provider: 'qwen2' },
        { id: 'mistral', name: 'mistral', provider: 'llama' },
        { id: 'gemma3', name: 'gemma3', provider: 'gemma' },
        { id: 'phi4', name: 'phi4', provider: 'phi' },
        { id: 'deepseek-r1', name: 'deepseek-r1', provider: 'deepseek' },
      ]);
    }
  }, []);

  // ---- Stage CRUD ----

  const addStage = useCallback((model?: string) => {
    setStages((prev) => [...prev, createStage(model)]);
  }, []);

  const removeStage = useCallback((id: string) => {
    setStages((prev) => {
      if (prev.length <= 1) return prev; // keep at least one
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const updateStage = useCallback(
    (id: string, changes: Partial<PipelineStage>) => {
      setStages((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...changes } : s))
      );
    },
    []
  );

  const moveStage = useCallback(
    (id: string, direction: 'up' | 'down') => {
      setStages((prev) => {
        const idx = prev.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
        return next;
      });
    },
    []
  );

  const clearPipeline = useCallback(() => {
    abortRef.current?.abort();
    setStages([createStage()]);
    setFinalOutput('');
    setError('');
    setIsRunning(false);
  }, []);

  const loadPipeline = useCallback((loadedStages: PipelineStage[]) => {
    if (loadedStages.length > 0) {
      setStages(loadedStages);
    }
    setFinalOutput('');
    setError('');
  }, []);

  // ---- Sequential execution ----

  const runPipeline = useCallback(async (): Promise<PipelineResult[]> => {
    setError('');
    setFinalOutput('');
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const results: PipelineResult[] = [];
    let previousOutput = '';

    for (let i = 0; i < stages.length; i++) {
      if (controller.signal.aborted) break;

      const stage = stages[i];
      const stageResult: PipelineResult = {
        stageId: stage.id,
        status: 'running',
        output: '',
        error: '',
      };

      // Update this stage to "running"
      setStages((prev) =>
        prev.map((s) =>
          s.id === stage.id
            ? { ...s, status: 'running' as StageStatus, output: '', error: '' }
            : s
        )
      );

      try {
        // Build messages: system prompt + optional previous output as context
        const messages = [
          { role: 'system', content: stage.prompt || 'You are a helpful assistant.' },
        ];

        if (previousOutput) {
          messages.push({ role: 'user', content: previousOutput });
        } else {
          messages.push({ role: 'user', content: stage.prompt || 'Hello!' });
        }

        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: stage.model,
            messages,
            stream: false,
            options: {
              temperature: stage.temperature,
              num_predict: stage.maxTokens,
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`API ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const content =
          data.message?.content || data.response || data.choices?.[0]?.message?.content || '';
        previousOutput = content;

        stageResult.status = 'done';
        stageResult.output = content;

        setStages((prev) =>
          prev.map((s) =>
            s.id === stage.id
              ? { ...s, status: 'done' as StageStatus, output: content, error: '' }
              : s
          )
        );
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        const msg = err?.message || 'Unknown error';

        stageResult.status = 'error';
        stageResult.error = msg;

        setStages((prev) =>
          prev.map((s) =>
            s.id === stage.id
              ? { ...s, status: 'error' as StageStatus, error: msg }
              : s
          )
        );

        setError(`Stage ${i + 1} (${stage.model}): ${msg}`);
        break;
      }

      results.push(stageResult);
    }

    setFinalOutput(previousOutput);
    setIsRunning(false);
    abortRef.current = null;
    return results;
  }, [stages]);

  return {
    stages,
    isRunning,
    finalOutput,
    error,
    availableModels,
    modelError,
    addStage,
    removeStage,
    updateStage,
    moveStage,
    runPipeline,
    clearPipeline,
    loadPipeline,
    fetchModels,
  };
}
