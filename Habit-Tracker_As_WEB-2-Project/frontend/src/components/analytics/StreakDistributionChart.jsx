import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { BarChart2, Trophy } from 'lucide-react';
import api from '../../services/api';

const BUCKETS = [
  { label: '0–3 days',  min: 0,  max: 3,   color: '#ef4444', emoji: '💔' },
  { label: '4–7 days',  min: 4,  max: 7,   color: '#f97316', emoji: '😤' },
  { label: '8–14 days', min: 8,  max: 14,  color: '#eab308', emoji: '💪' },
  { label: '15–30 days',min: 15, max: 30,  color: '#22c55e', emoji: '🔥' },
  { label: '30+ days',  min: 31, max: Infinity, color: '#6366f1', emoji: '🏆' },
];

const getInsight = (data, currentStreak) => {
  if (!data || data.every(d => d.count === 0)) return null;
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a));
  const insights = [];

  if (peak.label === '0–3 days' && peak.count >= 2) {
    insights.push(`You break most often in the first 3 days. These are your most critical hours — build a strong morning ritual to power through!`);
  } else if (peak.label === '4–7 days' && peak.count >= 2) {
    insights.push(`Week 1 is your wall 🧱 — ${peak.count} of your streaks ended in the first week. Plan a specific activity for Day 5–6 to break the pattern.`);
  } else if (peak.label === '8–14 days' && peak.count >= 2) {
    insights.push(`You tend to break in Week 2. Complacency often kicks in around Day 10 — stay just as alert as Day 1!`);
  } else {
    insights.push(`Your longest streaks are ${peak.label} — you're building serious discipline!`);
  }

  if (currentStreak > 0) {
    const currentBucket = BUCKETS.find(b => currentStreak >= b.min && currentStreak <= b.max);
    if (currentBucket && currentBucket.label === peak.label) {
      insights.push(`⚠️ Your current streak (${currentStreak} days) is in your most vulnerable zone. Stay strong!`);
    }
  }

  return insights;
};

const StreakDistributionChart = () => {
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
        console.error('Streak distribution load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const { chartData, totalAttempts, longestAttempt } = useMemo(() => {
    if (!relapseHistory || relapseHistory.length === 0) {
      return { chartData: BUCKETS.map(b => ({ ...b, count: 0 })), totalAttempts: 0, longestAttempt: 0 };
    }

    // Sort relapses by date ascending
    const sorted = [...relapseHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate streak lengths: each streak's length = days between previousStartTime and relapse date
    const streakLengths = sorted
      .map(r => {
        if (!r.previousStartTime) return null;
        const start = new Date(r.previousStartTime);
        const end = new Date(r.date);
        const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
        return diffDays;
      })
      .filter(v => v !== null);

    // Bucket them
    const counts = {};
    BUCKETS.forEach(b => { counts[b.label] = 0; });
    let longest = 0;

    streakLengths.forEach(days => {
      if (days > longest) longest = days;
      const bucket = BUCKETS.find(b => days >= b.min && days <= b.max);
      if (bucket) counts[bucket.label]++;
    });

    const chartData = BUCKETS.map(b => ({ ...b, count: counts[b.label] }));
    return { chartData, totalAttempts: streakLengths.length, longestAttempt: longest };
  }, [relapseHistory]);

  const currentStreak = streakData?.currentStreak || 0;
  const insights = getInsight(chartData, currentStreak);
  const hasData = totalAttempts > 0;

  if (loading) {
    return (
      <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <BarChart2 size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Streak Length Distribution</h3>
            <p className="text-xs text-gray-500 mt-0.5">Where does your streak usually break?</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-[#9aa0a6] text-sm">Loading...</div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3 text-sm min-w-[140px]">
        <p className="font-bold text-[#202124] mb-1">{d.emoji} {d.label}</p>
        <p style={{ color: d.color }} className="font-semibold">
          {d.count} attempt{d.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <BarChart2 size={20} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Streak Length Distribution</h3>
          <p className="text-xs text-gray-500 mt-0.5">Where does your streak usually break?</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <BarChart2 size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">No relapse history yet</p>
          <p className="text-xs mt-1">Keep going — your distribution chart will appear here</p>
        </div>
      ) : (
        <>
          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl px-4 py-2 text-center border border-gray-100">
              <p className="text-xl font-extrabold text-gray-800">{totalAttempts}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Past Attempts</p>
            </div>
            <div className="bg-purple-50 rounded-xl px-4 py-2 text-center border border-purple-100">
              <p className="text-xl font-extrabold text-purple-700">{longestAttempt} days</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Longest Attempt</p>
            </div>
            {currentStreak > 0 && (
              <div className="bg-green-50 rounded-xl px-4 py-2 text-center border border-green-100">
                <p className="text-xl font-extrabold text-green-700">{currentStreak} days</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Current Streak</p>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="h-56 mb-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#5f6368' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9aa0a6' }}
                  allowDecimals={false}
                  label={{ value: 'Attempts', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fill: '#9aa0a6' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={55}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    formatter={v => v > 0 ? v : ''}
                    style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }}
                  />
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} fillOpacity={entry.count === 0 ? 0.15 : 0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-5">
            {chartData.map(b => (
              <span
                key={b.label}
                className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ backgroundColor: b.color + '18', color: b.color }}
              >
                {b.emoji} {b.label}
              </span>
            ))}
          </div>

          {/* Smart Insight */}
          {insights && insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((msg, i) => (
                <div key={i} className={`rounded-xl p-4 text-sm font-medium flex items-start gap-2 ${i === 1 ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-purple-50 text-purple-800 border border-purple-100'}`}>
                  <Trophy size={16} className="shrink-0 mt-0.5" />
                  {msg}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StreakDistributionChart;
