import React, { useState, useEffect } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';
import { Crosshair, Star } from 'lucide-react';
import api from '../../services/api';

const STAR_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#6366f1',
};

const STAR_LABELS = {
  1: 'Very Distracted',
  2: 'Somewhat Distracted',
  3: 'Moderate Focus',
  4: 'Good Focus',
  5: 'Deep Focus 🔥',
};

const CustomScatterDot = (props) => {
  const { cx, cy, payload } = props;
  const color = STAR_COLORS[payload.quality] || '#1a73e8';
  return (
    <circle cx={cx} cy={cy} r={7} fill={color} fillOpacity={0.75} stroke={color} strokeWidth={1.5} />
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3 text-sm">
      <p className="font-bold text-[#202124] mb-1">{STAR_LABELS[d.quality]}</p>
      <p className="text-[#5f6368]">Duration: <span className="font-semibold text-[#202124]">{d.hours}h</span></p>
      <p className="text-[#5f6368]">Rating: <span className="font-semibold" style={{ color: STAR_COLORS[d.quality] }}>{'⭐'.repeat(d.quality)}</span></p>
    </div>
  );
};

const FocusQualityChart = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('scatter'); // 'scatter' | 'bar'

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/focus-quality');
        if (res.data.success) setData(res.data.data);
      } catch (e) {
        console.error('Focus quality load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#202124] flex items-center gap-2">
            <Crosshair className="text-[#1a73e8]" size={20} />
            Focus Quality vs. Quantity
          </h3>
          <p className="text-xs text-[#5f6368] mt-1">Are longer sessions really better quality?</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
          <button
            onClick={() => setView('scatter')}
            className={`px-4 py-1.5 font-semibold rounded-md transition-colors ${view === 'scatter' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Scatter Plot
          </button>
          <button
            onClick={() => setView('bar')}
            className={`px-4 py-1.5 font-semibold rounded-md transition-colors ${view === 'bar' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            By Rating
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[#9aa0a6] text-sm">Loading...</div>
      ) : !data || data.total === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-[#9aa0a6]">
          <Star size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-semibold">No quality ratings yet</p>
          <p className="text-xs mt-1">Rate your focus after each session to unlock this chart!</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="bg-indigo-50 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-extrabold text-indigo-700">{data.avgQuality}⭐</p>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Quality</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-extrabold text-blue-700">{data.total}</p>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Rated Sessions</p>
            </div>
            {data.qualitySummary.sort((a,b) => b.count - a.count)[0]?.count > 0 && (
              <div className="rounded-xl px-4 py-2 text-center" style={{ backgroundColor: STAR_COLORS[data.qualitySummary.sort((a,b) => b.count - a.count)[0].star] + '20' }}>
                <p className="text-lg font-extrabold" style={{ color: STAR_COLORS[data.qualitySummary.sort((a,b) => b.count - a.count)[0].star] }}>
                  {'⭐'.repeat(data.qualitySummary.sort((a,b) => b.count - a.count)[0].star)}
                </p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Most Common</p>
              </div>
            )}
          </div>

          {view === 'scatter' ? (
            <div>
              <p className="text-xs text-gray-400 mb-3">Each dot = one session. X-axis = duration, Y-axis = quality rating. Color = star rating.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                    <XAxis
                      type="number"
                      dataKey="hours"
                      name="Duration (hours)"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9aa0a6' }}
                      tickFormatter={v => `${v}h`}
                      label={{ value: 'Session Duration (hours)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#9aa0a6' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="quality"
                      name="Focus Quality"
                      domain={[0.5, 5.5]}
                      ticks={[1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9aa0a6' }}
                      tickFormatter={v => `${'⭐'.repeat(v)}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter
                      data={data.points}
                      shape={<CustomScatterDot />}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-3">Average session duration for each quality rating.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.qualitySummary.filter(d => d.count > 0)} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                    <XAxis
                      dataKey="star"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9aa0a6' }}
                      tickFormatter={v => `${'⭐'.repeat(v)}`}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9aa0a6' }}
                      tickFormatter={v => `${v}h`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                      formatter={(val, name) => [`${val}h avg`, 'Avg Duration']}
                      labelFormatter={v => `${'⭐'.repeat(v)} — ${STAR_LABELS[v]}`}
                    />
                    <Bar dataKey="avgHours" name="Avg Duration" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {data.qualitySummary.filter(d => d.count > 0).map(entry => (
                        <Cell key={entry.star} fill={STAR_COLORS[entry.star]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {data.qualitySummary.filter(d => d.count > 0).map(d => (
                  <span key={d.star} className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: STAR_COLORS[d.star] + '20', color: STAR_COLORS[d.star] }}>
                    {'⭐'.repeat(d.star)} — {d.count} session{d.count !== 1 ? 's' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FocusQualityChart;
