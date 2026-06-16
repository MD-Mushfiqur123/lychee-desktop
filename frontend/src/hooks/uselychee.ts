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
  timestamp?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const API_BASE = 'http://localhost:11434';
const STORAGE_KEY = 'lychee-conversations';
const ACTIVE_CHAT_KEY = 'lychee-active-chat';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function classifyError(err: any): string {
  if (err.name === 'AbortError') return 'Request cancelled.';
  const msg = (err.message || '').toLowerCase();

  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('econnrefused')) {
    return 'Cannot connect to Ollama. Make sure Ollama is running (ollama serve) on localhost:11434.';
  }
  if (msg.includes('timeout') || err.name === 'TimeoutError') {
    return 'Request timed out. The model may still be loading — wait a moment and retry.';
  }
  if (msg.includes('model') && (msg.includes('not found') || msg.includes('not exist'))) {
    return 'Model not found locally. Pull it first from the Models tab.';
  }
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
    return 'Ollama server error — it may be overloaded. Try again in a few seconds.';
  }
  if (msg.includes('400') && msg.includes('template')) {
    return 'The model does not support chat format. Try a chat-tuned model.';
  }
  return err.message || 'An unexpected error occurred. Please try again.';
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New Chat';
  const text = firstUser.content.trim();
  return text.length > 40 ? text.slice(0, 40) + '…' : text;
}

export function useLychee() {
  // ── Model state ──
  const [models, setModels] = useState<LycheeModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // ── Conversation state ──
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_CHAT_KEY) || '';
    } catch {
      return '';
    }
  });

  // ── Response metrics ──
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [lastTokensGenerated, setLastTokensGenerated] = useState<number>(0);

  const abortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  // ── Persist helpers ──
  const persistConversations = (next: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full — silently ignore
    }
  };

  const persistActiveChat = (id: string) => {
    if (id) {
      localStorage.setItem(ACTIVE_CHAT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  };

  // ── Model fetching ──
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
        setModelError(classifyError(err));
      }
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // ── Conversation management ──
  const createConversation = useCallback((): string => {
    const id = generateId();
    const conv: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => {
      const updated = [conv, ...prev];
      persistConversations(updated);
      return updated;
    });
    setActiveConversationId(id);
    persistActiveChat(id);
    return id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        persistConversations(updated);
        return updated;
      });
      if (activeConversationId === id) {
        setActiveConversationId('');
        persistActiveChat('');
      }
    },
    [activeConversationId],
  );

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    persistActiveChat(id);
    // reset metrics when switching
    setLastResponseTime(null);
    setLastTokensGenerated(0);
  }, []);

  const updateConversation = useCallback((id: string, messages: ChatMessage[]) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== id) return c;
        const title = c.title === 'New Chat' ? generateTitle(messages) : c.title;
        return { ...c, messages, title, updatedAt: Date.now() };
      });
      persistConversations(updated);
      return updated;
    });
  }, []);

  const clearConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === id
          ? { ...c, messages: [], title: 'New Chat', updatedAt: Date.now() }
          : c,
      );
      persistConversations(updated);
      return updated;
    });
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
      );
      persistConversations(updated);
      return updated;
    });
  }, []);

  // ── Send message with retry ──
  const sendMessage = useCallback(
    async (
      model: string,
      messages: ChatMessage[],
      onToken: (token: string) => void,
      onDone: () => void,
      onError: (err: string) => void,
    ): Promise<void> => {
      abortRef.current = new AbortController();
      retryCountRef.current = 0;

      let tokenCount = 0;
      const startTime = performance.now();

      const attempt = async (): Promise<void> => {
        const controller = abortRef.current!;

        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages,
              stream: true,
            }),
            signal: controller.signal,
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

            // Retry on server errors
            if (
              res.status >= 500 &&
              retryCountRef.current < MAX_RETRIES
            ) {
              retryCountRef.current++;
              await new Promise((r) =>
                setTimeout(r, RETRY_DELAY_MS * retryCountRef.current),
              );
              return attempt();
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
                  tokenCount++;
                }
                if (json.done) {
                  setLastTokensGenerated(json.eval_count ?? tokenCount);
                  setLastResponseTime(
                    Math.round((performance.now() - startTime) / 10) / 100,
                  );
                  onDone();
                  return;
                }
              } catch {
                // skip unparseable lines
              }
            }
          }

          setLastTokensGenerated(tokenCount);
          setLastResponseTime(
            Math.round((performance.now() - startTime) / 10) / 100,
          );
          onDone();
        } catch (err: any) {
          if (err.name === 'AbortError') {
            onError('Request cancelled.');
            return;
          }

          // Retry on network errors
          const msg = (err.message || '').toLowerCase();
          if (
            (msg.includes('failed to fetch') ||
              msg.includes('networkerror') ||
              msg.includes('econnrefused') ||
              msg.includes('econnreset')) &&
            retryCountRef.current < MAX_RETRIES
          ) {
            retryCountRef.current++;
            await new Promise((r) =>
              setTimeout(r, RETRY_DELAY_MS * retryCountRef.current),
            );
            return attempt();
          }

          setLastResponseTime(
            Math.round((performance.now() - startTime) / 10) / 100,
          );
          onError(classifyError(err));
        }
      };

      await attempt();
    },
    [],
  );

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return {
    // Model
    models,
    loadingModels,
    modelError,
    fetchModels,

    // Chat
    sendMessage,
    cancelRequest,

    // Conversations
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    switchConversation,
    updateConversation,
    clearConversation,
    renameConversation,

    // Metrics
    lastResponseTime,
    lastTokensGenerated,
  };
}
