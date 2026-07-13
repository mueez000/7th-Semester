import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { ACTIVITY_NOTIFY_EVENT } from '../lib/activityNotifications';

const STORAGE_PREFIX = 'habitflow_notifications_v1_';

const loadStored = (userId) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const saveStored = (userId, items) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(items));
  } catch {
    /* ignore quota */
  }
};

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const userIdRef = useRef(null);
  userIdRef.current = user?._id ?? null;
  const addNotificationRef = useRef(() => {});

  useEffect(() => {
    const uid = user?._id;
    if (!uid) return;
    const stored = loadStored(uid);
    setItems(Array.isArray(stored) ? stored : []);
  }, [user?._id]);

  useEffect(() => {
    const onActivity = (e) => {
      if (!userIdRef.current) return;
      const d = e.detail;
      if (!d || typeof d.title !== 'string') return;
      addNotificationRef.current(d);
    };
    window.addEventListener(ACTIVITY_NOTIFY_EVENT, onActivity);
    return () => window.removeEventListener(ACTIVITY_NOTIFY_EVENT, onActivity);
  }, []);

  const persist = useCallback((updater) => {
    const uid = userIdRef.current;
    if (!uid) return;
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStored(uid, next);
      return next;
    });
  }, []);

  const markAsRead = useCallback(
    (id) => {
      persist((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [persist]
  );

  const markAllAsRead = useCallback(() => {
    persist((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [persist]);

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  const dismiss = useCallback(
    (id) => {
      persist((prev) => prev.filter((n) => n.id !== id));
    },
    [persist]
  );

  const addNotification = useCallback(
    (notification) => {
      const id =
        notification.id ||
        `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      persist((prev) => {
        if (prev.some((n) => n.id === id)) return prev;
        const entry = {
          read: false,
          createdAt: new Date().toISOString(),
          ...notification,
          id,
        };
        return [entry, ...prev];
      });
    },
    [persist]
  );

  addNotificationRef.current = addNotification;

  const visibleItems = user?._id ? items : [];

  const unreadCount = useMemo(
    () => visibleItems.filter((n) => !n.read).length,
    [visibleItems]
  );

  const value = useMemo(
    () => ({
      items: visibleItems,
      unreadCount,
      markAsRead,
      markAllAsRead,
      dismiss,
      clearAll,
      addNotification,
    }),
    [visibleItems, unreadCount, markAsRead, markAllAsRead, dismiss, clearAll, addNotification]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
};
