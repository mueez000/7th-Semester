import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TodoNotificationManager = () => {
  const notifiedTasksRef = useRef(new Set()); // store IDs internally to avoid re-notifying the exact same task until refreshed

  useEffect(() => {
    let intervalId;

    const checkDueTasks = async () => {
      try {
        const res = await api.get('/todo/notifications');
        if (res.data.success && res.data.data.length > 0) {
          const dueTasks = res.data.data;
          const newTasks = dueTasks.filter(t => !notifiedTasksRef.current.has(t._id));

          if (newTasks.length > 0) {
            newTasks.forEach(t => notifiedTasksRef.current.add(t._id));

            // Browser notifications
            if (Notification.permission === 'granted') {
              new Notification('HabitFlow: Tasks Due!', {
                body: `You have ${newTasks.length} task(s) due today or overdue.`,
                icon: '/favicon.ico' // placeholder
              });
            } else {
              // Fallback to in-app notification
              toast.info(`You have ${newTasks.length} task(s) due today or overdue!`, {
                icon: '📋',
                duration: 5000,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to check due tasks for notifications:", error);
      }
    };

    const requestPermissionAndCheck = async () => {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.error("Notification permission request failed", error);
        }
      }
      
      // Perform an initial check
      checkDueTasks();

      // Set up periodic check (every hour: 3600000 ms)
      intervalId = setInterval(checkDueTasks, 3600000);
    };

    requestPermissionAndCheck();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
};

export default TodoNotificationManager;
