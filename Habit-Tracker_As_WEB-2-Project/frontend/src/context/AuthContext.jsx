import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on load (sessionStorage clears when tab is closed)
    const token = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
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
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
