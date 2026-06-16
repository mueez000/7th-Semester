import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Activity, Briefcase, BookOpen, Smartphone, CheckSquare } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DailyTimeline = ({ selectedDate, onDateChange }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [selectedDate]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await api.get(`/analytics/daily-timeline?date=${dateStr}`);
      if (res.data.success) {
        setTimelineEvents(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load daily timeline');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Deep Work': return <Briefcase size={16} />;
      case 'Exercise': return <Activity size={16} />;
      case 'Task': return <CheckSquare size={16} />;
      case 'Social Media': return <Smartphone size={16} />;
      case 'Reading': return <BookOpen size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="bg-[#1e1e1e] rounded-3xl shadow-lg border border-[#2d2d2d] p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#2d2d2d] pb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center tracking-wide uppercase text-sm">
            <span className="p-2 bg-blue-500/10 rounded-lg mr-3 text-blue-400">
              <Clock size={20} />
            </span>
            24-Hour Timeline
          </h2>
          <p className="text-sm text-[#9ca3af] mt-2 ml-11">
            Visualize exactly when you performed your habits to build time-based discipline.
          </p>
        </div>
        <div className="flex items-center bg-[#121212] rounded-xl p-1 border border-[#3d3d3d]">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              onDateChange(d);
            }}
            className="px-4 py-2 hover:bg-[#252525] rounded-lg transition text-sm font-medium text-gray-300"
          >
            Prev Day
          </button>
          <div className="px-6 py-2 font-bold text-blue-400 text-sm border-x border-[#2d2d2d]">
            {format(selectedDate, 'MMM d, yyyy')}
          </div>
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              if (d <= new Date()) {
                onDateChange(d);
              }
            }}
            disabled={new Date(selectedDate).toDateString() === new Date().toDateString()}
            className="px-4 py-2 hover:bg-[#252525] rounded-lg transition text-sm font-medium text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Next Day
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
          <Clock size={48} className="mb-4 text-[#2d2d2d]" />
          <p className="font-medium text-gray-400">No habits logged on this date.</p>
          <p className="text-sm mt-1 opacity-70">Discipline starts by showing up!</p>
        </div>
      ) : (
        <div className="relative pl-4 md:pl-8 py-4">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1e1e1e] via-blue-500/30 to-[#1e1e1e]"></div>

          <div className="space-y-8">
            {timelineEvents.map((event, idx) => (
              <div key={event.id || idx} className="relative flex items-start group">
                <div 
                  className="absolute left-2 md:left-6 w-8 h-8 rounded-full flex items-center justify-center -translate-x-1/2 bg-[#121212] border-2 shadow-lg z-10 transition-transform group-hover:scale-110"
                  style={{ borderColor: event.color, color: event.color }}
                >
                  {getIcon(event.type)}
                </div>
                
                <div className="ml-10 md:ml-16 flex-1 bg-[#121212] hover:bg-[#1a1a1a] p-5 rounded-2xl border border-[#2d2d2d] hover:border-[#3d3d3d] hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <h4 className="font-bold text-gray-100 flex items-center gap-2 text-lg">
                        {event.type}
                        {event.title && (
                          <span className="text-sm font-medium bg-[#1e1e1e] border border-[#3d3d3d] px-3 py-1 rounded-md text-gray-300 shadow-inner">
                            {event.title}
                          </span>
                        )}
                      </h4>
                      <p className="text-gray-400 text-sm mt-2 font-medium flex items-center gap-2">
                        <Clock size={14} />
                        {format(new Date(event.time), 'h:mm a')}
                      </p>
                    </div>
                    {event.duration > 0 && (
                      <div 
                        className="px-4 py-1.5 rounded-md text-sm font-bold shadow-inner border border-[#3d3d3d]"
                        style={{ backgroundColor: `${event.color}15`, color: event.color }}
                      >
                        {event.duration} mins
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTimeline;
