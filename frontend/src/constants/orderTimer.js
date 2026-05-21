/** Service lines use 0..n-1; per-assigned-worker timers use 1000+slot (must match backend). */
export const WORKER_TIMER_INDEX_BASE = 1000;

export const workerTimerIndex = (slot) => WORKER_TIMER_INDEX_BASE + slot;

export const isWorkerTimerIndex = (index) =>
  index !== null && index !== undefined && Number(index) >= WORKER_TIMER_INDEX_BASE;
