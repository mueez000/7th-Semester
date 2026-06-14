import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const [timers, setTimers] = useState(() => {
    const saved = localStorage.getItem('habitflow_timers') || sessionStorage.getItem('habitflow_timers');
    const defaultState = {
      work: { isRunning: false, startTime: null, elapsed: 0, activeTask: null },
      social: { isRunning: false, startTime: null, elapsed: 0, platform: null }
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState, ...parsed };
    }
    return defaultState;
  });

  const timerRefs = useRef({
    work: null,
    social: null
  });

  useEffect(() => {
    localStorage.setItem('habitflow_timers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    const handleTimerUpdate = () => {
      const saved = localStorage.getItem('habitflow_timers');
      if (saved) {
        setTimers(JSON.parse(saved));
      }
    };
    window.addEventListener('timer-update', handleTimerUpdate);
    return () => window.removeEventListener('timer-update', handleTimerUpdate);
  }, []);

  const updateElapsed = (type) => {
    setTimers(prev => {
      if (!prev[type] || !prev[type].isRunning || !prev[type].startTime) return prev;
      const now = Date.now();
      const elapsed = Math.floor((now - prev[type].startTime) / 1000);
      return {
        ...prev,
        [type]: {
          ...prev[type],
          elapsed
        }
      };
    });
  };

  useEffect(() => {
    ['work', 'social'].forEach(type => {
      if (timers[type]?.isRunning && !timerRefs.current[type]) {
        updateElapsed(type);
        timerRefs.current[type] = setInterval(() => {
          updateElapsed(type);
        }, 1000);
      } else if (!timers[type]?.isRunning && timerRefs.current[type]) {
        clearInterval(timerRefs.current[type]);
        timerRefs.current[type] = null;
      }
    });

    return () => {
      ['work', 'social'].forEach(type => {
        if (!timers[type]?.isRunning && timerRefs.current[type]) {
           // Cleanup is handled by the clear condition above usually, but on unmount we want to clear all
        }
      });
    };
  }, [timers.work?.isRunning, timers.social?.isRunning]);

  // Handle unmount completely
  useEffect(() => {
    return () => {
      ['work', 'social'].forEach(type => {
        if (timerRefs.current[type]) {
          clearInterval(timerRefs.current[type]);
          timerRefs.current[type] = null;
        }
      });
    };
  }, []);

  const startTimer = (type, metadata = {}) => {
    setTimers(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        isRunning: true,
        startTime: Date.now(),
        elapsed: 0,
        ...metadata
      }
    }));
  };

  const stopTimer = (type) => {
    // we need to return the current elapsed to the caller so they can use it
    let finalElapsed = 0;
    setTimers(prev => {
      finalElapsed = prev[type].elapsed;
      return {
        ...prev,
        [type]: {
          isRunning: false,
          startTime: null,
          elapsed: 0,
          activeTask: null
        }
      };
    });
    // setTimers is async so finalElapsed here might be captured incorrectly because React state updates are queued.
    // Wait, let's just grab it from the current state `timers` since it's in scope of the render.
    return timers[type].elapsed;
  };

  const clearTimer = (type) => {
    setTimers(prev => ({
      ...prev,
      [type]: {
        isRunning: false,
        startTime: null,
        elapsed: 0,
        activeTask: null
      }
    }));
  };

  return (
    <TimerContext.Provider value={{
      timers,
      startTimer,
      stopTimer,
      clearTimer
    }}>
      {children}
    </TimerContext.Provider>
  );
};
