import { useState, useEffect } from 'react';
import { Brain, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DopamineDetoxTracker = () => {
  const { refreshGamification } = useAuth();
  const [detoxData, setDetoxData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [relapseNotes, setRelapseNotes] = useState('');
  const [relapseApp, setRelapseApp] = useState('');
  
  const [initialTarget, setInitialTarget] = useState(7);

  useEffect(() => {
    fetchDetoxData();
  }, []);

  useEffect(() => {
    let interval;
    if (detoxData && detoxData.isActive && detoxData.startTime) {
      const start = new Date(detoxData.startTime).getTime();
      
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
  }, [detoxData]);

  const fetchDetoxData = async () => {
    try {
      setLoading(true);
      const [statusRes, historyRes] = await Promise.all([
        api.get('/detox/status'),
        api.get('/detox/history')
      ]);

      if (statusRes.data.success && statusRes.data.data) {
        setDetoxData(statusRes.data.data);
      } else {
        setDetoxData(null);
      }
      
      if (historyRes.data.success) {
        setHistory(historyRes.data.data.relapseHistory || []);
      }
    } catch (error) {
      toast.error('Failed to load detox data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startDetox = async () => {
    try {
      const res = await api.post('/detox/start', { targetDays: initialTarget });
      if (res.data.success) {
        setDetoxData(res.data.data);
        refreshGamification();
        toast.success('Dopamine detox started. You got this!');
      }
    } catch (error) {
      toast.error('Failed to start detox');
    }
  };

  const handleRelapse = async () => {
    try {
      const res = await api.post('/detox/relapse', { app: relapseApp, notes: relapseNotes });
      if (res.data.success) {
        setDetoxData(res.data.data);
        fetchDetoxData(); // refresh history
        refreshGamification();
        toast('Detox timer reset. Don\'t give up!', { icon: '🔄' });
        setShowRelapseModal(false);
        setRelapseNotes('');
        setRelapseApp('');
      }
    } catch (error) {
      toast.error('Failed to record relapse');
    }
  };

  const handleDeleteRelapse = async (id) => {
    try {
      const res = await api.delete(`/detox/relapse/${id}`);
      if (res.data.success) {
        toast.success('Relapse history deleted');
        fetchDetoxData();
        refreshGamification();
      }
    } catch (error) {
      toast.error('Failed to delete history');
    }
  };

  const getEncouragement = (days) => {
    if (days >= 90) return "Master of Focus!";
    if (days >= 30) return "Monthly Champion!";
    if (days >= 7) return "One week strong!";
    if (days >= 1) return "Good start!";
    return "Every minute counts. Stay away from the scroll.";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="text-[#E4405F] mr-2" size={28} />
            Dopamine Detox
          </h1>
          <p className="text-gray-600 mt-1">Track your time away from mindless scrolling.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center lg:text-left">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-8 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E4405F] to-[#f58529]"></div>
            
            {loading ? (
              <p className="text-gray-400">Loading your detox timer...</p>
            ) : detoxData && detoxData.isActive ? (
              <>
                <p className="text-[#E4405F] font-bold tracking-widest uppercase mb-4 text-sm">
                  {getEncouragement(elapsed.days)}
                </p>
                <div className={`flex items-baseline justify-center gap-4 transition-all`}>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-6xl md:text-8xl font-bold text-gray-900">{elapsed.days}</span>
                    <span className="text-gray-500 font-medium mt-2">DAYS</span>
                  </div>
                  <span className="text-4xl text-gray-300 font-light">:</span>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-4xl md:text-6xl font-bold text-[#f58529]">{elapsed.hours.toString().padStart(2, '0')}</span>
                    <span className="text-gray-500 font-medium mt-2 text-sm">HRS</span>
                  </div>
                  <span className="text-4xl text-gray-300 font-light">:</span>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-4xl md:text-6xl font-bold text-[#E4405F]">{elapsed.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-gray-500 font-medium mt-2 text-sm">MINS</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center">
                  <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-semibold text-sm border border-gray-200 shadow-sm">
                    Target Goal: {detoxData.targetDays || 7} Days
                  </div>
                  {elapsed.days >= (detoxData.targetDays || 7) ? (
                    <p className="text-emerald-600 font-bold text-xs mt-2 uppercase tracking-wide flex items-center">
                       🛡️ Shield Active (No Penalty)
                    </p>
                  ) : (
                    <p className="text-red-500 font-bold text-xs mt-2 uppercase tracking-wide">
                       ⚠️ Penalty if relapsed now
                    </p>
                  )}
                </div>

                <div className="mt-8 flex gap-4 w-full max-w-sm">
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
                <Brain size={64} className="text-gray-300 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to disconnect?</h2>
                <p className="text-gray-500 mb-6 max-w-sm text-center">Start your dopamine detox. The timer runs continuously until you relapse.</p>
                <div className="flex flex-col items-center gap-2 mb-8">
                  <label className="text-sm font-semibold text-gray-700">Initial Target Goal (Days)</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={initialTarget} 
                    onChange={(e) => setInitialTarget(parseInt(e.target.value) || 1)}
                    className="w-24 text-center p-2 border border-gray-300 rounded-lg outline-none focus:border-[#E4405F] focus:ring-1 focus:ring-[#E4405F]" 
                  />
                </div>
                <button
                  onClick={startDetox}
                  className="px-10 py-4 bg-[#E4405F] hover:bg-[#c13550] text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 transition-transform active:scale-95"
                >
                  Start Detox
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 bg-red-100 text-red-600">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 flex flex-wrap items-center gap-1">
                          Relapse
                          {entry.app && <span className="text-pink-500 text-xs px-2 py-0.5 bg-pink-50 rounded-full uppercase ml-2">App: {entry.app}</span>}
                          {entry.xpEarned !== undefined && (
                            entry.xpEarned > 0 ? <span className="text-green-600 text-xs font-bold ml-2">(+{entry.xpEarned} XP)</span> : 
                            entry.xpEarned < 0 ? <span className="text-red-600 text-xs font-bold ml-2">({entry.xpEarned} XP Penalty)</span> :
                            <span className="text-emerald-600 text-xs font-bold ml-2">(Shield Used)</span>
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
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-[#E4405F] mb-4">
              <Brain size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {detoxData?.longestStreak || 0} days
            </h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">Longest Detox</p>
            <p className="text-xs text-gray-400 mt-4 px-4">Your all-time best record</p>
          </div>
          
          <div className="bg-pink-50 rounded-[24px] border border-pink-100 p-6 text-center">
             <h3 className="font-bold text-pink-900 mb-2">Why detox helps</h3>
             <p className="text-sm text-pink-700 leading-relaxed">
               Lowering baseline dopamine levels helps you find joy in difficult tasks like reading, working, and exercising. A relapse is just a bump in the road.
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
              <p className="text-gray-600">Be honest with yourself to improve.</p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Which app triggered it?</label>
              <select 
                value={relapseApp}
                onChange={(e) => setRelapseApp(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#E4405F] mb-4 text-sm"
              >
                <option value="">Select App (Optional)</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Twitter/X">Twitter/X</option>
                <option value="YouTube">YouTube Shorts / YouTube</option>
                <option value="Facebook">Facebook</option>
                <option value="Reddit">Reddit</option>
                <option value="Other">Other</option>
              </select>

              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
              <textarea 
                value={relapseNotes}
                onChange={(e) => setRelapseNotes(e.target.value)}
                placeholder="What triggered this? How are you feeling?"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#E4405F] min-h-[100px] text-sm mb-6 resize-none"
              ></textarea>
              
              <div className="space-y-3">
                <button 
                  onClick={handleRelapse}
                  className="w-full py-3.5 bg-[#d93025] hover:bg-[#b3261d] text-white font-bold rounded-xl transition-colors shadow-sm"
                >
                  Confirm Relapse
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

export default DopamineDetoxTracker;
