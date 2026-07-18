import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Clock } from 'lucide-react';
import api from '../../services/api';

const VelocityChart = () => {
  const [velocityData, setVelocityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/analytics/velocity?days=${range}`);
        if (res.data.success) setVelocityData(res.data.data);
      } catch (e) {
        console.error('Velocity load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [range]);

  const { status, statusColor, statusBg, statusIcon } = useMemo(() => {
    if (!velocityData) return {};
    const { weekDebt, weekAdded, weekCompleted } = velocityData;
    if (weekAdded === 0) return { status: 'No activity this week', statusColor: 'text-gray-500', statusBg: 'bg-gray-50', statusIcon: <Clock size={18} /> };
    if (weekDebt <= 0) return { status: 'On Track ✅', statusColor: 'text-green-700', statusBg: 'bg-green-50', statusIcon: <CheckCircle size={18} className="text-green-600" /> };
    if (weekDebt <= 3) return { status: 'Slight Task Debt ⚠️', statusColor: 'text-amber-700', statusBg: 'bg-amber-50', statusIcon: <AlertTriangle size={18} className="text-amber-600" /> };
    return { status: 'Overloaded 🔴', statusColor: 'text-red-700', statusBg: 'bg-red-50', statusIcon: <AlertTriangle size={18} className="text-red-600" /> };
  }, [velocityData]);

  // Only show labels for every few data points to avoid clutter
  const tickFormatter = (val, idx) => {
    if (range === 7) return val;
    if (range === 30 && idx % 4 === 0) return val;
    if (range === 14 && idx % 2 === 0) return val;
    return '';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3 text-sm min-w-[140px]">
        <p className="font-bold text-[#202124] mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }} className="font-medium">{p.name}</span>
            <span className="font-bold text-[#202124]">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#202124] flex items-center gap-2">
            <TrendingUp className="text-[#1a73e8]" size={20} />
            Burn-down & Velocity
          </h3>
          <p className="text-xs text-[#5f6368] mt-1">Tasks added vs. completed — are you keeping up?</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${range === d ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[#9aa0a6] text-sm">Loading...</div>
      ) : !velocityData ? (
        <div className="flex items-center justify-center h-64 text-[#9aa0a6] text-sm">Failed to load data</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Velocity', value: `${velocityData.velocity}/day`, icon: <Zap size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Added (period)', value: velocityData.totalAdded, icon: <TrendingUp size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Completed', value: velocityData.totalCompleted, icon: <CheckCircle size={16} />, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Debt', value: velocityData.totalDebt > 0 ? `+${velocityData.totalDebt}` : velocityData.totalDebt, icon: <AlertTriangle size={16} />, color: velocityData.totalDebt > 0 ? 'text-red-600' : 'text-green-600', bg: velocityData.totalDebt > 0 ? 'bg-red-50' : 'bg-green-50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-3 text-center border border-transparent`}>
                <div className={`${stat.color} flex items-center justify-center mb-1`}>{stat.icon}</div>
                <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Weekly Status Alert */}
          <div className={`${statusBg} rounded-xl p-3 flex items-center gap-3 mb-6 border border-transparent`}>
            {statusIcon}
            <div>
              <p className={`font-bold text-sm ${statusColor}`}>{status}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                This week: <span className="font-semibold text-green-700">{velocityData.weekCompleted} completed</span> vs{' '}
                <span className="font-semibold text-amber-700">{velocityData.weekAdded} added</span>
                {velocityData.weekDebt > 0 && <span className="font-semibold text-red-600"> — {velocityData.weekDebt} pending</span>}
              </p>
            </div>
          </div>

          {/* Added vs Completed Bar Chart */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider mb-3">Daily Added vs. Completed</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={velocityData.series} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9aa0a6' }} tickFormatter={tickFormatter} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9aa0a6' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="added" name="Added" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={18} opacity={0.8} />
                  <Bar dataKey="completed" name="Completed" fill="#34a853" radius={[3, 3, 0, 0]} maxBarSize={18} opacity={0.9} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Running Task Debt Line */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider mb-3">
              Cumulative Task Debt
              <span className="ml-2 font-normal text-gray-400">(above 0 = overloaded)</span>
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={velocityData.series} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9aa0a6' }} tickFormatter={tickFormatter} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9aa0a6' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#34a853" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Balanced', position: 'insideTopRight', fontSize: 10, fill: '#34a853' }} />
                  <Area type="monotone" dataKey="debt" name="Task Debt" stroke="#ef4444" strokeWidth={2.5} fill="url(#debtGrad)" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VelocityChart;
