import { useState } from "react";

/**
 * Provides a `runTask` helper that manages a shared loading label and toast message.
 * Centralizes the repetitive setLoading/try/catch/finally pattern from App.tsx.
 */
export function useRunTask() {
  const [loading, setLoading] = useState("");
  const [toast, setToast] = useState("");

  async function runTask<T>(label: string, task: () => Promise<T>): Promise<T | null> {
    setLoading(label);
    try {
      return await task();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Operacion no completada.");
      return null;
    } finally {
      setLoading("");
    }
  }

  return { loading, toast, setToast, setLoading, runTask };
}
