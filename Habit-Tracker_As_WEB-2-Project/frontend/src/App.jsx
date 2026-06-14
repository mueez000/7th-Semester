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

import NamazTracker from './pages/NamazTracker';
import WorkTimer from './pages/WorkTimer';
import ExerciseTracker from './pages/ExerciseTracker';
import SocialMediaTracker from './pages/SocialMediaTracker';
import StreakTracker from './pages/StreakTracker';
import ReadingTracker from './pages/ReadingTracker';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Shop from './pages/Shop';
import Quests from './pages/Quests';
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

          <Route path="namaz" element={<PageTransition><NamazTracker /></PageTransition>} />
          <Route path="work" element={<PageTransition><WorkTimer /></PageTransition>} />
          <Route path="exercise" element={<PageTransition><ExerciseTracker /></PageTransition>} />
          <Route path="social" element={<PageTransition><SocialMediaTracker /></PageTransition>} />
          <Route path="streak" element={<PageTransition><StreakTracker /></PageTransition>} />
          <Route path="reading" element={<PageTransition><ReadingTracker /></PageTransition>} />
          <Route path="analytics" element={<PageTransition><Analytics /></PageTransition>} />
          <Route path="shop" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="quests" element={<PageTransition><Quests /></PageTransition>} />
          <Route path="notifications" element={<PageTransition><Notifications /></PageTransition>} />
          <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
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
