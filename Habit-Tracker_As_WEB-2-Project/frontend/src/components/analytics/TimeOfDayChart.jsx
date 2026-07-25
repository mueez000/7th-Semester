import React, { useState, useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Moon, Sun, Sunrise, Sunset, Brain } from 'lucide-react';

const TIME_SLOTS = [
  { label: '12a', hour: 0 }, { label: '1a', hour: 1 }, { label: '2a', hour: 2 },
  { label: '3a', hour: 3 }, { label: '4a', hour: 4 }, { label: '5a', hour: 5 },
  { label: '6a', hour: 6 }, { label: '7a', hour: 7 }, { label: '8a', hour: 8 },
  { label: '9a', hour: 9 }, { label: '10a', hour: 10 }, { label: '11a', hour: 11 },
  { label: '12p', hour: 12 }, { label: '1p', hour: 13 }, { label: '2p', hour: 14 },
  { label: '3p', hour: 15 }, { label: '4p', hour: 16 }, { label: '5p', hour: 17 },
  { label: '6p', hour: 18 }, { label: '7p', hour: 19 }, { label: '8p', hour: 20 },
  { label: '9p', hour: 21 }, { label: '10p', hour: 22 }, { label: '11p', hour: 23 },
];

const TIME_PERIODS = [
  { name: 'Early Morning', range: '12am–6am', hours: [0,1,2,3,4,5], icon: Moon, color: '#6366f1' },
  { name: 'Morning', range: '6am–12pm', hours: [6,7,8,9,10,11], icon: Sunrise, color: '#f59e0b' },
  { name: 'Afternoon', range: '12pm–6pm', hours: [12,13,14,15,16,17], icon: Sun, color: '#f97316' },
  { name: 'Evening', range: '6pm–12am', hours: [18,19,20,21,22,23], icon: Sunset, color: '#8b5cf6' },
];

const TimeOfDayChart = ({ timingData }) => {
  const [mode, setMode] = useState('work'); // 'work' | 'tasks'

  const { radarData, hourlyBuckets, peakInsight, periodData, total } = useMemo(() => {
    let source = [];
    if (mode === 'work') source = timingData?.work || [];
    else if (mode === 'tasks') source = timingData?.productivity || [];
    else if (mode === 'trading') source = timingData?.trades || [];
    else if (mode === 'streak') source = timingData?.streak || [];
    const buckets = Array(24).fill(0);

    source.forEach(entry => {
      const hour = Math.floor(entry.timeDecimal);
      if (hour >= 0 && hour < 24) buckets[hour]++;
    });

    const total = buckets.reduce((a, b) => a + b, 0);

    // Build radar data
    const radarData = TIME_SLOTS.map(slot => ({
      subject: slot.label,
      value: buckets[slot.hour],
      fullMark: Math.max(...buckets, 1),
    }));

    // Period breakdown
    const periodData = TIME_PERIODS.map(period => {
      const count = period.hours.reduce((acc, h) => acc + buckets[h], 0);
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...period, count, pct };
    }).sort((a, b) => b.count - a.count);

    // Peak window: find the best consecutive 3-hour block
    let bestStart = 0, bestCount = 0;
    for (let i = 0; i < 24; i++) {
      const windowCount = buckets[i] + buckets[(i+1)%24] + buckets[(i+2)%24];
      if (windowCount > bestCount) { bestCount = windowCount; bestStart = i; }
    }

    const fmt = (h) => {
      const suffix = h < 12 ? 'AM' : 'PM';
      const display = h % 12 === 0 ? 12 : h % 12;
      return `${display} ${suffix}`;
    };

    const peakPct = total > 0 ? Math.round((bestCount / total) * 100) : 0;
    const topPeriod = periodData[0];

    let personality = 'Night Owl 🦉';
    let personalityColor = 'text-indigo-600';
    if (topPeriod?.name === 'Morning') { personality = 'Morning Bird 🌅'; personalityColor = 'text-amber-600'; }
    else if (topPeriod?.name === 'Afternoon') { personality = 'Afternoon Warrior ☀️'; personalityColor = 'text-orange-600'; }
    else if (topPeriod?.name === 'Evening') { personality = 'Evening Grinder 🌙'; personalityColor = 'text-purple-600'; }

    const peakInsight = {
      personality,
      personalityColor,
      peakWindow: total > 0 ? `${fmt(bestStart)} – ${fmt((bestStart + 3) % 24)}` : null,
      peakPct,
      topPeriod,
    };

    return { radarData, hourlyBuckets: buckets, peakInsight, periodData, total };
  }, [timingData, mode]);

  const color = mode === 'work' ? '#1a73e8' : mode === 'tasks' ? '#f59e0b' : mode === 'trading' ? '#10b981' : '#ef4444';
  const fillColor = color;

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#202124] flex items-center gap-2">
            <Brain className="text-[#1a73e8]" size={20} />
            Morning Bird vs. Night Owl
          </h3>
          <p className="text-xs text-[#5f6368] mt-1">When are you most productive?</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('work')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors ${mode === 'work' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Deep Work
          </button>
          <button
            onClick={() => setMode('tasks')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors ${mode === 'tasks' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setMode('trading')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors ${mode === 'trading' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Trading
          </button>
          <button
            onClick={() => setMode('streak')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors ${mode === 'streak' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Bad Habits
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#9aa0a6]">
          <Brain size={40} className="mb-3 opacity-20" />
          <p className="text-sm">No {mode === 'work' ? 'work session' : mode === 'tasks' ? 'task' : mode === 'trading' ? 'trading' : 'bad habit'} data yet.</p>
          <p className="text-xs mt-1">Start logging to see your productivity pattern!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Radar Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e8eaed" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#5f6368' }} />
                <Radar
                  name={mode === 'work' ? 'Sessions' : mode === 'tasks' ? 'Tasks' : mode === 'trading' ? 'Trades' : 'Relapses'}
                  dataKey="value"
                  stroke={color}
                  fill={fillColor}
                  fillOpacity={0.25}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(val) => [val, mode === 'work' ? 'sessions' : mode === 'tasks' ? 'tasks' : mode === 'trading' ? 'trades' : 'relapses']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights Panel */}
          <div className="space-y-5">
            {/* Personality Badge */}
            <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
              <p className="text-xs text-[#5f6368] uppercase tracking-wider font-semibold mb-1">Your Productivity Type</p>
              <p className={`text-2xl font-extrabold ${peakInsight.personalityColor}`}>{peakInsight.personality}</p>
              {peakInsight.peakWindow && (
                <p className="text-xs text-[#5f6368] mt-2">
                  Peak window: <span className="font-bold text-[#202124]">{peakInsight.peakWindow}</span>
                  {' '}({peakInsight.peakPct}% of activity)
                </p>
              )}
            </div>

            {/* Period Breakdown */}
            <div className="space-y-3">
              {periodData.map((period, idx) => {
                const Icon = period.icon;
                return (
                  <div key={period.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: period.color + '20' }}>
                      <Icon size={14} style={{ color: period.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-[#3c4043]">{period.name} <span className="font-normal text-[#9aa0a6]">({period.range})</span></span>
                        <span className="font-bold" style={{ color: period.color }}>{period.pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${period.pct}%`, backgroundColor: period.color }}
                        ></div>
                      </div>
                    </div>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: period.color }}>
                        Peak
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeOfDayChart;
