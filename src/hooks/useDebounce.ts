import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a value by a specified delay in milliseconds.
 *
 * @param value The input value to debounce
 * @param delay Delay in milliseconds (default: 1200ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 1200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
