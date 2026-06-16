import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom polyfills
Element.prototype.scrollIntoView = vi.fn();

// Mock global fetch to prevent real network calls
globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network not available in tests'));
