import React from 'react';
import { useOrderTimer } from '@/hooks/useOrderTimer';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';

const OrderTimer = ({ orderId, onStop }) => {
  const { 
    isRunning, 
    isPaused,
    startTimer, 
    pauseTimer,
    resumeTimer,
    stopTimer, 
    elapsedTime, 
    formatTime, 
    status 
  } = useOrderTimer(orderId);

  const handleStop = async () => {
    const stopped = await stopTimer();
    if (stopped && typeof onStop === 'function') {
      onStop();
    }
  };

  return (
    <div className="gap-4 p-2 rounded-lg shadow-sm">
      <div className="text-base font-mono font-medium text-black tracking-wider">
        {formatTime(elapsedTime)}
      </div>
      <div className="flex items-center gap-2">
        <button 
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
            (!isRunning || isPaused) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
          }`}
          onClick={isPaused ? resumeTimer : startTimer}
          disabled={isRunning && !isPaused}
          title={isPaused ? "Продолжить" : "Начать работу"}
        >
          <PlayIcon className={`h-4 w-4 ${(!isRunning || isPaused) ? 'text-white' : 'text-gray-400'}`} />
        </button>

        <button 
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
            (isRunning && !isPaused) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
          }`}
          onClick={pauseTimer}
          disabled={!isRunning || isPaused}
          title="Пауза"
        >
          <PauseIcon className={`h-4 w-4 ${(isRunning && !isPaused) ? 'text-white' : 'text-gray-400'}`} />
        </button>

        <button 
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-sm ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300'
          }`}
          onClick={handleStop}
          disabled={!isRunning}
          title="Завершить"
        >
          <StopIcon className={`h-4 w-4 ${isRunning ? 'text-white' : 'text-gray-400'}`} />
        </button>
      </div>
    </div>
  );
};

export default OrderTimer;