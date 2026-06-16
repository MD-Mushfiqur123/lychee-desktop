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

const API_BASE = 'http://localhost:18690';

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
      const res = await fetch(`${API_BASE}/v1/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: ModelInfo[] = (data.models || data.data || data).map(
        (m: { id: string; name?: string; provider?: string }) => ({
          id: m.id,
          name: m.name || m.id,
          provider: m.provider,
        })
      );
      setAvailableModels(list);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch models';
      setModelError(msg);
      // Fallback models if server not reachable
      setAvailableModels([
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
        { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
        { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'meta' },
        { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', provider: 'alibaba' },
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
          messages.push({
            role: 'user',
            content: previousOutput,
          });
        } else {
          messages.push({
            role: 'user',
            content: stage.prompt || 'Hello!',
          });
        }

        const res = await fetch(`${API_BASE}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: stage.model,
            messages,
            temperature: stage.temperature,
            max_tokens: stage.maxTokens,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`API ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const content =
          data.choices?.[0]?.message?.content || data.response || data.output || '';
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
