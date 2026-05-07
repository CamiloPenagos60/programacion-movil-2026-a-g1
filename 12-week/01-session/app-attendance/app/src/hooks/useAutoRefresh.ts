import { useEffect, useRef } from "react";

/**
 * Runs `onRefresh` on a fixed interval while `active` is true.
 *
 * Uses `useRef` so a new `onRefresh` function reference on every render does
 * not cause the interval to be torn down and recreated (which was the bug in
 * the original ResultsPage implementation).
 */
export function useAutoRefresh(active: boolean, intervalMs: number, onRefresh: () => void): void {
  const callbackRef = useRef(onRefresh);
  callbackRef.current = onRefresh;

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => callbackRef.current(), intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs]);
}
