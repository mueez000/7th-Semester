import React, { useState, useEffect, useRef } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Scatter, Dot
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Zap } from 'lucide-react';
import api from '../../services/api';

// Custom dot: green for win, red for loss, gray for break-even
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (payload.balance === null || payload.balance === undefined) return null;
  const color = payload.status === 'Win' ? '#22c55e' : payload.status === 'Loss' ? '#ef4444' : '#9ca3af';
  const glow = payload.status === 'Win' ? 'rgba(34,197,94,0.4)' : payload.status === 'Loss' ? 'rgba(239,68,68,0.4)' : 'rgba(156,163,175,0.3)';
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={glow} />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
    </g>
  );
};

// Rich custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d.balance === null) return null;

  const pnlColor = d.pnl >= 0 ? '#22c55e' : '#ef4444';
  const statusColor = d.status === 'Win' ? '#22c55e' : d.status === 'Loss' ? '#ef4444' : '#9ca3af';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 text-sm min-w-[240px]">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <span className="font-black text-gray-800">Trade #{d.tradeIndex}</span>
        <span className="font-bold px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: statusColor }}>{d.status}</span>
      </div>
      <div className="space-y-1.5 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Asset</span>
          <span className="font-bold text-gray-800">{d.asset}</span>
        </div>
        <div className="flex justify-between">
          <span>Direction</span>
          <span className="font-bold text-gray-800">{d.position}</span>
        </div>
        {d.entryPrice && (
          <div className="flex justify-between">
            <span>Entry</span>
            <span className="font-bold text-gray-800">${Number(d.entryPrice).toLocaleString()}</span>
          </div>
        )}
        {d.exitPrice && (
          <div className="flex justify-between">
            <span>Exit</span>
            <span className="font-bold text-gray-800">${Number(d.exitPrice).toLocaleString()}</span>
          </div>
        )}
        {d.lotSize && (
          <div className="flex justify-between">
            <span>Lot Size</span>
            <span className="font-bold text-gray-800">{d.lotSize}</span>
          </div>
        )}
        {d.emotion && (
          <div className="flex justify-between">
            <span>Emotion</span>
            <span className="font-bold text-purple-600">{d.emotion}</span>
          </div>
        )}
        <div className="border-t border-gray-100 pt-1.5 mt-1.5">
          <div className="flex justify-between">
            <span>Trade PnL</span>
            <span className="font-black" style={{ color: pnlColor }}>{d.pnl >= 0 ? '+' : ''}${d.pnl?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance After</span>
            <span className="font-black text-gray-900">${Number(d.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        {d.date && (
          <div className="text-gray-400 text-center pt-1">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        )}
      </div>
    </div>
  );
};

const BalanceJourneyChart = () => {
  const [trades, setTrades] = useState([]);
  const [propAccount, setPropAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tradeRes, accountRes] = await Promise.all([
          api.get('/trades'),
          api.get('/prop-account')
        ]);
        if (tradeRes.data.success) setTrades(tradeRes.data.data || []);
        if (accountRes.data.success && accountRes.data.data) setPropAccount(accountRes.data.data);
      } catch (e) {
        console.error('BalanceJourney load failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="google-card p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!propAccount) {
    return (
      <div className="google-card p-6 flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={40} className="mb-3 opacity-20" />
        <p className="font-medium">No Prop Account configured</p>
        <p className="text-sm">Set up your funded account on the Trading page first.</p>
      </div>
    );
  }

  const accountSize = propAccount.accountSize;
  const currentPhase = propAccount.currentPhase || 1;
  const targetPct = currentPhase === 1 ? propAccount.phase1TargetPct : propAccount.phase2TargetPct;
  const maxDrawdownFloor = accountSize * (1 - propAccount.maxDrawdownPct / 100);
  const targetBalance = accountSize * (1 + targetPct / 100);
  const warningThreshold = maxDrawdownFloor + (accountSize - maxDrawdownFloor) * 0.3; // 30% above floor

  // Sort trades by date (oldest first) and compute running balance
  const sortedTrades = [...trades]
    .filter(t => t.pnl !== undefined && t.pnl !== null)
    .sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));

  // Build chart data: start point + each trade
  const chartData = [
    {
      tradeIndex: 0,
      label: 'Start',
      balance: accountSize,
      pnl: 0,
      status: null,
      asset: '-',
      position: '-',
      entryPrice: null,
      exitPrice: null,
      lotSize: null,
      emotion: null,
      date: null
    }
  ];

  let runningBalance = accountSize;
  sortedTrades.forEach((trade, i) => {
    runningBalance += trade.pnl;
    chartData.push({
      tradeIndex: i + 1,
      label: `#${i + 1}`,
      balance: parseFloat(runningBalance.toFixed(2)),
      pnl: trade.pnl,
      status: trade.status,
      asset: trade.asset,
      position: trade.position,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      lotSize: trade.lotSize,
      emotion: trade.emotion,
      date: trade.entryDate
    });
  });

  const finalBalance = runningBalance;
  const totalPnL = finalBalance - accountSize;
  const netReturnPct = ((totalPnL / accountSize) * 100).toFixed(2);
  const allTimeHigh = Math.max(...chartData.map(d => d.balance));
  const allTimeLow = Math.min(...chartData.map(d => d.balance));
  const currentDrawdownFromHigh = ((allTimeHigh - finalBalance) / allTimeHigh * 100).toFixed(1);

  // Consecutive losses tracker
  let maxConsecutiveLosses = 0;
  let curConsecutiveLosses = 0;
  let worstStreak = { count: 0, damage: 0 };
  let curDamage = 0;
  sortedTrades.forEach(t => {
    if (t.status === 'Loss') {
      curConsecutiveLosses++;
      curDamage += Math.abs(t.pnl);
      if (curConsecutiveLosses > maxConsecutiveLosses) {
        maxConsecutiveLosses = curConsecutiveLosses;
        worstStreak = { count: curConsecutiveLosses, damage: curDamage };
      }
    } else {
      curConsecutiveLosses = 0;
      curDamage = 0;
    }
  });

  // Compute chart domain with padding
  const allBalances = chartData.map(d => d.balance);
  const yMin = Math.min(maxDrawdownFloor - 500, Math.min(...allBalances) - 200);
  const yMax = Math.max(targetBalance + 500, Math.max(...allBalances) + 200);

  const isNearFloor = finalBalance <= warningThreshold;
  const hasBreachedFloor = finalBalance <= maxDrawdownFloor;

  if (sortedTrades.length === 0) {
    return (
      <div className="google-card p-6 w-full animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-50">
            <TrendingUp className="text-blue-600" size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#202124]">Balance Journey Chart</h3>
            <p className="text-sm text-gray-500">Your XAU/USD Funded Account Survival Story</p>
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <TrendingUp size={40} className="mb-3 opacity-20" />
          <p className="font-medium text-gray-500">No trades logged yet</p>
          <p className="text-sm">Log your first XAU/USD trade to see your balance journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="google-card p-6 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <TrendingUp className="text-blue-600" size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#202124]">Balance Journey Chart</h3>
            <p className="text-sm text-gray-500">Phase {currentPhase} — XAU/USD Funded Account Survival Story</p>
          </div>
        </div>
        {hasBreachedFloor ? (
          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold text-sm animate-pulse">
            <AlertTriangle size={16} /> DRAWDOWN BREACHED
          </div>
        ) : isNearFloor ? (
          <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-bold text-sm">
            <AlertTriangle size={16} /> Approaching Floor
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm">
            <Shield size={16} /> Account Safe
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium">Current Balance</p>
          <p className={`text-xl font-black mt-1 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className={`text-xs font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}{netReturnPct}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium">Floor Distance</p>
          <p className="text-xl font-black mt-1 text-gray-800">
            ${(finalBalance - maxDrawdownFloor).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400">above danger zone</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium">Target Gap</p>
          <p className="text-xl font-black mt-1 text-blue-700">
            ${Math.max(0, targetBalance - finalBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400">still needed</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium">Worst Streak</p>
          <p className="text-xl font-black mt-1 text-red-600">{worstStreak.count} losses</p>
          <p className="text-xs text-red-400">-${worstStreak.damage.toFixed(0)} damage</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs font-semibold text-gray-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Win Trade</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Loss Trade</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Break-Even</div>
        <div className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-blue-500 inline-block" /> Phase Target</div>
        <div className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-red-500 inline-block" /> Drawdown Floor</div>
      </div>

      {/* Chart */}
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <defs>
              {/* Green zone: above target */}
              <linearGradient id="greenZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              {/* Area under balance line */}
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              dy={8}
            />
            <YAxis
              domain={[yMin, yMax]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={50}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Drawdown Floor — thick red dashed */}
            <ReferenceLine
              y={maxDrawdownFloor}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="8 4"
              label={{ value: `⚠️ Floor $${maxDrawdownFloor.toLocaleString()}`, position: 'insideTopLeft', fill: '#ef4444', fontSize: 11, fontWeight: 700 }}
            />

            {/* Warning zone */}
            <ReferenceLine
              y={warningThreshold}
              stroke="#f97316"
              strokeWidth={1}
              strokeDasharray="4 4"
              label={{ value: 'Warning', position: 'insideTopRight', fill: '#f97316', fontSize: 10 }}
            />

            {/* Phase Target */}
            <ReferenceLine
              y={targetBalance}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="8 4"
              label={{ value: `🎯 Target $${targetBalance.toLocaleString()}`, position: 'insideBottomLeft', fill: '#3b82f6', fontSize: 11, fontWeight: 700 }}
            />

            {/* Starting balance */}
            <ReferenceLine
              y={accountSize}
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="4 4"
              label={{ value: `Start $${accountSize.toLocaleString()}`, position: 'insideBottomRight', fill: '#9ca3af', fontSize: 10 }}
            />

            {/* Area fill under balance */}
            <Area
              type="monotone"
              dataKey="balance"
              fill="url(#balanceGrad)"
              stroke="none"
              connectNulls
            />

            {/* The balance line itself */}
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Psychological insight */}
      {maxConsecutiveLosses >= 2 && (
        <div className="mt-5 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <Zap className="text-orange-500 mt-0.5 shrink-0" size={18} />
          <div className="text-sm">
            <p className="font-bold text-orange-800">Pattern Detected</p>
            <p className="text-orange-700 mt-0.5">
              Your worst losing streak was <strong>{worstStreak.count} consecutive losses</strong> causing <strong>-${worstStreak.damage.toFixed(0)}</strong> damage.
              This is when accounts become most vulnerable. Consider a hard rule: after {maxConsecutiveLosses >= 3 ? '2' : '1'} consecutive losses, stop trading for the day.
            </p>
          </div>
        </div>
      )}

      {finalBalance >= targetBalance && (
        <div className="mt-5 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="text-green-500 mt-0.5 shrink-0" size={18} />
          <div className="text-sm">
            <p className="font-bold text-green-800">🎉 Phase {currentPhase} Target Reached!</p>
            <p className="text-green-700 mt-0.5">Your balance has crossed the phase target. Go to your Trading page to advance to the next phase.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceJourneyChart;
