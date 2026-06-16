import { useState, useRef, useEffect, useCallback } from 'react';
import ModelSelector from './ModelSelector';
import { useLychee } from '../hooks/useLychee';
import type { ChatMessage } from '../hooks/useLychee';

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

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <h1 className="chat-title">Lychee Desktop</h1>
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
            <div className="chat-empty-icon">&#9678;</div>
            <p>Select a model and start a conversation</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            <div className="message-bubble">
              <div className="message-role">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {streaming && streamContent && (
          <div className="message-row assistant">
            <div className="message-bubble">
              <div className="message-role">Assistant</div>
              <div className="message-content">{streamContent}</div>
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
              {error}
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
