import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Target, Pencil, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../services/api';

const GOAL_STORAGE_KEY = 'habitflow_work_goal_hours';
const DEFAULT_GOAL = 100;

const GoalTrajectory = ({ selectedMonth }) => {
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem(GOAL_STORAGE_KEY);
    return saved ? parseFloat(saved) : DEFAULT_GOAL;
  });
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(goal);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch trajectory from backend
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const y = selectedMonth.getFullYear();
        const m = selectedMonth.getMonth() + 1;
        const res = await api.get(`/analytics/trajectory?year=${y}&month=${m}`);
        if (res.data.success) setTrajectoryData(res.data.data);
      } catch (e) {
        console.error('Trajectory load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedMonth]);

  const saveGoal = () => {
    const val = Math.max(1, parseFloat(goalInput) || DEFAULT_GOAL);
    setGoal(val);
    localStorage.setItem(GOAL_STORAGE_KEY, val);
    setEditGoal(false);
  };

  // Build chart series with ideal, actual, and forecast lines
  const { chartData, status, statusColor, gap } = useMemo(() => {
    if (!trajectoryData) return { chartData: [], status: 'Loading...', statusColor: 'text-gray-400', gap: 0 };

    const { series, daysInMonth, todayDay, totalSoFar, velocity, forecastTotal } = trajectoryData;

    const chartData = series.map(point => {
      const ideal = Number(((point.day / daysInMonth) * goal).toFixed(2));

      // Forecast: from today onwards, extend at current velocity
      let forecast = null;
      if (point.day >= todayDay) {
        const daysFromToday = point.day - todayDay;
        forecast = Number((totalSoFar + velocity * daysFromToday).toFixed(2));
      }

      return {
        day: point.day,
        label: `Day ${point.day}`,
        ideal,
        actual: point.actual,
        forecast: point.actual !== null && point.day < todayDay ? null : forecast, // join forecast from today
      };
    });

    // Gap at end of month
    const gap = Number((forecastTotal - goal).toFixed(1));
    let status, statusColor;
    if (forecastTotal >= goal) {
      status = `🎯 On track! Projected ${forecastTotal}h — goal met!`;
      statusColor = 'text-emerald-700';
    } else if (gap >= -10) {
      status = `⚡ Close! Projected ${forecastTotal}h — ${Math.abs(gap)}h short of goal`;
      statusColor = 'text-amber-700';
    } else {
      status = `📉 Behind pace — projected ${forecastTotal}h, need ${Math.abs(gap)}h more`;
      statusColor = 'text-red-600';
    }

    return { chartData, status, statusColor, gap };
  }, [trajectoryData, goal]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3 text-sm min-w-[150px]">
        <p className="font-bold text-[#202124] mb-2">{label}</p>
        {payload.map(p => p.value !== null && (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }} className="font-medium">{p.name}</span>
            <span className="font-bold text-[#202124]">{p.value}h</span>
          </div>
        ))}
      </div>
    );
  };

  // Stat cards
  const stats = trajectoryData ? [
    { label: 'Done So Far', value: `${trajectoryData.totalSoFar}h`, icon: <CheckCircle size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Daily Velocity', value: `${trajectoryData.velocity}h/day`, icon: <TrendingUp size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Forecast', value: `${trajectoryData.forecastTotal}h`, icon: gap >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />, color: gap >= 0 ? 'text-emerald-600' : 'text-red-600', bg: gap >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
    { label: 'Monthly Goal', value: `${goal}h`, icon: <Target size={16} />, color: 'text-purple-600', bg: 'bg-purple-50', clickable: true },
  ] : [];

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#202124] flex items-center gap-2">
            <Target className="text-[#1a73e8]" size={20} />
            Goal Trajectory Forecasting
          </h3>
          <p className="text-xs text-[#5f6368] mt-1">Are you on pace to hit your monthly deep work goal?</p>
        </div>

        {/* Goal editor */}
        {editGoal ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              className="w-24 border border-[#1a73e8] rounded-xl px-3 py-1.5 text-sm font-semibold text-center outline-none focus:ring-2 focus:ring-blue-200"
              min="1"
              max="744"
              onKeyDown={e => e.key === 'Enter' && saveGoal()}
              autoFocus
            />
            <span className="text-sm text-gray-500">hours</span>
            <button
              onClick={saveGoal}
              className="px-3 py-1.5 bg-[#1a73e8] text-white text-sm font-semibold rounded-xl hover:bg-[#174ea6] transition"
            >
              Save
            </button>
            <button
              onClick={() => setEditGoal(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setGoalInput(goal); setEditGoal(true); }}
            className="flex items-center gap-2 text-sm font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] px-4 py-2 rounded-xl transition"
          >
            <Pencil size={14} />
            Set Goal ({goal}h)
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[#9aa0a6] text-sm">Loading trajectory...</div>
      ) : !trajectoryData ? (
        <div className="flex items-center justify-center h-64 text-[#9aa0a6] text-sm">Failed to load data</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {stats.map(stat => (
              <div
                key={stat.label}
                onClick={stat.clickable ? () => { setGoalInput(goal); setEditGoal(true); } : undefined}
                className={`${stat.bg} rounded-2xl p-3 text-center ${stat.clickable ? 'cursor-pointer hover:brightness-95' : ''} transition`}
              >
                <div className={`${stat.color} flex items-center justify-center mb-1`}>{stat.icon}</div>
                <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Status Banner */}
          <div className={`rounded-xl px-4 py-3 mb-5 text-sm font-semibold ${statusColor} bg-gray-50 border border-gray-100`}>
            {status}
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9aa0a6' }}
                  tickFormatter={v => v % 5 === 0 || v === 1 ? `${v}` : ''}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9aa0a6' }}
                  tickFormatter={v => `${v}h`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />

                {/* Goal reference line */}
                <ReferenceLine
                  y={goal}
                  stroke="#34a853"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: `Goal: ${goal}h`, position: 'insideTopRight', fontSize: 10, fill: '#34a853' }}
                />

                {/* Ideal pacing line */}
                <Line
                  type="linear"
                  dataKey="ideal"
                  name="Ideal Pace"
                  stroke="#9aa0a6"
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />

                {/* Actual cumulative */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#1a73e8"
                  strokeWidth={2.5}
                  fill="url(#actualGrad)"
                  dot={false}
                  connectNulls
                />

                {/* Forecast extension */}
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#forecastGrad)"
                  dot={false}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-3">
            Forecast assumes your current average of {trajectoryData.velocity}h/day continues for the rest of the month
          </p>
        </>
      )}
    </div>
  );
};

export default GoalTrajectory;
