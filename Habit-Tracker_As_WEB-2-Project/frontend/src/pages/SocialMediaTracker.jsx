import { useState, useEffect } from 'react';
import { Play, Square, Smartphone, Calendar as CalendarIcon, Award, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';

const SocialMediaTracker = () => {
  const { refreshGamification } = useAuth();
  const { timers, startTimer, stopTimer } = useTimer();
  const { isRunning, elapsed: seconds, platform: activePlatform } = timers.social || { isRunning: false, elapsed: 0, platform: null };

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [todayTotals, setTodayTotals] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({
    avgDaily: 0,
    personalBest: 0,
    dailyTotals: {},
    currentStreak: 0
  });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const [todayRes, monthlyRes] = await Promise.all([
        api.get('/social/today'),
        api.get('/social/monthly')
      ]);

      if (todayRes.data.success) {
        setSessions(todayRes.data.data.sessions);
        setTodayTotals(todayRes.data.data.totalDurationPerPlatform || {});
      }
      
      if (monthlyRes.data.success) {
        setMonthlyStats(monthlyRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load social media data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimer = async () => {
    if (isRunning) {
      // Stop
      try {
        const res = await api.post('/social/stop');
        if (res.data.success) {
          const finalSeconds = stopTimer('social');
          toast.success(`Session saved: ${formatTime(finalSeconds)}`);
          fetchSocialData();
          refreshGamification();
        }
      } catch (error) {
        toast.error('Failed to stop session properly.');
      }
    } else {
      // Start
      try {
        const res = await api.post('/social/start', { platform: selectedPlatform });
        if (res.data.success) {
          startTimer('social', { platform: selectedPlatform });
          toast('Social media timer started', { icon: '📱' });
        }
      } catch (error) {
        if (error.response?.data?.error === 'A social media session is already active') {
          toast.error('Active session found! Recovering states...');
          await api.post('/social/stop');
          stopTimer('social');
        } else {
          toast.error('Failed to start session.');
        }
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return timeStr;
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
      await api.delete(`/social/session/${sessionId}`);
      toast.success('Session removed');
      await fetchSocialData();
      refreshGamification();
    } catch (err) {
      toast.error('Failed to delete session');
    } finally {
      setDeletingId(null);
    }
  };

  const getPlatformColor = (platform) => {
    switch(platform) {
      case 'instagram': return 'text-[#E4405F]';
      case 'x': return 'text-[#000000]';
      case 'youtube': return 'text-[#FF0000]';
      case 'news': return 'text-[#1a73e8]';
      case 'movies': return 'text-[#8e24aa]';
      default: return 'text-gray-500';
    }
  };

  const getPlatformBg = (platform) => {
    switch(platform) {
      case 'instagram': return 'bg-[#E4405F]/10';
      case 'x': return 'bg-gray-100';
      case 'youtube': return 'bg-[#FF0000]/10';
      case 'news': return 'bg-[#1a73e8]/10';
      case 'movies': return 'bg-[#8e24aa]/10';
      default: return 'bg-gray-50';
    }
  };

  const todayTotalAll = Object.values(todayTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Smartphone className="text-[#E4405F] mr-2" size={28} />
          Social Media Timer
        </h1>
        <p className="text-gray-600 mt-1">Track and limit your screen time on social apps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center lg:text-left">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className={`font-mono text-7xl md:text-9xl font-bold tracking-tight drop-shadow-sm mb-8 ${isRunning ? getPlatformColor(activePlatform) : 'text-gray-900'}`}>
              {formatTime(seconds)}
            </div>

            {!isRunning && (
              <div className="mb-6 w-full max-w-xs">
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Select Platform</label>
                <select 
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-[#dadce0] rounded-xl outline-none focus:ring-2 focus:ring-[#1a73e8] transition text-sm"
                >
                  <option value="instagram">Instagram</option>
                  <option value="x">X (Twitter)</option>
                  <option value="youtube">YouTube</option>
                  <option value="news">News</option>
                  <option value="movies">Movies</option>
                </select>
              </div>
            )}
            
            {isRunning && activePlatform && (
              <div className="mb-6 text-center">
                <p className="text-sm font-medium text-gray-500">Currently tracking:</p>
                <p className={`text-lg font-bold capitalize mt-1 ${getPlatformColor(activePlatform)}`}>{activePlatform}</p>
              </div>
            )}
            
            <button
              disabled={loading}
              onClick={toggleTimer}
              className={`flex items-center justify-center px-10 py-5 rounded-full text-xl flex-col font-bold text-white transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isRunning 
                  ? 'bg-[#d93025] hover:bg-[#b3261d] ring-4 ring-red-100 ring-offset-2' 
                  : 'bg-[#1a73e8] hover:bg-[#1557b0] ring-4 ring-blue-100 ring-offset-2'
              }`}
            >
              {isRunning ? (
                <>
                  <Square size={32} fill="currentColor" className="mb-2" />
                  STOP TIMER
                </>
              ) : (
                <>
                  <Play size={32} fill="currentColor" className="mb-2 ml-2" />
                  START TIMER
                </>
              )}
            </button>
            <p className="text-gray-500 mt-8 font-medium">
              Today's Total: <span className="text-gray-900 font-bold">{formatDuration(todayTotalAll + (isRunning ? seconds : 0))}</span>
            </p>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 text-left">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Today's Sessions</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {sessions.map((session) => (
                <div key={session._id} className="flex justify-between items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-[#dadce0] transition-colors">
                  <div className="flex items-center text-gray-600 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${getPlatformBg(session.platform)}`}>
                      <Smartphone size={20} className={getPlatformColor(session.platform)} />
                    </div>
                    <div>
                      <div className={`font-semibold capitalize ${getPlatformColor(session.platform)}`}>{session.platform}</div>
                      <div className="text-sm">
                        {format(new Date(session.startTime), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {formatDuration(session.duration)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(session._id, e)}
                      disabled={deletingId === session._id}
                      className="p-2 rounded-xl text-gray-400 hover:text-[#d93025] hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Delete session"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-gray-500 text-center py-4">No social media usage tracked today.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#fbbc04]/20 rounded-full flex items-center justify-center text-[#fbbc04] mb-4">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{formatDuration(monthlyStats.personalBest)}</h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">Longest Session</p>
            <p className="text-xs text-gray-400 mt-4 px-4">Your longest single social media session this month</p>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#34a853]/20 rounded-full flex items-center justify-center text-[#34a853] mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{monthlyStats.currentStreak} days</h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">Active Streak</p>
            <p className="text-xs text-gray-400 mt-4 px-4">Consecutive days tracking your social usage</p>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Overview</h3>
             <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Avg. Daily</span>
                <span className="font-bold text-gray-900">{formatDuration(monthlyStats.avgDaily * 60)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaTracker;
