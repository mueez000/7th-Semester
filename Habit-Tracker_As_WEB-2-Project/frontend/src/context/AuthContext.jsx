import { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import gamificationService from '../services/gamificationService';
import toast from 'react-hot-toast';
import {
  emitActivityNotification,
  buildXpHistoryNotification,
  buildBadgeNotification,
  buildLevelUpNotification,
  buildLevelDownNotification
} from '../lib/activityNotifications';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState({
    level: 1,
    xp: 0,
    xp_to_next_level: 100,
    badges: [],
    recentHistory: []
  });
  const [levelQueue, setLevelQueue] = useState([]);

  /** After first successful fetch we know real level/XP; only then compare for level-up / XP toasts (avoids false positives on login/refresh when state still had defaults). */
  const gamificationHydratedRef = useRef(false);
  /** Track xp_history + badge rows we've already notified for (skip backlog on first load). */
  const seenXpHistoryIdsRef = useRef(new Set());
  const seenBadgeIdsRef = useRef(new Set());

  const refreshGamification = async () => {
    if (!sessionStorage.getItem('token')) return;
    try {
      const res = await gamificationService.getMe();
      if (res.success) {
        const prevLevel = gamification.level;
        const prevXp = gamification.xp;
        const wasHydrated = gamificationHydratedRef.current;
        const history = res.data.recentHistory || [];
        const badges = res.data.badges || [];
        const currentLevel = res.data.level;
        
        let storedLevel = localStorage.getItem('lastKnownLevel');
        if (!storedLevel) {
          localStorage.setItem('lastKnownLevel', currentLevel.toString());
          storedLevel = currentLevel;
        } else {
          storedLevel = parseInt(storedLevel, 10);
        }

        if (!wasHydrated) {
          let storedLastXpDate = localStorage.getItem('lastXpDate');
          if (storedLastXpDate) {
            const lastDate = new Date(storedLastXpDate);
            const newRows = history.filter(h => new Date(h.date) > lastDate);
            [...newRows].reverse().forEach((h) => {
              emitActivityNotification(buildXpHistoryNotification(h));
            });
          }
          if (history.length > 0) {
            localStorage.setItem('lastXpDate', history[0].date);
          }
          
          history.forEach((h) => seenXpHistoryIdsRef.current.add(h._id));
          badges.forEach((b) => seenBadgeIdsRef.current.add(b._id));
        } else {
          const newXpRows = history.filter(
            (h) => !seenXpHistoryIdsRef.current.has(h._id)
          );
          [...newXpRows].reverse().forEach((h) => {
            seenXpHistoryIdsRef.current.add(h._id);
            emitActivityNotification(buildXpHistoryNotification(h));
          });
          
          if (history.length > 0) {
            localStorage.setItem('lastXpDate', history[0].date);
          }

          const newBadges = badges.filter(
            (b) => !seenBadgeIdsRef.current.has(b._id)
          );
          newBadges.forEach((b) => {
            seenBadgeIdsRef.current.add(b._id);
            emitActivityNotification(buildBadgeNotification(b));
          });
        }

        if (wasHydrated) {
          if (currentLevel > storedLevel) {
            const newItems = [];
            for (let l = storedLevel + 1; l <= currentLevel; l++) {
              newItems.push({ type: 'up', level: l });
              emitActivityNotification(buildLevelUpNotification(l));
            }
            setLevelQueue(prev => [...prev, ...newItems]);
            localStorage.setItem('lastKnownLevel', currentLevel.toString());
          } else if (currentLevel < storedLevel) {
            const newItems = [];
            for (let l = storedLevel - 1; l >= currentLevel; l--) {
              newItems.push({ type: 'down', level: l });
              emitActivityNotification(buildLevelDownNotification(l));
            }
            setLevelQueue(prev => [...prev, ...newItems]);
            localStorage.setItem('lastKnownLevel', currentLevel.toString());
          }

          const xpGain = res.data.xp - prevXp;
          if (xpGain > 0 && res.data.level === prevLevel) {
            toast.success(`+${xpGain} XP Earned! ⚡`, {
              icon: '✨',
              style: {
                borderRadius: '12px',
                background: '#1a73e8',
                color: '#fff',
                fontWeight: 'bold',
              },
            });
          } else if (xpGain < 0 && res.data.level === prevLevel) {
            toast.success(`${xpGain} XP Deducted! 📉`, {
              icon: '⚠️',
              style: {
                borderRadius: '12px',
                background: '#5f6368',
                color: '#fff',
                fontWeight: 'bold',
              },
            });
          }
        }

        setGamification(res.data);
        gamificationHydratedRef.current = true;
      }
    } catch (error) {
      console.error("Failed to refresh gamification:", error);
    }
  };

  useEffect(() => {
    // Check if token exists on load (sessionStorage clears when tab is closed)
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      refreshGamification();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success && res.data.data.token) {
        sessionStorage.setItem('token', res.data.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.data));
        setUser(res.data.data);
        await refreshGamification();
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const payload = {
        name: userData.fullName,
        email: userData.email,
        password: userData.password,
        dob: userData.dob,
        weight: Number(userData.weight),
        gender: userData.gender
      };
      
      const res = await api.post('/auth/register', payload);
      if (res.data.success && res.data.data.token) {
        sessionStorage.setItem('token', res.data.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.data));
        setUser(res.data.data);
        await refreshGamification();
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.error || 'Registration failed.' 
      };
    }
  };

  const logout = async () => {
    try {
      const savedTimers = localStorage.getItem('habitflow_timers') || sessionStorage.getItem('habitflow_timers');
      if (savedTimers) {
        const parsed = JSON.parse(savedTimers);
        if (parsed.work && parsed.work.isRunning) {
          await api.post('/work/stop');
          parsed.work = { isRunning: false, startTime: null, elapsed: 0, activeTask: null };
          localStorage.setItem('habitflow_timers', JSON.stringify(parsed));
          window.dispatchEvent(new Event('timer-update'));
        }
      }
    } catch (err) {
      console.error('Error stopping work timer on logout:', err);
    }

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setLevelQueue([]);
    gamificationHydratedRef.current = false;
    seenXpHistoryIdsRef.current.clear();
    seenBadgeIdsRef.current.clear();
    setGamification({
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
      badges: [],
      recentHistory: []
    });
    localStorage.removeItem('lastKnownLevel');
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/users/profile', updates);
      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.data };
        if (user && user.token) updatedUser.token = user.token; // keep the token
        
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }
      return { success: false, message: 'Server did not acknowledge profile update' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateProfile,
      gamification,
      refreshGamification,
      levelQueue,
      closeGamificationModal: () => setLevelQueue(prev => prev.slice(1))
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
