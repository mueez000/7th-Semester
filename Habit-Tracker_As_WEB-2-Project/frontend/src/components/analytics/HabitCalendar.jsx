import { useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isFuture, isBefore, addMonths, subMonths, getDay 
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, CheckCircle, Clock, Moon, Activity, Smartphone, BookOpen, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HabitCalendar = ({ calendarData, selectedMonth, onMonthChange }) => {
  const { user } = useAuth();
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [activeHabit, setActiveHabit] = useState('streak');

  const start = startOfMonth(selectedMonth);
  const end = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start); // 0 = Sunday

  const creationDate = new Date(user?.createdAt || user?.dob || new Date());
  
  const canGoPrev = !isBefore(startOfMonth(subMonths(selectedMonth, 1)), startOfMonth(creationDate));
  const canGoNext = !isFuture(startOfMonth(addMonths(selectedMonth, 1)));

  const handlePrev = () => { if (canGoPrev) onMonthChange(subMonths(selectedMonth, 1)); };
  const handleNext = () => { if (canGoNext) onMonthChange(addMonths(selectedMonth, 1)); };

  // Helper to format local date consistently
  const getLocalDateStr = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const emptyStateClass = { className: 'bg-gray-50 border-gray-200 border-dashed hover:border-gray-300', style: { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)' } };

  /**
   * Get the cell color classes based on selected habit and day data.
   * Returns Tailwind/CSS class string.
   */
  const getCellStyle = (dateStr, isFutureDate) => {
    if (isFutureDate) return { className: 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-100 border-dashed', style: {} };

    if (activeHabit === 'namaz') {
      const count = calendarData?.namazCounts?.[dateStr];
      if (count === undefined || count === null) return emptyStateClass;
      if (count === 0) return { className: 'border-red-300 shadow-sm', style: { backgroundColor: '#ffcdd2' } };
      if (count === 1) return { className: 'border-yellow-300 shadow-sm', style: { backgroundColor: '#fff9c4' } };
      if (count === 2) return { className: 'border-orange-300 shadow-sm', style: { backgroundColor: '#ffe0b2' } };
      if (count === 3) return { className: 'border-yellow-400 shadow-sm', style: { backgroundColor: '#fbbf24' } };
      if (count === 4) return { className: 'border-green-300 shadow-sm', style: { backgroundColor: '#c8e6c9' } };
      return { className: 'border-green-500 shadow-sm', style: { backgroundColor: '#a5d6a7' } };
    }

    if (activeHabit === 'work') {
      const minutes = calendarData?.workMinutes?.[dateStr];
      if (minutes === undefined || minutes === null) return emptyStateClass;
      if (minutes === 0) return { className: 'border-red-300 shadow-sm', style: { backgroundColor: '#ffcdd2' } };
      if (minutes < 30) return { className: 'border-yellow-300 shadow-sm', style: { backgroundColor: '#fff9c4' } };
      if (minutes < 60) return { className: 'border-orange-300 shadow-sm', style: { backgroundColor: '#ffe0b2' } };
      if (minutes < 120) return { className: 'border-green-300 shadow-sm', style: { backgroundColor: '#c8e6c9' } };
      return { className: 'border-green-500 shadow-sm', style: { backgroundColor: '#a5d6a7' } };
    }


    if (activeHabit === 'exercise') {
      const minutes = calendarData?.exerciseMinutes?.[dateStr];
      if (minutes === undefined || minutes === null) return emptyStateClass;
      if (minutes === 0) return { className: 'border-red-300 shadow-sm', style: { backgroundColor: '#ffcdd2' } };
      if (minutes < 20) return { className: 'border-yellow-300 shadow-sm', style: { backgroundColor: '#fff9c4' } };
      if (minutes < 40) return { className: 'border-orange-300 shadow-sm', style: { backgroundColor: '#ffe0b2' } };
      if (minutes < 60) return { className: 'border-green-300 shadow-sm', style: { backgroundColor: '#c8e6c9' } };
      return { className: 'border-green-500 shadow-sm', style: { backgroundColor: '#a5d6a7' } };
    }

    if (activeHabit === 'productivity') {
      const count = calendarData?.productivityCounts?.[dateStr];
      if (count === undefined || count === null) return emptyStateClass;
      if (count === 0) return { className: 'border-red-300 shadow-sm', style: { backgroundColor: '#ffcdd2' } };
      if (count < 3) return { className: 'border-yellow-300 shadow-sm', style: { backgroundColor: '#fff9c4' } };
      if (count < 5) return { className: 'border-orange-300 shadow-sm', style: { backgroundColor: '#ffe0b2' } };
      if (count < 8) return { className: 'border-green-300 shadow-sm', style: { backgroundColor: '#c8e6c9' } };
      return { className: 'border-green-500 shadow-sm', style: { backgroundColor: '#a5d6a7' } };
    }

    if (activeHabit === 'reading') {
      const pages = calendarData?.readingPages?.[dateStr];
      if (pages === undefined || pages === null) return emptyStateClass;
      if (pages === 0) return { className: 'border-amber-100 shadow-sm', style: { backgroundColor: '#fff8e1' } };
      if (pages < 10) return { className: 'border-amber-200 shadow-sm', style: { backgroundColor: '#ffecb3' } };
      if (pages < 30) return { className: 'border-amber-300 shadow-sm', style: { backgroundColor: '#ffe082' } };
      if (pages < 50) return { className: 'border-amber-500 shadow-sm', style: { backgroundColor: '#ffca28' } };
      return { className: 'border-amber-600 shadow-sm', style: { backgroundColor: '#ffb300' } };
    }


    if (activeHabit === 'streak') {
      const isActive = calendarData?.streak?.includes(dateStr);
      const isRelapse = calendarData?.streakRelapses?.includes(dateStr);
      if (!isActive) return emptyStateClass;
      if (isRelapse) return { className: 'border-red-500 shadow-sm', style: { backgroundColor: '#ef5350' } }; // red for relapse
      return { className: 'border-purple-500 shadow-sm', style: { backgroundColor: '#d8b4fe' } }; // purple for active
    }

    // Default: white
    return emptyStateClass;
  };

  const hasAnyData = (dateStr) => {
    if (activeHabit === 'namaz') return calendarData?.namazCounts?.[dateStr] !== undefined;
    if (activeHabit === 'work') return calendarData?.workMinutes?.[dateStr] !== undefined;
    if (activeHabit === 'exercise') return calendarData?.exerciseMinutes?.[dateStr] !== undefined;
    if (activeHabit === 'productivity') return calendarData?.productivityCounts?.[dateStr] !== undefined;
    if (activeHabit === 'reading') return calendarData?.readingPages?.[dateStr] !== undefined;
    if (activeHabit === 'streak') return calendarData?.streak?.includes(dateStr);
    return false;
  };

  const getDayDetails = (dateStr) => {
    if (!calendarData) return [];
    const details = [];
    if (calendarData.namaz?.includes(dateStr)) details.push({ icon: <Moon size={14}/>, label: 'Prayers Logged', color: 'text-emerald-600' });
    if (calendarData.work?.includes(dateStr)) details.push({ icon: <Clock size={14}/>, label: 'Work Session', color: 'text-blue-600' });
    if (calendarData.exercise?.includes(dateStr)) details.push({ icon: <Activity size={14}/>, label: 'Exercise', color: 'text-rose-600' });
    if (calendarData.productivity?.includes(dateStr)) details.push({ icon: <CheckCircle size={14}/>, label: 'Tasks Completed', color: 'text-amber-600' });
    if (calendarData.reading?.includes(dateStr)) details.push({ icon: <BookOpen size={14}/>, label: 'Reading Logged', color: 'text-amber-600' });
    if (calendarData.streak?.includes(dateStr)) details.push({ icon: <Shield size={14}/>, label: 'Streak Active', color: 'text-purple-600' });
    if (calendarData.streakRelapses?.includes(dateStr)) details.push({ icon: <AlertTriangle size={14}/>, label: 'Streak Relapsed', color: 'text-red-600' });
    return details;
  };

  const getCellText = (dateStr) => {
    if (activeHabit === 'namaz') {
      const c = calendarData?.namazCounts?.[dateStr];
      return c !== undefined && c !== null ? `${c} pray` : null;
    }
    if (activeHabit === 'work') {
      const m = calendarData?.workMinutes?.[dateStr];
      if (m === undefined || m === null) return null;
      return `${parseFloat((m / 60).toFixed(1))}h`;
    }
    if (activeHabit === 'exercise') {
      const m = calendarData?.exerciseMinutes?.[dateStr];
      return m !== undefined && m !== null ? `${m}m` : null;
    }
    if (activeHabit === 'productivity') {
      const c = calendarData?.productivityCounts?.[dateStr];
      return c !== undefined && c !== null ? `${c} task` : null;
    }
    if (activeHabit === 'reading') {
      const p = calendarData?.readingPages?.[dateStr];
      return p !== undefined && p !== null ? `${p} pg` : null;
    }
    if (activeHabit === 'streak') {
      if (calendarData?.streakRelapses?.includes(dateStr)) return 'Relapsed';
      if (calendarData?.streak?.includes(dateStr)) {
         return calendarData.streakDayNumbers?.[dateStr] ? `Day ${calendarData.streakDayNumbers[dateStr]}` : 'Active';
      }
      return null;
    }
    return null;
  };

  return (
    <div className="google-card p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#202124]">{format(selectedMonth, 'MMMM yyyy')}</h2>
          <div className="mt-1">
             <select 
               value={activeHabit} 
               onChange={e => setActiveHabit(e.target.value)}
               className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-semibold text-[#5f6368] hover:border-gray-300 focus:outline-none focus:border-[#1a73e8] transition"
             >
               <option value="productivity">Tasks Data</option>
               <option value="namaz">Namaz Data</option>
               <option value="exercise">Exercise Data</option>
               <option value="reading">Reading Data</option>
               <option value="work">Deep Work Data</option>
               <option value="streak">Commitment Streak</option>
             </select>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handlePrev} 
            disabled={!canGoPrev}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="text-[#3c4043]" />
          </button>
          <button 
            onClick={handleNext} 
            disabled={!canGoNext}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="text-[#3c4043]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-[#5f6368] uppercase pb-2">
            {day}
          </div>
        ))}
        
        {/* Padding for start of month */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`pad-${i}`} className="h-16 sm:h-20 md:h-24 bg-transparent rounded-lg"></div>
        ))}

        {daysInMonth.map(date => {
          const dateStr = getLocalDateStr(date);
          const isFutureDate = isFuture(date);
          const { className: colorClass, style: colorStyle } = getCellStyle(dateStr, isFutureDate);
          const cellText = !isFutureDate ? getCellText(dateStr) : null;
          
          return (
            <div 
              key={dateStr}
              onClick={() => { if (!isFutureDate) setSelectedDateStr(dateStr) }}
              style={colorStyle}
              className={`h-16 sm:h-20 md:h-24 rounded-xl border flex flex-col justify-start p-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${isFutureDate ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-100 border-dashed' : colorClass}`}
            >
               <span className="text-sm font-semibold opacity-80">{format(date, 'd')}</span>
               {cellText && (
                 <span className="mt-auto text-[11px] sm:text-xs font-bold text-gray-800 bg-white/40 px-1 py-0.5 rounded backdrop-blur-sm truncate text-center">
                   {cellText}
                 </span>
               )}
            </div>
          );
        })}
      </div>

      {/* Detail Modal overlay */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDateStr(null)}>
          <div className="google-card w-full max-w-sm p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-[#1a73e8] text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{format(new Date(selectedDateStr), 'MMM d, yyyy')}</h3>
                  <p className="opacity-90 mt-1">Activity Summary</p>
                </div>
                <button onClick={() => setSelectedDateStr(null)} className="p-1 rounded-full hover:bg-black/10 text-white"><X size={20}/></button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {getDayDetails(selectedDateStr).length === 0 ? (
                <p className="text-[#5f6368] text-center py-6 text-sm">No habits logged on this date.</p>
              ) : (
                getDayDetails(selectedDateStr).map((detail, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className={`p-2 rounded-full bg-white shadow-sm mr-3 ${detail.color}`}>{detail.icon}</div>
                    <span className="font-semibold text-gray-800 text-sm">{detail.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HabitCalendar;
