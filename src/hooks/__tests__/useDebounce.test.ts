import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 1200));
    expect(result.current).toBe('initial');
  });

  it('should update debounced value after specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1200 } }
    );

    rerender({ value: 'updated', delay: 1200 });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1199);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset timer if value changes before delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 1200 } }
    );

    rerender({ value: 'second', delay: 1200 });

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current).toBe('first');

    rerender({ value: 'third', delay: 1200 });

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('third');
  });
});
