import React, { useEffect, useState } from 'react';
import { useOrderTimer } from '@/hooks/useOrderTimer';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';

const OrderTimer = ({
  orderId,
  serviceLineIndex,
  serviceLabel,
  onStop,
  refreshToken = 0,
  canUseTimer = true,
  canStopTimer = true,
}) => {
  const {
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    elapsedTime,
    formatTime,
  } = useOrderTimer(orderId, serviceLineIndex, refreshToken);

  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const [stopPending, setStopPending] = useState(false);

  useEffect(() => {
    setStopConfirmOpen(false);
    setStopPending(false);
  }, [refreshToken]);

  const notifyParent = () => {
    if (typeof onStop === 'function') {
      onStop();
    }
  };

  const handleStartOrResume = async () => {
    try {
      if (isPaused) {
        await resumeTimer();
      } else {
        await startTimer();
      }
      notifyParent();
    } catch {
      // errors already logged in hook
    }
  };

  const handlePause = async () => {
    try {
      await pauseTimer();
      notifyParent();
    } catch {
      // errors already logged in hook
    }
  };

  const requestStop = () => {
    if (!canStopTimer || !isRunning) return;
    setStopConfirmOpen(true);
  };

  const cancelStop = () => {
    if (!stopPending) setStopConfirmOpen(false);
  };

  const confirmStop = async () => {
    setStopPending(true);
    try {
      const stopped = await stopTimer();
      if (stopped) {
        setStopConfirmOpen(false);
        notifyParent();
      }
    } finally {
      setStopPending(false);
    }
  };

  return (
    <div className="gap-4 p-2 rounded-lg shadow-sm" title={serviceLabel || undefined}>
      {serviceLabel && (
        <div className="text-xs text-gray-600 truncate max-w-[140px] mb-1">{serviceLabel}</div>
      )}
      <div className="text-base font-mono font-medium text-black tracking-wider">
        {formatTime(elapsedTime)}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
            !isRunning || isPaused ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
          }`}
          onClick={handleStartOrResume}
          disabled={!canUseTimer || (isRunning && !isPaused) || stopConfirmOpen}
          title={isPaused ? 'Resume' : 'Start work'}
        >
          <PlayIcon
            className={`h-4 w-4 ${!isRunning || isPaused ? 'text-white' : 'text-gray-400'}`}
          />
        </button>

        <button
          type="button"
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
            isRunning && !isPaused ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
          }`}
          onClick={handlePause}
          disabled={!canUseTimer || !isRunning || isPaused || stopConfirmOpen}
          title="Pause"
        >
          <PauseIcon
            className={`h-4 w-4 ${isRunning && !isPaused ? 'text-white' : 'text-gray-400'}`}
          />
        </button>

        <button
          type="button"
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300'
          }`}
          onClick={requestStop}
          disabled={!canStopTimer || !isRunning || stopConfirmOpen}
          title="Stop"
        >
          <StopIcon className={`h-4 w-4 ${isRunning ? 'text-white' : 'text-gray-400'}`} />
        </button>
      </div>

      {stopConfirmOpen && (
        <div
          className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-md text-sm text-gray-900 space-y-2 max-w-sm shadow-sm"
          role="alertdialog"
          aria-labelledby={`stop-timer-title-${orderId}-${serviceLineIndex}`}
        >
          <p id={`stop-timer-title-${orderId}-${serviceLineIndex}`} className="font-semibold text-sm">
            Stop this timer?
          </p>
          <p className="text-gray-700 leading-relaxed">
            {serviceLabel ? (
              <>
                <span className="font-medium">{serviceLabel}</span>
                {' — '}
              </>
            ) : null}
            The session will be saved with duration{' '}
            <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>. The display
            will reset to 00:00:00.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={cancelStop}
              disabled={stopPending}
              className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Keep running
            </button>
            <button
              type="button"
              onClick={confirmStop}
              disabled={stopPending}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-semibold shadow-sm"
            >
              {stopPending ? 'Stopping…' : 'Yes, stop'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTimer;
