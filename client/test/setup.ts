import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
  },
  storage: {
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
  },
}));

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: 'test-app-id',
    VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_...',
    VITE_PAYPAL_CLIENT_ID: 'test-paypal-id',
    VITE_VISION_ENABLED: '1',
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:8080',
    href: 'http://localhost:8080',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock FileReader
global.FileReader = class FileReader {
  result: string | null = null;
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,test';
      this.onload?.({ target: this });
    }, 0);
  }
} as any;

// Mock Image
global.Image = class Image {
  src: string = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin: string | null = null;

  constructor() {
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }
} as any;
