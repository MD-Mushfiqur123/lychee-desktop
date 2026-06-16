import { useState, useCallback, useRef } from 'react';

export interface LycheeModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const API_BASE = 'http://localhost:11434';

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function useLychee() {
  const [models, setModels] = useState<LycheeModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    setModelError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tags`, {
        signal: abortRef.current?.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const list: LycheeModel[] = (data.models || []).map((m: any) => ({
        ...m,
        sizeFormatted: formatSize(m.size),
      }));
      setModels(list);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setModelError(err.message || 'Failed to fetch models');
      }
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (
      model: string,
      messages: ChatMessage[],
      onToken: (token: string) => void,
      onDone: () => void,
      onError: (err: string) => void,
    ): Promise<void> => {
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          let errMsg = `HTTP ${res.status}`;
          try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.error || errMsg;
          } catch {
            errMsg = errText || errMsg;
          }
          throw new Error(errMsg);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const json = JSON.parse(trimmed);
              if (json.message?.content) {
                onToken(json.message.content);
              }
              if (json.done) {
                onDone();
                return;
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
        onDone();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onError(err.message || 'Request failed');
        }
      }
    },
    [],
  );

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return {
    models,
    loadingModels,
    modelError,
    fetchModels,
    sendMessage,
    cancelRequest,
  };
}
