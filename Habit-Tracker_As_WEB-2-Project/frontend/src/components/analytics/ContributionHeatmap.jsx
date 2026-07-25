import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, startOfDay, isSameDay, isBefore } from 'date-fns';
import { Layers } from 'lucide-react';
import api from '../../services/api';

const ContributionHeatmap = ({ heatmapData }) => {
  const [mode, setMode] = useState('work'); // 'work' | 'tasks' | 'streak' | 'trades'
  const [relapseHistory, setRelapseHistory] = useState([]);
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        const [statusRes, historyRes] = await Promise.all([
          api.get('/streak/status'),
          api.get('/streak/history')
        ]);
        if (statusRes.data.success) setStreakData(statusRes.data.data);
        if (historyRes.data.success) setRelapseHistory(historyRes.data.data.relapseHistory || []);
      } catch (e) {
        console.error('Streak heatmap load failed', e);
      }
    };
    fetchStreakData();
  }, []);

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    const arr = [];
    for (let i = 364; i >= 0; i--) {
      arr.push(subDays(today, i));
    }
    return arr;
  }, []);

  const earliestDate = useMemo(() => {
    const today = startOfDay(new Date());
    let earliest = today;
    if (streakData && streakData.startTime) {
      const st = startOfDay(new Date(streakData.startTime));
      if (isBefore(st, earliest)) earliest = st;
    }
    if (relapseHistory.length > 0) {
      const firstRelapse = startOfDay(new Date(relapseHistory[relapseHistory.length - 1].date));
      if (isBefore(firstRelapse, earliest)) earliest = firstRelapse;
      
      if (relapseHistory[relapseHistory.length - 1].previousStartTime) {
          const firstStart = startOfDay(new Date(relapseHistory[relapseHistory.length - 1].previousStartTime));
          if (isBefore(firstStart, earliest)) earliest = firstStart;
      }
    }
    return earliest;
  }, [relapseHistory, streakData]);

  const getDayStatus = (date) => {
    if (isBefore(date, earliestDate)) return 'inactive';
    const isRelapse = relapseHistory.some(r => isSameDay(new Date(r.date), date));
    if (isRelapse) return 'relapse';
    return 'clean';
  };

  const getIntensityClass = (date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    if (mode === 'work') {
      const hours = heatmapData?.work?.[dStr] || 0;
      if (hours === 0) return 'bg-[#ebedf0]';
      if (hours <= 2) return 'bg-[#9be9a8]'; // using github green/blue vibes
      if (hours <= 5) return 'bg-[#40c463]';
      if (hours <= 8) return 'bg-[#30a14e]';
      return 'bg-[#216e39]';
    } else if (mode === 'tasks') {
      const count = heatmapData?.tasks?.[dStr] || 0;
      if (count === 0) return 'bg-[#ebedf0]';
      if (count <= 2) return 'bg-[#fcdab7]'; // orange shades
      if (count <= 5) return 'bg-[#f6a059]';
      if (count <= 8) return 'bg-[#e56b25]';
      return 'bg-[#a34412]';
    } else if (mode === 'trades') {
      const count = heatmapData?.trades?.[dStr] || 0;
      if (count === 0) return 'bg-[#ebedf0]';
      if (count <= 2) return 'bg-[#d8b4fe]'; // purple shades
      if (count <= 5) return 'bg-[#a855f7]';
      if (count <= 8) return 'bg-[#7e22ce]';
      return 'bg-[#4c1d95]';
    } else {
      const status = getDayStatus(date);
      if (status === 'inactive') return 'bg-[#ebedf0]';
      if (status === 'relapse') return 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10 relative scale-110'; // Red for relapse
      return 'bg-[#22c55e]'; // Green for clean
    }
  };

  const getTooltipText = (date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, 'MMM d, yyyy');
    if (mode === 'work') {
      const hours = heatmapData?.work?.[dStr] || 0;
      return `${hours.toFixed(1)} hours on ${displayDate}`;
    } else if (mode === 'tasks') {
      const count = heatmapData?.tasks?.[dStr] || 0;
      return `${count} tasks on ${displayDate}`;
    } else if (mode === 'trades') {
      const count = heatmapData?.trades?.[dStr] || 0;
      return `${count} trades on ${displayDate}`;
    } else {
      const status = getDayStatus(date);
      if (status === 'inactive') return `No tracking on ${displayDate}`;
      if (status === 'relapse') return `🚨 Relapse on ${displayDate}`;
      return `✅ Clean day on ${displayDate}`;
    }
  };

  // Group into weeks (columns)
  const weeks = [];
  let currentWeek = [];
  days.forEach((day, index) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || index === days.length - 1) { // Saturday ends the week in standard heatmaps
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500 mb-8 overflow-x-auto">
      <div className="flex justify-between items-center mb-6 min-w-[600px]">
        <h3 className="text-lg font-bold text-[#202124] flex items-center">
          <Layers className="text-[#1a73e8] mr-2" size={20} />
          Contribution Heatmap
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('work')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'work' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Deep Work
          </button>
          <button
            onClick={() => setMode('tasks')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'tasks' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setMode('streak')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'streak' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Relapse / Streak
          </button>
          <button
            onClick={() => setMode('trades')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'trades' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Trades
          </button>
        </div>
      </div>

      <div className="flex gap-1 min-w-[750px] overflow-hidden pb-2">
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
             {/* Add empty blocks to align the first week correctly if it doesn't start on Sunday */}
            {wIndex === 0 && Array.from({ length: 7 - week.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-3 h-3 bg-transparent rounded-sm"></div>
            ))}
            {week.map((day, dIndex) => (
              <div
                key={day.toISOString()}
                className={`w-3 h-3 rounded-sm ${getIntensityClass(day)} transition-colors cursor-pointer hover:ring-2 hover:ring-gray-400`}
                title={getTooltipText(day)}
              ></div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 text-xs text-gray-500 min-w-[600px]">
        {mode === 'streak' ? (
           <div className="flex items-center gap-2">
             <span>Inactive</span>
             <div className="w-3 h-3 bg-[#ebedf0] rounded-sm"></div>
             <span className="ml-2">Clean</span>
             <div className="w-3 h-3 bg-[#22c55e] rounded-sm"></div>
             <span className="ml-2">Relapse</span>
             <div className="w-3 h-3 bg-[#ef4444] shadow-[0_0_4px_rgba(239,68,68,0.5)] rounded-sm"></div>
           </div>
        ) : (
           <div className="flex items-center gap-2">
             <span>Less</span>
             <div className="flex gap-1">
                {mode === 'work' ? (
                   <>
                     <div className="w-3 h-3 rounded-sm bg-[#ebedf0]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#9be9a8]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#40c463]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#30a14e]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#216e39]"></div>
                   </>
                ) : (
                   <>
                     <div className="w-3 h-3 rounded-sm bg-[#ebedf0]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#fcdab7]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#f6a059]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#e56b25]"></div>
                     <div className="w-3 h-3 rounded-sm bg-[#a34412]"></div>
                   </>
                )}
             </div>
             <span>More</span>
           </div>
        )}
        <span>Showing last 365 days</span>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
