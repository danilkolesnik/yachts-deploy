
import { useState, useEffect } from 'react';
import { URL } from '@/utils/constants';

import axios from 'axios';

export const useOrderTimer = (orderId) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState('');

  const API_URL = `${URL}/orders`;

  const fetchTimerStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/${orderId}/timer`);
      if (data) {
        setStatus(data.status);
        
        if (data.status === 'In Progress') {
          setIsRunning(true);
          setIsPaused(false);
          if (data.currentDuration) {
            setElapsedTime(data.currentDuration);
          }
        } else if (data.status === 'Paused') {
          setIsRunning(true);
          setIsPaused(true);
          if (data.currentDuration) {
            setElapsedTime(data.currentDuration);
          }
        } else {
          setIsRunning(false);
          setIsPaused(false);
          if (data.totalDuration) {
            setElapsedTime(data.totalDuration);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при получении статуса таймера:', error);
    }
  };


  const startTimer = async () => {
    const token = localStorage.getItem('token');   
    try {
      await axios.post(`${API_URL}/${orderId}/timer/start`,{},{
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsRunning(true);
      setIsPaused(false);
      setStatus('In Progress');
      setElapsedTime(0);
    } catch (error) {
      console.error('Ошибка при запуске таймера:', error);
    }
  };

  // Пауза таймера
  const pauseTimer = async () => {
    try {
      await axios.post(`${API_URL}/${orderId}/timer/pause`);
      setIsPaused(true);
      setStatus('Paused');
    } catch (error) {
      console.error('Ошибка при постановке таймера на паузу:', error);
    }
  };

  // Возобновление таймера
  const resumeTimer = async () => {
    try {
      await axios.post(`${API_URL}/${orderId}/timer/resume`);
      setIsPaused(false);
      setStatus('In Progress');
    } catch (error) {
      console.error('Ошибка при возобновлении таймера:', error);
    }
  };

  // Остановка таймера
  const stopTimer = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/${orderId}/timer/stop`);
      setIsRunning(false);
      setIsPaused(false);
      setStatus('Completed');
      if (data.totalDuration) {
        setElapsedTime(data.totalDuration);
      }
      return true;
    } catch (error) {
      console.error('Ошибка при остановке таймера:', error);
      return false;
    }
  };

  useEffect(() => {
    let interval;

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1000);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    fetchTimerStatus();
  }, [orderId]);

  const formatTime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    elapsedTime,
    formatTime,
    status
  };
};