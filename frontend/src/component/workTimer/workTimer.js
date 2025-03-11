import { useState, useEffect, useRef } from "react";

export default function WorkTimer() {
  const [status, setStatus] = useState("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null); 

  const handleStartPause = () => {
    if (status === "idle" || status === "paused") {
      setStatus("running");
    } else {
      setStatus("paused");
    }
  };

  const handleStop = () => {
    clearInterval(timerRef.current);
    setElapsedTime(0);
    setStatus("idle");
  };

  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [status]);

  return (
    <div className="bg-gray-800 text-black p-4 rounded-lg flex items-center space-x-4">
      <p className="text-lg font-semibold ">
         {Math.floor(elapsedTime / 60)} : {elapsedTime % 60}
      </p>
      <button 
        onClick={handleStartPause} 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {status === "running" ? "Pause" : "Start"}
      </button>
      <button 
        onClick={handleStop} 
        disabled={status === "idle"} 
        className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${status === "idle" ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Stop
      </button>
    </div>
  );
}
