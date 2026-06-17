import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Chat',
    shortcuts: [
      { keys: 'Ctrl + Enter', description: 'Send message' },
      { keys: 'Shift + Enter', description: 'New line in input' },
      { keys: 'Escape', description: 'Stop streaming (when active)' },
      { keys: 'Ctrl + K', description: 'Focus chat input' },
      { keys: 'Ctrl + L', description: 'Clear chat' },
      { keys: 'Ctrl + Shift + N', description: 'New chat' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'Ctrl + 1', description: 'Home tab' },
      { keys: 'Ctrl + 2', description: 'Chat tab' },
      { keys: 'Ctrl + 3', description: 'Studio tab' },
      { keys: 'Ctrl + 4', description: 'Models tab' },
      { keys: 'Ctrl + 5', description: 'Settings tab' },
    ],
  },
  {
    title: 'Studio',
    shortcuts: [
      { keys: 'Ctrl + Shift + E', description: 'Export pipeline' },
      { keys: 'Ctrl + Shift + I', description: 'Import pipeline' },
    ],
  },
  {
    title: 'Global',
    shortcuts: [
      { keys: 'Ctrl + /', description: 'Show keyboard shortcuts' },
      { keys: '?', description: 'Show keyboard shortcuts' },
      { keys: 'Ctrl + Shift + T', description: 'Cycle theme (Dark / Light / System)' },
      { keys: 'Escape', description: 'Close modals / dialogs' },
    ],
  },
];

export default function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="ks-overlay" onClick={onClose}>
      <div
        className="ks-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard Shortcuts"
      >
        <div className="ks-header">
          <h2 className="ks-title">Keyboard Shortcuts</h2>
          <button className="ks-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ks-body">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="ks-group">
              <h3 className="ks-group-title">{group.title}</h3>
              <div className="ks-list">
                {group.shortcuts.map((s) => (
                  <div key={s.keys + s.description} className="ks-row">
                    <span className="ks-keys">
                      {s.keys.split(' + ').map((part, i, arr) => (
                        <span key={i}>
                          <kbd className="ks-kbd">{part}</kbd>
                          {i < arr.length - 1 && <span className="ks-plus">+</span>}
                        </span>
                      ))}
                    </span>
                    <span className="ks-desc">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ks-footer">
          Press <kbd className="ks-kbd">?</kbd> or <kbd className="ks-kbd">Ctrl</kbd> + <kbd className="ks-kbd">/</kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
}
