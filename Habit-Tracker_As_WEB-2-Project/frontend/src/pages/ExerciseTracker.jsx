import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Medal, Plus, Flame, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../services/api';

const ExerciseTracker = () => {
  const { refreshGamification } = useAuth();
  const [formData, setFormData] = useState({
    activityType: 'Running',
    distance: '',
    duration: '',
    calories: '',
    pushupSets: '',
    pushupReps: '',
    squatSets: '',
    squatReps: '',
  });

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    totalDuration: 0,
    totalDistance: 0,
    longestDistance: 0,
    longestDuration: 0,
    currentStreak: 0,
  });
  
  const [chartView, setChartView] = useState('distance'); // 'distance' or 'duration'
  const [deletingId, setDeletingId] = useState(null);

  const sameLocalDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const recentWorkouts = logs
    .filter((log) => sameLocalDay(new Date(log.date), new Date()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  useEffect(() => {
    fetchExerciseData();
  }, []);

  const fetchExerciseData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/exercise/logs'),
        api.get('/exercise/stats')
      ]);

      if (logsRes.data.success) {
        const data = logsRes.data.data;
        setLogs(data);
        
        // Prepare chart data (Group by date, latest 7 days)
        const dailyMaps = {};
        data.forEach(log => {
           const d = new Date(log.date).toISOString().split('T')[0];
           if (!dailyMaps[d]) dailyMaps[d] = { dateStr: d, distance: 0, duration: 0 };
           dailyMaps[d].distance += (log.distance || 0);
           dailyMaps[d].duration += (log.duration || 0);
        });
        
        const sortedDates = Object.keys(dailyMaps).sort();
        const finalChartData = sortedDates.slice(-7).map(d => ({
          date: format(new Date(d), 'MMM d'),
          distance: Number(dailyMaps[d].distance.toFixed(1)),
          duration: Number(dailyMaps[d].duration.toFixed(1))
        }));
        
        setChartData(finalChartData);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch {
      toast.error('Failed to load exercise data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.duration || formData.duration <= 0) {
      toast.error('Please provide a valid duration');
      return;
    }

    try {
      const res = await api.post('/exercise/log', {
        activityType: formData.activityType,
        distance: formData.activityType !== 'General' && formData.distance ? Number(formData.distance) : null,
        duration: Number(formData.duration),
        calories: formData.calories ? Number(formData.calories) : null,
        pushupSets: formData.activityType === 'General' && formData.pushupSets ? Number(formData.pushupSets) : null,
        pushupReps: formData.activityType === 'General' && formData.pushupReps ? Number(formData.pushupReps) : null,
        squatSets: formData.activityType === 'General' && formData.squatSets ? Number(formData.squatSets) : null,
        squatReps: formData.activityType === 'General' && formData.squatReps ? Number(formData.squatReps) : null,
      });

      if (res.data.success) {
        toast.success(`Logged ${formData.distance ? formData.distance + 'km of ' : ''}${formData.activityType}!`);
        setFormData({ activityType: 'Running', distance: '', duration: '', calories: '', pushupSets: '', pushupReps: '', squatSets: '', squatReps: '' });
        fetchExerciseData();
        refreshGamification();
      }
    } catch {
      toast.error('Failed to log exercise');
    }
  };

  const handleDeleteWorkout = async (logId, e) => {
    e.stopPropagation();
    setDeletingId(logId);
    try {
      await api.delete(`/exercise/log/${logId}`);
      toast.success('Workout removed');
      await fetchExerciseData();
      refreshGamification();
    } catch {
      toast.error('Failed to delete workout');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Activity className="text-orange-500 mr-2" size={28} />
          Exercise Tracker
        </h1>
        <p className="text-gray-600 mt-1">Log your workouts and monitor progress dynamically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log Form Area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Plus size={20} className="mr-2 text-indigo-600" /> Log Workout
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                <select 
                  name="activityType" 
                  value={formData.activityType} 
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="Running">Running</option>
                  <option value="Walking">Walking</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Gym">Gym</option>
                  <option value="General">General (Pushups/Squats)</option>
                </select>
              </div>

              {formData.activityType !== 'General' && (
                <div>
                   <label className="block text-sm font-medium text-gray-700">Distance (km) <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                   <input 
                     type="number" 
                     name="distance" 
                     step="0.01"
                     min="0"
                     value={formData.distance} 
                     onChange={handleChange}
                     placeholder="e.g. 5.0"
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                   />
                </div>
              )}

              {formData.activityType === 'General' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pushups (Sets)</label>
                    <input 
                      type="number" name="pushupSets" min="0" value={formData.pushupSets} onChange={handleChange} placeholder="e.g. 3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pushups (Reps)</label>
                    <input 
                      type="number" name="pushupReps" min="0" value={formData.pushupReps} onChange={handleChange} placeholder="e.g. 15"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Squats (Sets)</label>
                    <input 
                      type="number" name="squatSets" min="0" value={formData.squatSets} onChange={handleChange} placeholder="e.g. 3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Squats (Reps)</label>
                    <input 
                      type="number" name="squatReps" min="0" value={formData.squatReps} onChange={handleChange} placeholder="e.g. 20"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              <div>
                 <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                 <input 
                   type="number" 
                   name="duration" 
                   min="1"
                   required
                   value={formData.duration} 
                   onChange={handleChange}
                   placeholder="e.g. 45"
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700">Calories Burnt <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                 <input 
                   type="number" 
                   name="calories" 
                   min="0"
                   value={formData.calories} 
                   onChange={handleChange}
                   placeholder="e.g. 320"
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-orange-500 focus:ring-orange-500"
                 />
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? 'Processing...' : 'Save Workout'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center col-span-2 flex justify-center items-center">
               <Flame className="text-red-500 mr-2" size={28} />
               <div className="text-left">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Streak</h4>
                  <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
               </div>
            </div>
          
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <Medal className="mx-auto text-yellow-500 mb-2" size={24} />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Longest Run</h4>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.longestDistance} <span className="text-sm font-normal text-gray-500">km</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <TrendingUp className="mx-auto text-emerald-500 mb-2" size={24} />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Longest Time</h4>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.longestDuration} <span className="text-sm font-normal text-gray-500">min</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <Flame className="mx-auto text-orange-500 mb-2" size={24} />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Highest Calories</h4>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.highestCalories ?? 0} <span className="text-sm font-normal text-gray-500">kcal</span></p>
            </div>
          </div>
        </div>

        {/* Charts Area */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity ({chartView === 'distance' ? 'km' : 'mins'})</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setChartView('distance')}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${chartView === 'distance' ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >Distance</button>
              <button 
                onClick={() => setChartView('duration')}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${chartView === 'duration' ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >Duration</button>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
             {chartData.length === 0 && !loading ? (
                 <div className="flex h-full items-center justify-center text-gray-400">No recent activity to display</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    />
                    <Area type="monotone" dataKey={chartView} stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                  </AreaChart>
                </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full text-left">
        <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-4 mb-2">
          Recent Workouts
        </h2>
        <p className="text-xs text-gray-500 mb-4">Today&apos;s logged sessions</p>
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible">
          {recentWorkouts.map((log) => (
            <div
              key={log._id}
              className="flex justify-between items-center gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <CalendarIcon size={16} className="mt-1 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{log.activityType}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(log.date), 'MMM d, yyyy')}
                    <span className="text-gray-400 mx-1">·</span>
                    {format(new Date(log.date), 'h:mm a')}
                  </p>
                  {(log.distance != null || log.calories != null || log.activityType === 'General') && (
                    <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                      {log.activityType !== 'General' && log.distance != null && <span>{log.distance} km</span>}
                      {log.activityType === 'General' && (
                        <span>
                          {log.pushupSets ? `${log.pushupSets}x${log.pushupReps} Pushups` : ''} 
                          {log.pushupSets && log.squatSets ? ' · ' : ''}
                          {log.squatSets ? `${log.squatSets}x${log.squatReps} Squats` : ''}
                        </span>
                      )}
                      {(log.distance != null || log.activityType === 'General') && log.calories != null && <span> · </span>}
                      {log.calories != null && <span>{log.calories} kcal</span>}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                  {log.duration ?? 0} min
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteWorkout(log._id, e)}
                  disabled={deletingId === log._id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label="Delete workout"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {recentWorkouts.length === 0 && (
            <p className="text-gray-500 text-center py-8 border border-dashed border-gray-200 rounded-lg">
              No workouts logged today.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseTracker;
