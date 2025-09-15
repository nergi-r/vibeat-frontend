// src/types/umami.d.ts

// This tells TypeScript that a global 'umami' object might exist on the window,
// and what its 'track' function looks like. This prevents build errors.
declare global {
  interface Window {
    umami?: {
      track: (eventName: string) => void;
    };
  }
}

// You might need an empty export to make this a module
export {};
