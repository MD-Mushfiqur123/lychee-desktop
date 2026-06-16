import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// ── Mock localStorage ──
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ── Mock navigator.clipboard ──
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
});

// ── Mock AbortSignal.timeout (not available in jsdom) ──
beforeEach(() => {
  if (!AbortSignal.timeout) {
    (AbortSignal as any).timeout = vi.fn().mockReturnValue({
      aborted: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  }
});

// ── Tests ──
describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('renders the sidebar with navigation tabs', () => {
    render(<App />);
    // Layout has both sidebar and bottom-tab with same labels
    // getAllByLabelText returns an array — verify both exist
    const homeTabs = screen.getAllByLabelText('Home');
    const chatTabs = screen.getAllByLabelText('Chat');
    const studioTabs = screen.getAllByLabelText('Studio');
    const modelsTabs = screen.getAllByLabelText('Models');
    const settingsTabs = screen.getAllByLabelText('Settings');

    // Each tab should appear exactly twice (sidebar + bottom bar)
    expect(homeTabs).toHaveLength(2);
    expect(chatTabs).toHaveLength(2);
    expect(studioTabs).toHaveLength(2);
    expect(modelsTabs).toHaveLength(2);
    expect(settingsTabs).toHaveLength(2);
  });

  it('renders the Home page by default', () => {
    render(<App />);
    expect(screen.getByText('Lychee Desktop')).toBeInTheDocument();
    expect(screen.getByText('Local AI, always available.')).toBeInTheDocument();
  });
});

describe('Chat Component', () => {
  it('renders the Chat component when navigated to', () => {
    render(<App />);
    // Click the Chat tab in the sidebar (first element)
    const chatTabs = screen.getAllByLabelText('Chat');
    chatTabs[0].click();
    // Chat input should be present
    const input = document.querySelector('.chat-input');
    expect(input).toBeTruthy();
  });
});

describe('ModelManager Component', () => {
  it('renders the ModelManager component when navigated to', () => {
    render(<App />);
    // Click the Models tab in the sidebar (first element)
    const modelsTabs = screen.getAllByLabelText('Models');
    modelsTabs[0].click();
    // Model Manager title should be present
    expect(screen.getByText('Model Manager')).toBeInTheDocument();
  });
});

describe('Studio Component', () => {
  it('renders the Studio component when navigated to', () => {
    render(<App />);
    // Click the Studio tab in the sidebar (first element)
    const studioTabs = screen.getAllByLabelText('Studio');
    studioTabs[0].click();
    // Pipeline Builder title should be present
    expect(screen.getByText(/Pipeline Builder/i)).toBeInTheDocument();
  });
});
