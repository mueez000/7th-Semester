import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { TimerProvider } from './context/TimerContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/common/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import WorkTimer from './pages/WorkTimer';
import StreakTracker from './pages/StreakTracker';
import Analytics from './pages/Analytics';
import TradingJournal from './pages/TradingJournal';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import TodoPage from './pages/TodoPage';
import NotFound from './pages/NotFound';
import PageTransition from './components/common/PageTransition';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        
        {/* Protected Routes inside Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="todo" element={<PageTransition><TodoPage /></PageTransition>} />
          <Route path="work" element={<PageTransition><WorkTimer /></PageTransition>} />
          <Route path="streak" element={<PageTransition><StreakTracker /></PageTransition>} />
          <Route path="analytics" element={<PageTransition><Analytics /></PageTransition>} />
          <Route path="trading-journal" element={<PageTransition><TradingJournal /></PageTransition>} />
          <Route path="notifications" element={<PageTransition><Notifications /></PageTransition>} />
          <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

import { useEffect } from 'react';
import toast from 'react-hot-toast';

function App() {
  useEffect(() => {
    const handleOfflineQueue = () => {
      toast.success('Saved locally. Will sync when online.', {
        icon: '📶',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    };
    window.addEventListener('offline-sync-queued', handleOfflineQueue);
    return () => window.removeEventListener('offline-sync-queued', handleOfflineQueue);
  }, []);

  return (
    <AuthProvider>
      <NotificationsProvider>
        <TimerProvider>
          <Router>
            <Toaster position="top-right" />
            <AnimatedRoutes />
          </Router>
        </TimerProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
