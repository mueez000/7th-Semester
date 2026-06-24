import { useState, useEffect } from 'react';
import { Moon, CheckCircle, Circle, Trophy, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const initialPrayers = [
  { id: 'fajr', name: 'Fajr', time: 'Dawn', status: 'none' },
  { id: 'zuhr', name: 'Zuhr', time: 'Midday', status: 'none' },
  { id: 'asr', name: 'Asr', time: 'Afternoon', status: 'none' },
  { id: 'maghrib', name: 'Maghrib', time: 'Sunset', status: 'none' },
  { id: 'isha', name: 'Isha', time: 'Night', status: 'none' },
];

const NamazTracker = () => {
  const { refreshGamification } = useAuth();
  const [prayers, setPrayers] = useState(initialPrayers);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    fullDaysStreak: 0,
    currentMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  });
  
  useEffect(() => {
    fetchNamazData();
  }, []);

  const fetchNamazData = async () => {
    try {
      setLoading(true);
      const [todayRes, monthlyRes] = await Promise.all([
        api.get('/namaz/today'),
        api.get('/namaz/monthly')
      ]);

      if (todayRes.data.success) {
        const todayData = todayRes.data.data;
        setPrayers(prev => prev.map(p => ({
          ...p,
          status: todayData[p.id] || 'none'
        })));
      }

      if (monthlyRes.data.success) {
        setStats(prev => ({ ...prev, ...monthlyRes.data.data }));
      }
    } catch (error) {
      toast.error('Failed to load prayer data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrayerStatus = async (id, newStatus) => {
    const prayerToUpdate = prayers.find(p => p.id === id);
    if (!prayerToUpdate || prayerToUpdate.status === newStatus) return;
    
    const previousStatus = prayerToUpdate.status;

    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );

    try {
      await api.post('/namaz/log', { prayer: id, status: newStatus });
      if (newStatus === 'prayed' || newStatus === 'kaza') {
        toast.success(`${prayerToUpdate.name} marked as ${newStatus}!`);
      }

      const monthlyRes = await api.get('/namaz/monthly');
      if (monthlyRes.data.success) {
        setStats((prev) => ({ ...prev, ...monthlyRes.data.data }));
      }
      refreshGamification();
    } catch (error) {
      toast.error('Failed to update prayer');
      setPrayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: previousStatus } : p))
      );
    }
  };

  const completedCount = prayers.filter(p => p.status === 'prayed' || p.status === 'kaza').length;
  
  // Dynamic percentage calculation
  const daysPassed = new Date().getDate();
  const totalPossibleMonth = daysPassed * 5;
  const percentage = totalPossibleMonth > 0 ? Math.round((stats.totalCompleted / totalPossibleMonth) * 100) : 0;
  const safePercentage = percentage > 100 ? 100 : percentage;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Moon className="text-emerald-600 mr-2" size={28} />
            Namaz Tracker
          </h1>
          <p className="text-gray-600 mt-1">Track your daily 5 prayers.</p>
        </div>
        <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 flex items-center">
          <Calendar className="text-gray-400 mr-2" size={18} />
          <span className="font-medium text-gray-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Tracker Area - Takes 2 columns on desktop */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Today's Prayers</h2>
              <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                {completedCount}/5 Completed
              </span>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8"><span className="text-gray-500">Loading prayers...</span></div>
            ) : (
              <div className="space-y-3">
                {prayers.map((prayer) => (
                  <div 
                    key={prayer.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all border ${
                      prayer.status === 'prayed' || prayer.status === 'kaza'
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="mb-3 sm:mb-0">
                      <h3 className={`text-lg font-bold ${prayer.status === 'prayed' || prayer.status === 'kaza' ? 'text-emerald-800' : 'text-gray-800'}`}>
                        {prayer.name}
                      </h3>
                      <p className={`text-sm ${prayer.status === 'prayed' || prayer.status === 'kaza' ? 'text-emerald-600/80' : 'text-gray-500'}`}>
                        {prayer.time}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updatePrayerStatus(prayer.id, 'none')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${prayer.status === 'none' ? 'bg-gray-200 text-gray-800' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                      >
                        Not Prayed
                      </button>
                      <button 
                        onClick={() => updatePrayerStatus(prayer.id, 'kaza')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${prayer.status === 'kaza' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`}
                      >
                        {prayer.status === 'kaza' && <CheckCircle size={16} className="mr-1" />}
                        Kaza
                      </button>
                      <button 
                        onClick={() => updatePrayerStatus(prayer.id, 'prayed')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${prayer.status === 'prayed' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`}
                      >
                        {prayer.status === 'prayed' && <CheckCircle size={16} className="mr-1" />}
                        Prayed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Space - Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
              <Trophy size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{stats.fullDaysStreak} Days</h3>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">Current Streak</p>
            <p className="text-xs text-gray-400 mt-4 px-4">Consecutive days of completing all 5 prayers.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{stats.currentMonth} Stats</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Prayers Read</span>
                <span className="font-bold text-gray-900">{stats.totalCompleted}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Avg Prayers / Day</span>
                <span className="font-bold text-emerald-700 text-lg">
                  {new Date().getDate() > 0 ? (stats.totalCompleted / new Date().getDate()).toFixed(1) : '0'}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ 5</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-bold text-gray-900">
                  {safePercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NamazTracker;
