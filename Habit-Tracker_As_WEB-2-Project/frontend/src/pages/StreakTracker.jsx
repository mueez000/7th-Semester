import { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StreakTracker = () => {
  const { refreshGamification } = useAuth();
  const [streakData, setStreakData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [relapseNotes, setRelapseNotes] = useState('');
  const [bathTaken, setBathTaken] = useState(false);

  useEffect(() => {
    fetchStreakData();
  }, []);

  useEffect(() => {
    let interval;
    if (streakData && streakData.isActive && streakData.startTime) {
      const start = new Date(streakData.startTime).getTime();
      
      const updateElapsed = () => {
        const now = new Date().getTime();
        const diff = now - start;
        
        if (diff < 0) return;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsed({ days: d, hours: h, minutes: m, seconds: s });
      };

      updateElapsed(); // initial call
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsed({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
    
    return () => clearInterval(interval);
  }, [streakData]);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      const [statusRes, historyRes] = await Promise.all([
        api.get('/streak/status'),
        api.get('/streak/history')
      ]);

      if (statusRes.data.success && statusRes.data.data) {
        setStreakData(statusRes.data.data);
      } else {
        setStreakData(null);
      }
      
      if (historyRes.data.success) {
        setHistory(historyRes.data.data.relapseHistory || []);
      }
    } catch (error) {
      toast.error('Failed to load streak data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startStreak = async () => {
    try {
      const res = await api.post('/streak/start');
      if (res.data.success) {
        setStreakData(res.data.data);
        refreshGamification();
        toast.success('Streak started. You got this!');
      }
    } catch (error) {
      toast.error('Failed to start streak');
    }
  };

  const handleRelapse = async (withPorn) => {
    try {
      const res = await api.post('/streak/relapse', { withPorn, notes: relapseNotes, bathTaken });
      if (res.data.success) {
        setStreakData(res.data.data);
        fetchStreakData(); // refresh history
        refreshGamification();
        toast('Streak reset. Don\'t give up!', { icon: '🔄' });
        setShowRelapseModal(false);
        setRelapseNotes('');
        setBathTaken(false);
      }
    } catch (error) {
      toast.error('Failed to record relapse');
    }
  };

  const handleDeleteRelapse = async (id) => {
    try {
      const res = await api.delete(`/streak/relapse/${id}`);
      if (res.data.success) {
        toast.success('Relapse history deleted');
        fetchStreakData();
        refreshGamification();
      }
    } catch (error) {
      toast.error('Failed to delete history');
    }
  };

  const getEncouragement = (days) => {
    if (days >= 90) return "Quarterly master!";
    if (days >= 30) return "Monthly champion!";
    if (days >= 7) return "One week strong!";
    if (days >= 1) return "Good start!";
    return "Every minute counts. Keep going.";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b4b] flex items-center">
            <Shield className="text-[#6b21a8] mr-2" size={28} />
            Commitment Streak
          </h1>
          <p className="text-gray-600 mt-1">Track your progress and stay strong.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center lg:text-left">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-8 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6b21a8] to-[#4c1d95]"></div>
            
            {loading ? (
              <p className="text-gray-400">Loading your streak...</p>
            ) : streakData && streakData.isActive ? (
              <>
                <p className="text-[#6b21a8] font-bold tracking-widest uppercase mb-4 text-sm">
                  {getEncouragement(elapsed.days)}
                </p>
                <div className={`flex items-baseline justify-center gap-4 transition-all`}>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-6xl md:text-8xl font-bold text-[#1e1b4b]">{elapsed.days}</span>
                    <span className="text-gray-500 font-medium mt-2">DAYS</span>
                  </div>
                  <span className="text-4xl text-gray-300 font-light">:</span>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-4xl md:text-6xl font-bold text-[#4c1d95]">{elapsed.hours.toString().padStart(2, '0')}</span>
                    <span className="text-gray-500 font-medium mt-2 text-sm">HRS</span>
                  </div>
                  <span className="text-4xl text-gray-300 font-light">:</span>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-4xl md:text-6xl font-bold text-[#6b21a8]">{elapsed.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-gray-500 font-medium mt-2 text-sm">MINS</span>
                  </div>
                </div>

                <div className="mt-12 flex gap-4 w-full max-w-sm">
                  <button
                    onClick={() => setShowRelapseModal(true)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-red-600 rounded-xl font-bold transition-all flex items-center justify-center"
                  >
                    <RefreshCw size={18} className="mr-2" />
                    I Relapsed
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <Shield size={64} className="text-gray-300 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to start?</h2>
                <p className="text-gray-500 mb-8 max-w-sm">Begin your journey today. Your streak timer will run continuously in the background.</p>
                <button
                  onClick={startStreak}
                  className="px-10 py-4 bg-[#6b21a8] hover:bg-[#581c87] text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 transition-transform active:scale-95"
                >
                  Start My Streak
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 text-left">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Relapse History</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 relative">
                {history.length > 0 ? (
                  <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200"></div>
                ) : null}
                {history.map((entry, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 p-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${entry.withPorn ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                      <AlertTriangle size={18} />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 flex flex-wrap items-center gap-1">
                          Relapse 
                          {entry.withPorn ? <span className="text-red-500 text-xs px-2 py-0.5 bg-red-50 rounded-full uppercase">With Porn</span> : <span className="text-amber-500 text-xs px-2 py-0.5 bg-amber-50 rounded-full uppercase">Without Porn</span>}
                          {entry.bathTaken !== undefined && (
                            entry.bathTaken ? <span className="text-blue-500 text-xs px-2 py-0.5 bg-blue-50 rounded-full uppercase">Bath Taken</span> : <span className="text-gray-500 text-xs px-2 py-0.5 bg-gray-100 rounded-full uppercase">No Bath</span>
                          )}
                          {entry.xpEarned !== undefined && (
                            entry.xpEarned < 0 ? <span className="text-red-600 text-xs font-bold">({entry.xpEarned} XP)</span> : <span className="text-green-600 text-xs font-bold">(+{entry.xpEarned} XP)</span>
                          )}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium">
                            {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                          </span>
                          <button onClick={() => handleDeleteRelapse(entry._id)} className="text-gray-400 hover:text-red-500 transition">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{format(new Date(entry.date), 'MMM d, yyyy - h:mm a')}</p>
                      {entry.notes && (
                        <p className="mt-3 text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">"{entry.notes}"</p>
                      )}
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p className="text-gray-500 text-center py-4">No history of relapse. Keep it up!</p>}
              </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
              <Shield size={32} />
            </div>
            <h3 className={`text-xl font-bold text-gray-900`}>
              {streakData?.longestStreak || 0} days
            </h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">Longest Streak</p>
            <p className="text-xs text-gray-400 mt-4 px-4">Your all-time best record</p>
          </div>
          
          <div className="bg-purple-50 rounded-[24px] border border-purple-100 p-6 text-center">
             <h3 className="font-bold text-purple-900 mb-2">Why tracking helps</h3>
             <p className="text-sm text-purple-700 leading-relaxed">
               Acknowledging progress builds momentum. Remember that a relapse is not a failure, but an opportunity to learn and grow stronger.
             </p>
          </div>
        </div>
      </div>

      {showRelapseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 border-b border-gray-100 p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Record Relapse</h2>
              <p className="text-gray-600">Be honest with yourself. This is part of the journey.</p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
              <textarea 
                value={relapseNotes}
                onChange={(e) => setRelapseNotes(e.target.value)}
                placeholder="What triggered this? How are you feeling?"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] text-sm mb-4 resize-none"
              ></textarea>
              
              <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <input 
                  type="checkbox" 
                  id="bathTaken"
                  checked={bathTaken}
                  onChange={(e) => setBathTaken(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="bathTaken" className="font-semibold text-gray-700 select-none cursor-pointer">
                  I have taken a bath
                </label>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleRelapse(true)}
                  className="w-full py-3.5 bg-[#d93025] hover:bg-[#b3261d] text-white font-bold rounded-xl transition-colors shadow-sm"
                >
                  Relapsed With Porn
                </button>
                <button 
                  onClick={() => handleRelapse(false)}
                  className="w-full py-3.5 bg-[#fbbc04] hover:bg-[#e3a903] text-white font-bold rounded-xl transition-colors shadow-sm text-shadow-sm"
                >
                  Relapsed Without Porn
                </button>
                <button 
                  onClick={() => setShowRelapseModal(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakTracker;
