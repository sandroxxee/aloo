import { useState, useEffect } from 'react';

// Global state variables
let lastSearchLatency = 0;
let isLatencyHigh = false;
let activeSearches = 0;
const listeners = new Set<() => void>();
let resetTimeout: any = null;

function updateState(latency: number, isHigh: boolean, active: number) {
  lastSearchLatency = latency;
  isLatencyHigh = isHigh;
  activeSearches = active;
  
  if (resetTimeout) {
    clearTimeout(resetTimeout);
    resetTimeout = null;
  }

  // If latency is high and no searches are active, auto-reset the warning after 15 seconds of idle
  if (isHigh && active === 0) {
    resetTimeout = setTimeout(() => {
      isLatencyHigh = false;
      listeners.forEach(listener => listener());
    }, 15000);
  }

  listeners.forEach(listener => listener());
}

// Global fetch interception
const SEARCH_API_PATTERN = /\/api\/search/;

if (typeof window !== 'undefined') {
  // Ensure we intercept only once
  const anyWindow = window as any;
  if (!anyWindow.__connectionMonitorIntercepted) {
    anyWindow.__connectionMonitorIntercepted = true;
    
    const originalFetch = window.fetch;
    try {
      window.fetch = async function (input, init) {
        const url = typeof input === 'string' 
          ? input 
          : (input instanceof URL ? input.toString() : (input as Request)?.url);
        
        if (url && SEARCH_API_PATTERN.test(url)) {
          const startTime = Date.now();
          updateState(lastSearchLatency, isLatencyHigh, activeSearches + 1);

          // Set up a timer to detect if it takes > 5 seconds while running
          const slowTimer = setTimeout(() => {
            updateState(5.1, true, activeSearches);
          }, 5000);

          try {
            const response = await originalFetch.call(window, input, init);
            clearTimeout(slowTimer);
            const duration = (Date.now() - startTime) / 1000;
            updateState(duration, duration > 5, Math.max(0, activeSearches - 1));
            return response;
          } catch (error) {
            clearTimeout(slowTimer);
            const duration = (Date.now() - startTime) / 1000;
            updateState(duration, duration > 5, Math.max(0, activeSearches - 1));
            throw error;
          }
        }

        return originalFetch.call(window, input, init);
      };
    } catch (e) {
      console.warn('Connection Monitor: Could not intercept window.fetch', e);
    }
  }
}

export function useConnectionMonitor() {
  const [state, setState] = useState({
    lastSearchLatency,
    isLatencyHigh,
    activeSearches
  });

  useEffect(() => {
    const handleUpdate = () => {
      setState({
        lastSearchLatency,
        isLatencyHigh,
        activeSearches
      });
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const dismissWarning = () => {
    isLatencyHigh = false;
    listeners.forEach(listener => listener());
  };

  return {
    ...state,
    dismissWarning
  };
}
