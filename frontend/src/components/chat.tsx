import { useState, useRef, useEffect, useCallback } from 'react';
import ModelSelector from './ModelSelector';
import { useLychee } from '../hooks/useLychee';
import type { ChatMessage } from '../hooks/useLychee';

/** Simple code fence detection: render text between ``` as <pre><code> */
function renderContent(text: string): JSX.Element[] {
  const parts: JSX.Element[] = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let key = 0;
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      parts.push(<span key={key++}>{textBuffer.join('\n')}</span>);
      textBuffer = [];
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      parts.push(
        <pre key={key++}><code>{codeBuffer.join('\n')}</code></pre>
      );
      codeBuffer = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushText();
        inCodeBlock = true;
      }
    } else if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }

  // flush remaining
  if (inCodeBlock) {
    flushCode();
  } else {
    flushText();
  }

  return parts;
}

export default function Chat() {
  const { models, loadingModels, modelError, fetchModels, sendMessage, cancelRequest } =
    useLychee();

  const [selectedModel, setSelectedModel] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent, scrollToBottom]);

  // auto-select first model when list loads
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedModel || streaming) return;

    setError(null);
    setInput('');
    setStreamContent('');
    setStreaming(true);

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    await sendMessage(
      selectedModel,
      newMessages,
      (token) => {
        setStreamContent((prev) => prev + token);
      },
      () => {
        setStreamContent((prev) => {
          setMessages((msgs) => [...msgs, { role: 'assistant', content: prev }]);
          return '';
        });
        setStreaming(false);
      },
      (err) => {
        setError(err);
        setStreaming(false);
      },
    );
  }, [input, selectedModel, streaming, messages, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    cancelRequest();
    if (streamContent) {
      setMessages((msgs) => [...msgs, { role: 'assistant', content: streamContent }]);
    }
    setStreamContent('');
    setStreaming(false);
  };

  const renderMessageContent = useCallback((content: string, isStreaming: boolean) => {
    const elements = renderContent(content);
    if (elements.length === 0) return null;
    if (isStreaming) {
      // Wrap last element with streaming cursor
      const last = elements[elements.length - 1];
      if (last.type === 'span') {
        elements[elements.length - 1] = (
          <span key={(last.key as string) + '-cursor'} className="streaming-cursor">
            {last.props.children}
          </span>
        );
      }
    }
    return elements;
  }, []);

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <h1 className="chat-title">Lychee Desktop</h1>
          {selectedModel && (
            <span className="chat-model-badge">{selectedModel}</span>
          )}
        </div>
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelect={setSelectedModel}
          loading={loadingModels}
          error={modelError}
          onFetch={fetchModels}
        />
      </header>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !streaming && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
              </svg>
            </div>
            <span className="chat-empty-title">Start a conversation with Lychee</span>
            <p>Select a model from the dropdown above and type your first message to begin.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            <div className={`message-bubble ${msg.role === 'system' ? 'error-bubble' : ''}`}>
              <div className="message-role">
                {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Assistant' : 'System'}
              </div>
              <div className="message-content">
                {renderMessageContent(msg.content, false)}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {streaming && streamContent && (
          <div className="message-row assistant">
            <div className="message-bubble">
              <div className="message-role">Assistant</div>
              <div className="message-content">
                {renderMessageContent(streamContent, true)}
              </div>
            </div>
          </div>
        )}

        {streaming && !streamContent && (
          <div className="message-row assistant">
            <div className="message-bubble typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        {error && (
          <div className="message-row system">
            <div className="message-bubble error-bubble">
              <div className="message-role">Error</div>
              <div className="message-content">{error}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={!selectedModel}
        />
        <div className="chat-input-actions">
          {streaming ? (
            <button className="btn-stop" onClick={handleStop}>
              Stop
            </button>
          ) : (
            <button
              className="btn-send"
              onClick={handleSend}
              disabled={!input.trim() || !selectedModel}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
