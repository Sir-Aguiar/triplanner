// Must be imported BEFORE any WatermelonDB import.
// Fixes: "window.performance.now.bind is not a function" on Hermes.

if (typeof window !== 'undefined' && window.performance) {
  const originalNow = window.performance.now;
  if (typeof originalNow === 'function' && typeof originalNow.bind !== 'function') {
    const now = (): number => originalNow.call(window.performance);
    window.performance.now = now as typeof window.performance.now;
  }
}

export {};
