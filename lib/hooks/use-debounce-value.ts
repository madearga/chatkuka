'use client';

import { useState, useEffect } from 'react';

export function useDebounceValue<T>(value: T, delay: number): T {
  // Initialize with the provided value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Skip debounce for undefined or null values
    if (value === undefined || value === null) {
      setDebouncedValue(value);
      return;
    }

    // For functions, just return the value directly without debouncing
    if (typeof value === 'function') {
      console.warn('useDebounceValue received a function, returning without debouncing');
      setDebouncedValue(value);
      return;
    }

    // Set up the timeout for debouncing
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
