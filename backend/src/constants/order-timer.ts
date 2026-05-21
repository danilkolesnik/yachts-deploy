/** Service lines: 0..n-1. Per-assigned-worker timers: 1000 + worker slot index. */
export const WORKER_TIMER_INDEX_BASE = 1000;

export const isWorkerTimerIndex = (index: number | null | undefined): boolean =>
  index !== null && index !== undefined && Number(index) >= WORKER_TIMER_INDEX_BASE;
