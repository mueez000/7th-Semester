import { useState, useEffect } from 'react';
import { Play, Square, Clock, Calendar as CalendarIcon, Award, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';

const WorkTimer = () => {
  const { refreshGamification } = useAuth();
  const { timers, startTimer, stopTimer } = useTimer();
  const { isRunning, elapsed: seconds, activeTask } = timers.work;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(new URLSearchParams(window.location.search).get('taskId') || '');
  
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [stoppedTaskDetails, setStoppedTaskDetails] = useState(null);
  const [taskSummary, setTaskSummary] = useState(null);

  const [todayTotal, setTodayTotal] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({
    avgDaily: 0,
    personalBest: 0,
    dailyTotals: {},
    currentStreak: 0
  });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchWorkData();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const pending = await api.get('/todo/tasks?status=pending');
      const inProgress = await api.get('/todo/tasks?status=in_progress');
      if (pending.data.success) {
        setTasks([...pending.data.data, ...(inProgress.data?.data || [])]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkData = async () => {
    try {
      setLoading(true);
      const [todayRes, monthlyRes] = await Promise.all([
        api.get('/work/today'),
        api.get('/work/monthly')
      ]);

      if (todayRes.data.success) {
        setSessions(todayRes.data.data.sessions.reverse());
        setTodayTotal(todayRes.data.data.totalDuration);
      }
      
      if (monthlyRes.data.success) {
        setMonthlyStats(monthlyRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load work data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimer = async () => {
    if (isRunning) {
      // Stop and save
      try {
        const res = await api.post('/work/stop');
        if (res.data.success) {
          const finalSeconds = stopTimer('work');
          if (activeTask) {
             setStoppedTaskDetails({ task: activeTask, duration: finalSeconds });
             setShowTaskCompletionModal(true);
          } else {
             toast.success(`Session saved: ${formatTime(finalSeconds)}`);
          }
          // Refresh data immediately
          fetchWorkData();
          refreshGamification();
        }
      } catch (error) {
        toast.error('Failed to stop session properly.');
      }
    } else {
      // Start session
      try {
        const res = await api.post('/work/start', { taskId: selectedTaskId || null });
        if (res.data.success) {
          setTaskSummary(null);
          const t = tasks.find(x => x._id === selectedTaskId);
          startTimer('work', { activeTask: t || null });
          toast('Focus session started!', { icon: '🚀' });
        }
      } catch (error) {
         if (error.response?.data?.error === 'A work session is already active') {
             toast.error('Active session found! Recovering states...');
             await api.post('/work/stop');
             stopTimer('work');
         } else {
             toast.error('Failed to start session.');
         }
      }
    }
  };

  const handleTaskCompletion = async (markDone) => {
    if (!stoppedTaskDetails) return;
    const { task, duration } = stoppedTaskDetails;
    setShowTaskCompletionModal(false);

    if (markDone) {
      try {
        const res = await api.put(`/todo/tasks/${task._id}/complete`);
        if (res.data.success) {
          const updatedTask = res.data.data;
          setTaskSummary({
            title: task.title,
            actual: updatedTask.actualTime,
            estimated: updatedTask.estimatedTime
          });
          toast.success('Task marked as completed!');
          fetchTasks(); // refresh task list
        }
      } catch (e) {
        toast.error('Failed to mark task as done');
      }
    } else {
      toast.success(`Session saved: ${formatTime(duration)}`);
    }
    setStoppedTaskDetails(null);
  };

  const formatTime = (totalSeconds) => {
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return d > 0 ? `${d.toString().padStart(2, '0')}:${timeStr}` : timeStr;
  };

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '0m';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await api.delete(`/work/session/${sessionId}`);
      toast.success('Session removed');
      await fetchWorkData();
      refreshGamification();
    } catch (err) {
      toast.error('Failed to delete session');
    } finally {
      setDeletingId(null);
    }
  };

  // Convert daily stats helper array to graph points
  const getWeeklyGraphData = () => {
     // For simplicity returning a dynamic array based on daily totals representing weekdays
     // Normally, we'd map absolute days from the backend 'dailyTotals' object based on last 7 days.
     // In this specific mock we return 7 active dots relative to max values
     const map = Object.values(monthlyStats.dailyTotals || {});
     if (map.length === 0) return [0,0,0,0,0,0,0];
     // slice last 7
     const recent = map.slice(-7);
     while(recent.length < 7) recent.unshift(0);
     return recent;
  };
  const weekData = getWeeklyGraphData();
  const maxWeekly = Math.max(...weekData, 3600); // minimum 1 hr baseline

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Clock className="text-blue-600 mr-2" size={28} />
          Deep Work Timer
        </h1>
        <p className="text-gray-600 mt-1">Focus on your tasks without distractions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center lg:text-left">
        {/* Main Timer Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className="font-mono text-7xl md:text-9xl font-bold tracking-tight text-gray-900 drop-shadow-sm mb-8">
              {formatTime(seconds)}
            </div>

            {!isRunning && (
              <div className="mb-6 w-full max-w-xs">
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Working on Task <span className="text-gray-400 font-normal">(Optional)</span></label>
                <select 
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                >
                  <option value="">No task selected</option>
                  {tasks.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
            )}
            
            {isRunning && activeTask && (
              <div className="mb-6 text-center">
                <p className="text-sm font-medium text-gray-500">Currently working on:</p>
                <p className="text-lg font-bold text-blue-700 mt-1">{activeTask.title}</p>
              </div>
            )}
            
            <button
              disabled={loading}
              onClick={toggleTimer}
              className={`flex items-center justify-center px-10 py-5 rounded-full text-xl flex-col font-bold text-white transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-100 ring-offset-2' 
                  : 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-100 ring-offset-2'
              }`}
            >
              {isRunning ? (
                <>
                  <Square size={32} fill="currentColor" className="mb-2" />
                  STOP & SAVE
                </>
              ) : (
                <>
                  <Play size={32} fill="currentColor" className="mb-2 ml-2" />
                  START FOCUS
                </>
              )}
            </button>
            <p className="text-gray-500 mt-8 font-medium">
              Today's Total: <span className="text-gray-900 font-bold">{formatDuration(todayTotal + (isRunning ? seconds : 0))}</span>
            </p>
            {taskSummary && (
              <div className={`mt-6 p-4 rounded-xl border w-full max-w-sm text-left ${(!taskSummary.estimated || taskSummary.actual <= taskSummary.estimated) ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <h3 className="font-bold text-md mb-1">Task Completed: {taskSummary.title}</h3>
                <p className="text-sm">Completed in {taskSummary.actual} mins {taskSummary.estimated ? `(Estimated: ${taskSummary.estimated} mins)` : ''}</p>
                <button onClick={() => setTaskSummary(null)} className="mt-3 text-xs font-semibold underline opacity-80 hover:opacity-100">Dismiss</button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Recent Sessions</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {sessions.map((session) => (
                <div key={session._id} className="flex justify-between items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex items-center text-gray-600 min-w-0">
                    <CalendarIcon size={16} className="mr-3 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-800">
                      {format(new Date(session.startTime), 'MMM d, yyyy')}
                    </span>
                    <span className="ml-2 text-sm shrink-0">
                      {format(new Date(session.startTime), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm">
                      {formatDuration(session.duration)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(session._id, e)}
                      disabled={deletingId === session._id}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Delete session"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-gray-500 text-center py-4">No complete sessions today.</p>}
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{formatDuration(monthlyStats.personalBest)}</h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">Personal Best</p>
            <p className="text-xs text-gray-400 mt-4 px-4">Longest single focus session this month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <span className="text-2xl">🔥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{monthlyStats.currentStreak} days</h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">Current Streak</p>
            <p className="text-xs text-gray-400 mt-4 px-4">Consecutive days with a timer session</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Overview</h3>
             <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Avg. Daily</span>
                <span className="font-bold text-gray-900">{formatDuration(monthlyStats.avgDaily)}</span>
             </div>
             <div className="flex justify-between flex-col items-start py-3 pt-6 border-b border-gray-100">
                <span className="text-gray-600 text-sm mb-2">Work hours distribution</span>
                <div className="flex items-end justify-between w-full h-24 space-x-2">
                  {weekData.map((s, i) => (
                    <div key={i} className="w-full bg-blue-100 rounded-t-sm flex flex-col justify-end group transition-all" title={formatDuration(s)}>
                      <div className="bg-blue-500 rounded-t-sm w-full transition-all group-hover:bg-blue-600" style={{ height: `${(s/maxWeekly)*100}%` }}></div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {showTaskCompletionModal && stoppedTaskDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Complete!</h2>
            <p className="text-gray-600 mb-6">
              Did you complete the task <strong>{stoppedTaskDetails.task.title}</strong>?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleTaskCompletion(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Yes, Mark Done
              </button>
              <button 
                onClick={() => handleTaskCompletion(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition-colors"
              >
                No, Just Save Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkTimer;
