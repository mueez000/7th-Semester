import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';
import { TrendingUp, Activity, Trophy } from 'lucide-react';
import api from '../../services/api';

const StreakEnduranceChart = () => {
  const [relapseHistory, setRelapseHistory] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statusRes, historyRes] = await Promise.all([
          api.get('/streak/status'),
          api.get('/streak/history')
        ]);
        if (statusRes.data.success) setStreakData(statusRes.data.data);
        if (historyRes.data.success) setRelapseHistory(historyRes.data.data.relapseHistory || []);
      } catch (e) {
        console.error('Streak endurance load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { chartData, avgEndurance, trend, hasEnoughData } = useMemo(() => {
    if (!relapseHistory || relapseHistory.length === 0) {
      return { chartData: [], avgEndurance: 0, trend: 'neutral', hasEnoughData: false };
    }

    // Sort ascending
    const sorted = [...relapseHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    let total = 0;
    const data = sorted.map((r, i) => {
      let days = 0;
      if (r.previousStartTime) {
        const start = new Date(r.previousStartTime);
        const end = new Date(r.date);
        days = Math.max(0, Number(((end - start) / (1000 * 60 * 60 * 24)).toFixed(1)));
      }
      total += days;
      return {
        attempt: i + 1,
        days: days,
        date: r.date,
        reason: r.reason || 'No reason'
      };
    });

    // Add current active streak as the last point if it exists
    if (streakData && streakData.isActive && streakData.startTime) {
      const start = new Date(streakData.startTime);
      const now = new Date();
      const currentDays = Math.max(0, Number(((now - start) / (1000 * 60 * 60 * 24)).toFixed(1)));
      data.push({
        attempt: data.length + 1,
        days: currentDays,
        date: now.toISOString(),
        isCurrent: true
      });
      total += currentDays;
    }

    const avg = data.length > 0 ? Number((total / data.length).toFixed(1)) : 0;
    
    // Find personal best
    let maxDays = 0;
    data.forEach(d => { if (d.days > maxDays) maxDays = d.days; });
    if (maxDays > 0) {
      data.forEach(d => { if (d.days === maxDays) d.isBest = true; });
    }

    // Calculate basic trend (comparing first half of attempts to second half)
    let calcTrend = 'neutral';
    if (data.length >= 4) {
      const mid = Math.floor(data.length / 2);
      const firstHalfAvg = data.slice(0, mid).reduce((acc, curr) => acc + curr.days, 0) / mid;
      const secondHalfAvg = data.slice(mid).reduce((acc, curr) => acc + curr.days, 0) / (data.length - mid);
      
      if (secondHalfAvg > firstHalfAvg * 1.2) calcTrend = 'improving';
      else if (secondHalfAvg < firstHalfAvg * 0.8) calcTrend = 'declining';
    }

    return { chartData: data, avgEndurance: avg, trend: calcTrend, hasEnoughData: data.length > 1 };
  }, [relapseHistory, streakData]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-4 text-sm min-w-[180px]">
        <div className="flex items-center gap-2 mb-2 border-b pb-2">
           {d.isBest && <Trophy size={16} className="text-yellow-500" />}
           {d.isCurrent && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>}
           <p className="font-bold text-[#202124]">
             {d.isCurrent ? 'Current Attempt' : `Attempt #${d.attempt}`}
           </p>
        </div>
        <p className="text-[#5f6368] mb-1">
          Endured for: <span className="font-bold text-indigo-600">{d.days} days</span>
        </p>
        {!d.isCurrent && d.reason && (
          <p className="text-[#5f6368] text-xs mt-2 italic">
            "{d.reason}"
          </p>
        )}
      </div>
    );
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.isBest) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="#eab308" stroke="#fff" strokeWidth={2} />
          <text x={cx} y={cy - 12} textAnchor="middle" fill="#ca8a04" fontSize="10" fontWeight="bold">Best</text>
        </g>
      );
    }
    if (payload.isCurrent) {
      return <circle cx={cx} cy={cy} r={6} fill="#22c55e" stroke="#fff" strokeWidth={2} />;
    }
    return <circle cx={cx} cy={cy} r={4} fill="#4f46e5" stroke="#fff" strokeWidth={1.5} />;
  };

  if (loading) {
    return (
      <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Endurance Score Over Time</h3>
            <p className="text-xs text-gray-500 mt-0.5">Is your willpower improving across attempts?</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-[#9aa0a6] text-sm">Loading endurance data...</div>
      </div>
    );
  }

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#202124]">Endurance Score Over Time</h3>
            <p className="text-xs text-[#5f6368] mt-0.5">Willpower progression across your attempts</p>
          </div>
        </div>
        
        {hasEnoughData && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-100">
            <TrendingUp size={16} />
            <span>Avg Endurance: {avgEndurance} days</span>
          </div>
        )}
      </div>

      {!hasEnoughData ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Activity size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">Not enough attempts yet</p>
          <p className="text-xs mt-1">Keep trying. This chart tracks your progress over multiple attempts.</p>
        </div>
      ) : (
        <>
          <div className="h-64 mb-4 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis 
                  dataKey="attempt" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#5f6368' }}
                  tickFormatter={(v) => `Att #${v}`}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9aa0a6' }}
                  tickFormatter={v => `${v}d`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={avgEndurance} stroke="#9aa0a6" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="days" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorDays)" 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }}
                  dot={<CustomDot />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Smart insights on trend */}
          {trend === 'improving' && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-800 font-medium">
              📈 Great news! Your recent attempts are lasting significantly longer than your earlier ones. Your willpower is getting stronger.
            </div>
          )}
          {trend === 'declining' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800 font-medium">
              ⚠️ Your recent attempts are shorter than your earlier ones. Take a step back and identify the new triggers causing this friction.
            </div>
          )}
          {trend === 'neutral' && chartData.length > 2 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 font-medium">
              ⚖️ Your endurance is relatively stable. Try to break your average of {avgEndurance} days on this next attempt!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StreakEnduranceChart;
