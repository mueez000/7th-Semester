import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Clock, Trophy, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import api from '../../services/api';

// 2-hour time blocks
const TIME_BLOCKS = [
  { label: '12am–2am', start: 0,  end: 2  },
  { label: '2am–4am',  start: 2,  end: 4  },
  { label: '4am–6am',  start: 4,  end: 6  },
  { label: '6am–8am',  start: 6,  end: 8  },
  { label: '8am–10am', start: 8,  end: 10 },
  { label: '10am–12pm',start: 10, end: 12 },
  { label: '12pm–2pm', start: 12, end: 14 },
  { label: '2pm–4pm',  start: 14, end: 16 },
  { label: '4pm–6pm',  start: 16, end: 18 },
  { label: '6pm–8pm',  start: 18, end: 20 },
  { label: '8pm–10pm', start: 20, end: 22 },
  { label: '10pm–12am',start: 22, end: 24 },
];

const getPerformanceLabel = (winRate, count) => {
  if (count === 0) return { label: 'No Trades', emoji: '⬛', color: '#e5e7eb' };
  if (winRate >= 60) return { label: 'Good', emoji: '🟢', color: '#22c55e' };
  if (winRate >= 40) return { label: 'Neutral', emoji: '🟡', color: '#f59e0b' };
  return { label: 'Avoid', emoji: '🔴', color: '#ef4444' };
};

const getBarColor = (winRate, count) => {
  if (count === 0) return '#e5e7eb';
  if (winRate >= 60) return '#22c55e';
  if (winRate >= 40) return '#f59e0b';
  return '#ef4444';
};

// Custom bar label: shows avg PnL on top of bar
const CustomBarLabel = ({ x, y, width, value, payload }) => {
  if (!payload || payload.count === 0 || value === 0) return null;
  const color = payload.avgPnl >= 0 ? '#15803d' : '#b91c1c';
  const text = payload.avgPnl >= 0 ? `+$${payload.avgPnl.toFixed(0)}` : `-$${Math.abs(payload.avgPnl).toFixed(0)}`;
  return (
    <text x={x + width / 2} y={y - 6} fill={color} fontSize={10} fontWeight="700" textAnchor="middle">
      {text}
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const perf = getPerformanceLabel(d.winRate, d.count);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 text-sm min-w-[200px]">
      <p className="font-black text-gray-800 mb-2">{d.label}</p>
      {d.count === 0 ? (
        <p className="text-gray-400">No trades in this window</p>
      ) : (
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Trades</span>
            <span className="font-bold text-gray-800">{d.count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Win Rate</span>
            <span className="font-bold" style={{ color: perf.color }}>{d.winRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Wins</span>
            <span className="font-bold text-green-600">{d.wins}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Losses</span>
            <span className="font-bold text-red-600">{d.losses}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-1.5 mt-1">
            <span className="text-gray-500">Avg PnL</span>
            <span className="font-black" style={{ color: d.avgPnl >= 0 ? '#22c55e' : '#ef4444' }}>
              {d.avgPnl >= 0 ? '+' : ''}${d.avgPnl.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total PnL</span>
            <span className="font-black" style={{ color: d.totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>
              {d.totalPnl >= 0 ? '+' : ''}${d.totalPnl.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-center bg-gray-50 rounded-lg py-1 font-bold" style={{ color: perf.color }}>
            {perf.emoji} {perf.label}
          </div>
        </div>
      )}
    </div>
  );
};

const BestHourChart = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trades')
      .then(res => { if (res.data.success) setTrades(res.data.data || []); })
      .catch(e => console.error('BestHour load failed', e))
      .finally(() => setLoading(false));
  }, []);

  // Process trades into time blocks
  const blockData = TIME_BLOCKS.map(block => {
    const blockTrades = trades.filter(t => {
      if (!t.entryDate) return false;
      const hour = new Date(t.entryDate).getHours();
      return hour >= block.start && hour < block.end;
    });

    const count = blockTrades.length;
    const wins = blockTrades.filter(t => t.status === 'Win').length;
    const losses = blockTrades.filter(t => t.status === 'Loss').length;
    const totalPnl = blockTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const avgPnl = count > 0 ? totalPnl / count : 0;
    const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;

    return {
      label: block.label,
      count,
      wins,
      losses,
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      avgPnl: parseFloat(avgPnl.toFixed(2)),
      winRate,
    };
  });

  // Find best and worst blocks (with at least 1 trade)
  const tradedBlocks = blockData.filter(b => b.count > 0);
  const bestBlock = tradedBlocks.length > 0
    ? tradedBlocks.reduce((best, b) => (b.avgPnl > best.avgPnl ? b : best), tradedBlocks[0])
    : null;
  const worstBlock = tradedBlocks.length > 0
    ? tradedBlocks.reduce((worst, b) => (b.avgPnl < worst.avgPnl ? b : worst), tradedBlocks[0])
    : null;

  // Total PnL in weak hours (winRate < 40%)
  const weakHoursPnl = blockData
    .filter(b => b.count > 0 && b.winRate < 40)
    .reduce((acc, b) => acc + b.totalPnl, 0);

  // Total PnL in good hours (winRate >= 60%)
  const goodHoursPnl = blockData
    .filter(b => b.count > 0 && b.winRate >= 60)
    .reduce((acc, b) => acc + b.totalPnl, 0);

  if (loading) {
    return (
      <div className="google-card p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="google-card p-6 flex flex-col items-center justify-center h-64 text-gray-400">
        <Clock size={40} className="mb-3 opacity-20" />
        <p className="font-medium text-gray-500">No trades logged yet</p>
        <p className="text-sm">Log your XAU/USD trades to discover your Golden Hour.</p>
      </div>
    );
  }

  return (
    <div className="google-card p-6 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50">
            <Clock className="text-amber-600" size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#202124]">Best Hour to Trade</h3>
            <p className="text-sm text-gray-500">Discover your Golden Hour — when your XAU/USD edge is sharpest</p>
          </div>
        </div>
        <div className="flex gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500" /> 60%+ Win Rate
          </span>
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 40-60%
          </span>
          <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Below 40%
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {bestBlock && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-green-600" />
              <span className="font-bold text-green-800 text-sm">Your Golden Hour ⭐</span>
            </div>
            <p className="text-xl font-black text-green-700">{bestBlock.label}</p>
            <div className="mt-2 space-y-0.5 text-xs text-green-700">
              <p>Win Rate: <strong>{bestBlock.winRate}%</strong></p>
              <p>Avg PnL: <strong>+${bestBlock.avgPnl >= 0 ? bestBlock.avgPnl.toFixed(2) : Math.abs(bestBlock.avgPnl).toFixed(2)}/trade</strong></p>
              <p>Trades: <strong>{bestBlock.count}</strong></p>
            </div>
          </div>
        )}

        {worstBlock && worstBlock.label !== bestBlock?.label && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="font-bold text-red-800 text-sm">Danger Zone ⚠️</span>
            </div>
            <p className="text-xl font-black text-red-700">{worstBlock.label}</p>
            <div className="mt-2 space-y-0.5 text-xs text-red-700">
              <p>Win Rate: <strong>{worstBlock.winRate}%</strong></p>
              <p>Avg PnL: <strong>${worstBlock.avgPnl.toFixed(2)}/trade</strong></p>
              <p>Trades: <strong>{worstBlock.count}</strong></p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-blue-600" />
            <span className="font-bold text-blue-800 text-sm">Insight</span>
          </div>
          <div className="space-y-1 text-xs text-blue-700">
            <p>🟢 Good hours PnL: <strong className="text-green-700">+${goodHoursPnl.toFixed(2)}</strong></p>
            <p>🔴 Weak hours PnL: <strong className="text-red-700">${weakHoursPnl.toFixed(2)}</strong></p>
            {weakHoursPnl < 0 && (
              <p className="mt-2 font-bold text-blue-800">
                💡 Avoiding weak hours would save you <strong>${Math.abs(weakHoursPnl).toFixed(2)}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-72 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={blockData} margin={{ top: 28, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              label={{ value: 'Trades', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {blockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.winRate, entry.count)} />
              ))}
              <LabelList
                content={(props) => {
                  const { x, y, width, index } = props;
                  const d = blockData[index];
                  if (!d || d.count === 0) return null;
                  const color = d.avgPnl >= 0 ? '#15803d' : '#b91c1c';
                  const text = d.avgPnl >= 0 ? `+$${d.avgPnl.toFixed(0)}` : `-$${Math.abs(d.avgPnl).toFixed(0)}`;
                  return (
                    <text x={x + width / 2} y={y - 6} fill={color} fontSize={9} fontWeight="700" textAnchor="middle">
                      {text}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full Table Breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 rounded-xl text-xs uppercase text-gray-500 font-bold">
              <th className="px-4 py-3 rounded-l-xl">Time Block</th>
              <th className="px-4 py-3 text-center">Trades</th>
              <th className="px-4 py-3 text-center">Wins</th>
              <th className="px-4 py-3 text-center">Losses</th>
              <th className="px-4 py-3 text-center">Win Rate</th>
              <th className="px-4 py-3 text-center">Avg PnL</th>
              <th className="px-4 py-3 text-center">Total PnL</th>
              <th className="px-4 py-3 text-center rounded-r-xl">Rating</th>
            </tr>
          </thead>
          <tbody>
            {blockData.map((block, i) => {
              const perf = getPerformanceLabel(block.winRate, block.count);
              const isGolden = block.label === bestBlock?.label;
              const isWorst = block.label === worstBlock?.label && worstBlock?.label !== bestBlock?.label;
              return (
                <tr
                  key={i}
                  className={`border-b border-gray-50 transition-colors ${
                    isGolden ? 'bg-green-50' : isWorst ? 'bg-red-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-2">
                    {isGolden && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">GOLDEN ⭐</span>}
                    {isWorst && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">AVOID</span>}
                    {block.label}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{block.count || '-'}</td>
                  <td className="px-4 py-3 text-center font-bold text-green-600">{block.count > 0 ? block.wins : '-'}</td>
                  <td className="px-4 py-3 text-center font-bold text-red-600">{block.count > 0 ? block.losses : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {block.count > 0 ? (
                      <span className="font-bold px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: perf.color }}>
                        {block.winRate}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold" style={{ color: block.avgPnl >= 0 ? '#22c55e' : '#ef4444' }}>
                    {block.count > 0 ? `${block.avgPnl >= 0 ? '+' : ''}$${block.avgPnl.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold" style={{ color: block.totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>
                    {block.count > 0 ? `${block.totalPnl >= 0 ? '+' : ''}$${block.totalPnl.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">{perf.emoji}</span>
                    <span className="text-xs text-gray-500 ml-1">{perf.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Discipline Rule Suggestion */}
      {bestBlock && (
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <TrendingUp className="text-blue-500 mt-0.5 shrink-0" size={18} />
          <div className="text-sm">
            <p className="font-bold text-blue-800">💡 Discipline Rule Suggestion</p>
            <p className="text-blue-700 mt-1">
              Based on your data, your sharpest edge is in the <strong>{bestBlock.label}</strong> window
              ({bestBlock.winRate}% win rate, avg +${bestBlock.avgPnl.toFixed(2)}/trade).
              {weakHoursPnl < -100
                ? ` You lost <strong>$${Math.abs(weakHoursPnl).toFixed(0)}</strong> trading in suboptimal hours. Consider a rule: <strong>Only trade during your Golden Hour.</strong>`
                : ' Keep focusing on this time window for best results.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestHourChart;
