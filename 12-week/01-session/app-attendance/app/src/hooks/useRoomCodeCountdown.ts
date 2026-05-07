import { useEffect, useRef, useState } from "react";
import type { RoomCode } from "../types/domain";

/**
 * Countdown timer for a rotating room code.
 *
 * Fixes two issues from the inline SessionPage implementation:
 * 1. Uses `useRef` for the `onExpire` callback so a new function reference
 *    every render does not recreate the interval.
 * 2. Keeps `secsLeft` in the interval effect deps (required for restart after
 *    a new `roomCode` arrives) while removing `onExpire` from those deps.
 */
export function useRoomCodeCountdown(
  roomCode: RoomCode | null,
  active: boolean,
  onExpire: () => void
): number {
  const [secsLeft, setSecsLeft] = useState<number>(roomCode?.secondsLeft ?? 0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Sync secsLeft when a new room code arrives from the server.
  useEffect(() => {
    if (roomCode) setSecsLeft(roomCode.secondsLeft);
  }, [roomCode]);

  // Tick down; restart whenever secsLeft or active changes.
  // onExpire is accessed via ref so its reference changes never cause restarts.
  useEffect(() => {
    if (!active || secsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) {
          onExpireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, secsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  return secsLeft;
}
