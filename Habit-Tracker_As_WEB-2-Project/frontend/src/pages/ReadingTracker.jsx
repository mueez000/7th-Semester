import { useState, useEffect } from 'react';
import { BookOpen, Book, Award, Calendar as CalendarIcon, Trash2, Plus, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';

const ReadingTracker = () => {
  const { refreshGamification } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bookTitle: '',
    pagesRead: '',
    duration: '',
    notes: '',
    isCompleted: false
  });

  const [monthlyStats, setMonthlyStats] = useState({
    totalPagesThisMonth: 0,
    avgDaily: 0,
    currentStreak: 0,
    booksFinished: 0,
    totalPagesAllTime: 0
  });

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchReadingData();
  }, []);

  const fetchReadingData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/reading'),
        api.get('/reading/stats')
      ]);

      if (logsRes.data.success) {
        setLogs(logsRes.data.data);
      }
      
      if (statsRes.data.success) {
        setMonthlyStats(statsRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load reading data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const quickAddPages = (amount) => {
    setFormData(prev => ({ 
      ...prev, 
      pagesRead: prev.pagesRead ? (parseInt(prev.pagesRead) + amount).toString() : amount.toString() 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bookTitle || !formData.pagesRead) {
      toast.error('Book title and pages read are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        bookTitle: formData.bookTitle,
        pagesRead: parseInt(formData.pagesRead),
        duration: formData.duration ? parseInt(formData.duration) : null,
        notes: formData.notes,
        isCompleted: formData.isCompleted
      };

      const res = await api.post('/reading', payload);
      if (res.data.success) {
        toast.success('Reading logged successfully!');
        setFormData({ bookTitle: '', pagesRead: '', duration: '', notes: '', isCompleted: false });
        fetchReadingData();
        refreshGamification();
      }
    } catch (error) {
      toast.error('Failed to log reading');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id, e) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await api.delete(`/reading/${id}`);
      toast.success('Log removed');
      await fetchReadingData();
      refreshGamification();
    } catch (err) {
      toast.error('Failed to delete log');
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (title) => {
    if (!title) return 'B';
    return title.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRandomColor = (str) => {
    const colors = [
      'bg-amber-600', 'bg-orange-600', 'bg-red-600', 
      'bg-yellow-600', 'bg-lime-600', 'bg-green-600',
      'bg-emerald-600', 'bg-teal-600'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const today = new Date().setHours(0,0,0,0);
  const todayLogs = logs.filter(log => new Date(log.date).setHours(0,0,0,0) === today);
  const todayTotalPages = todayLogs.reduce((acc, log) => acc + log.pagesRead, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="text-[#b45309] mr-2" size={28} />
          Reading Tracker
        </h1>
        <p className="text-gray-600 mt-1">Log your daily reading and expand your mind.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Plus className="mr-2 text-[#b45309]" /> Log New Reading
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Book Title *</label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Atomic Habits"
                    className="w-full p-3 bg-gray-50 border border-[#dadce0] rounded-xl outline-none focus:ring-2 focus:ring-[#b45309] transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pages Read *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="pagesRead"
                      value={formData.pagesRead}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="1"
                      className="w-full p-3 bg-gray-50 border border-[#dadce0] rounded-xl outline-none focus:ring-2 focus:ring-[#b45309] transition"
                      required
                    />
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[10, 20, 30, 50].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => quickAddPages(amount)}
                        className="flex-1 py-1 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition"
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="Optional time spent reading"
                  min="1"
                  className="w-full p-3 bg-gray-50 border border-[#dadce0] rounded-xl outline-none focus:ring-2 focus:ring-[#b45309] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any key takeaways or thoughts? (Optional)"
                  rows="2"
                  className="w-full p-3 bg-gray-50 border border-[#dadce0] rounded-xl outline-none focus:ring-2 focus:ring-[#b45309] transition resize-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-xl border border-amber-100">
                <input
                  type="checkbox"
                  name="isCompleted"
                  id="isCompleted"
                  checked={formData.isCompleted}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#b45309] rounded focus:ring-[#b45309]"
                />
                <label htmlFor="isCompleted" className="text-sm font-semibold text-amber-900 cursor-pointer">
                  I have finished this book completely
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#b45309] hover:bg-[#92400e] text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
              >
                {submitting ? 'Saving...' : 'Save Reading Log'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 text-left">
            <div className="flex justify-between items-end border-b pb-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Logs</h2>
              <span className="text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                Today: {todayTotalPages} pages
              </span>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {logs.map((log) => (
                <div key={log._id} className="flex justify-between items-start gap-4 p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-[#dadce0] transition-colors">
                  <div className="flex items-start text-gray-600 min-w-0 flex-1">
                    <div className={`w-12 h-16 rounded-md shadow-sm flex items-center justify-center mr-4 shrink-0 text-white font-bold text-sm ${getRandomColor(log.bookTitle)}`}>
                      {getInitials(log.bookTitle)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 truncate flex items-center" title={log.bookTitle}>
                        {log.bookTitle}
                        {log.isCompleted && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center"><CheckCircle size={10} className="mr-1"/> Finished</span>}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <CalendarIcon size={12} className="mr-1" />
                        {format(new Date(log.date), 'MMM d, yyyy - h:mm a')}
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 italic border-l-2 border-amber-200 pl-2">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="font-bold text-[#b45309] bg-amber-50 px-3 py-1 rounded-full text-sm flex items-center">
                      <BookOpen size={14} className="mr-1" /> {log.pagesRead} pgs
                    </div>
                    {log.duration && (
                      <div className="text-xs text-gray-500 font-medium">
                        {log.duration} mins
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteLog(log._id, e)}
                      disabled={deletingId === log._id}
                      className="p-1.5 mt-1 rounded-lg text-gray-400 hover:text-[#d93025] hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Delete log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {logs.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                  <Book size={48} className="text-gray-300 mb-3" />
                  <p>No reading logs yet. Start reading!</p>
                </div>
              )}
              {loading && <p className="text-center py-4 text-gray-400">Loading...</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#b45309]/10 rounded-full flex items-center justify-center text-[#b45309] mb-4">
              <span className="text-2xl font-bold">{monthlyStats.totalPagesThisMonth}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Pages This Month</h3>
            <p className="text-xs text-gray-400 mt-2 px-4">Your total reading volume for the current month</p>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-[#dadce0] p-6 grid grid-cols-2 gap-4">
             <div className="col-span-2 flex justify-between items-center py-2 border-b border-gray-100 mb-2">
                <span className="text-gray-600 font-medium flex items-center"><Award size={16} className="mr-2 text-amber-500"/> Current Streak</span>
                <span className="font-bold text-gray-900">{monthlyStats.currentStreak} days</span>
             </div>
             <div className="col-span-2 flex justify-between items-center py-2 border-b border-gray-100 mb-2">
                <span className="text-gray-600 font-medium">Daily Avg</span>
                <span className="font-bold text-gray-900">{monthlyStats.avgDaily} pgs</span>
             </div>
             <div className="col-span-2 flex justify-between items-center py-2 mb-2">
                <span className="text-gray-600 font-medium">Est. Books</span>
                <span className="font-bold text-[#b45309]">{monthlyStats.booksFinished}</span>
             </div>
          </div>
          
          <div className="bg-amber-50 rounded-[24px] border border-amber-100 p-6 text-center">
             <h3 className="font-bold text-amber-900 mb-2">Did you know?</h3>
             <p className="text-sm text-amber-800 leading-relaxed">
               Reading just 20 pages a day equates to about 30 books a year. Small daily habits create massive long-term results.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingTracker;
