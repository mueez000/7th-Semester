import React, { useState, useEffect } from 'react';
import { AlertOctagon, Repeat, ShieldAlert, Activity, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const RevengeTradeDetector = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trades')
      .then(res => { if (res.data.success) setTrades(res.data.data || []); })
      .catch(e => console.error('RevengeTradeDetector load failed', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="google-card p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // 1. Sort trades chronologically
  const sortedTrades = [...trades]
    .filter(t => t.entryDate && t.pnl !== undefined)
    .sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));

  // 2. Process trades to detect revenge pattern
  // Rule: If >= 2 losses in the preceding 3 hours, current trade is flagged as Revenge
  let totalAccountPnl = 0;
  let revengeTrades = [];
  const processedTrades = sortedTrades.map((trade, i) => {
    totalAccountPnl += (trade.pnl || 0);
    let lossesInWindow = 0;
    const currentTradeTime = new Date(trade.entryDate).getTime();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

    for (let j = i - 1; j >= 0; j--) {
      const prevTradeTime = new Date(sortedTrades[j].entryDate).getTime();
      const timeDiff = currentTradeTime - prevTradeTime;
      
      if (timeDiff <= THREE_HOURS_MS) {
        if (sortedTrades[j].status === 'Loss') {
          lossesInWindow++;
        }
      } else {
        break; // went past 3 hours
      }
    }

    const isRevenge = lossesInWindow >= 2;
    const processed = { ...trade, isRevenge, lossesPreceding: lossesInWindow };
    
    if (isRevenge) {
      revengeTrades.push(processed);
    }
    
    return processed;
  });

  // Calculate Stats
  const totalRevengeCount = revengeTrades.length;
  const revengeWins = revengeTrades.filter(t => t.status === 'Win').length;
  const revengeWinRate = totalRevengeCount > 0 ? Math.round((revengeWins / totalRevengeCount) * 100) : 0;
  const totalRevengeDamage = revengeTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgRevengePnl = totalRevengeCount > 0 ? totalRevengeDamage / totalRevengeCount : 0;

  const hypotheticalPnl = totalAccountPnl - totalRevengeDamage;
  const revengeCostPct = totalAccountPnl > 0 || hypotheticalPnl > 0 
    ? Math.abs(totalRevengeDamage) / Math.abs(hypotheticalPnl) * 100 
    : 0;

  // For the history table, find sequences of trades around a revenge trade to show context
  // We'll just show the most recent trades that include revenge patterns, or last 10 if none.
  // Actually, a dedicated timeline of the *last sequence* that had a revenge trade is powerful.
  let displaySequence = [];
  if (totalRevengeCount > 0) {
    const lastRevengeIndex = processedTrades.findIndex(t => t._id === revengeTrades[revengeTrades.length - 1]._id);
    // Show 2 trades before and up to 2 trades after the revenge sequence
    let startIndex = Math.max(0, lastRevengeIndex - 3);
    let endIndex = Math.min(processedTrades.length - 1, lastRevengeIndex + 2);
    displaySequence = processedTrades.slice(startIndex, endIndex + 1);
  }

  if (processedTrades.length === 0) {
    return (
      <div className="google-card p-6 flex flex-col items-center justify-center h-64 text-gray-400">
        <Repeat size={40} className="mb-3 opacity-20" />
        <p className="font-medium text-gray-500">Not enough data yet</p>
        <p className="text-sm">Log more trades to detect psychological patterns.</p>
      </div>
    );
  }

  return (
    <div className="google-card p-6 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50">
            <ShieldAlert className="text-red-600" size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#202124]">Revenge Trade Detector</h3>
            <p className="text-sm text-gray-500">The #1 Account Killer — auto-detecting emotional cascades</p>
          </div>
        </div>
        {totalRevengeCount > 0 && (
          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold text-sm animate-pulse">
            <AlertOctagon size={16} /> PATTERNS DETECTED
          </div>
        )}
      </div>

      {totalRevengeCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-green-50 rounded-2xl border border-green-100">
          <ShieldAlert size={48} className="text-green-400 mb-3" />
          <h4 className="text-lg font-bold text-green-900">Zero Revenge Trades Detected!</h4>
          <p className="text-green-700 mt-1 max-w-md text-center">
            Excellent discipline. You haven't taken any forced trades after consecutive losses. Keep protecting your capital.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Stats Panel */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-inner">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
              Revenge Trade Analysis
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Total Detected</p>
                <p className="text-2xl font-black text-gray-900">{totalRevengeCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Win Rate</p>
                <p className="text-2xl font-black text-red-600">{revengeWinRate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Avg PnL (Revenge)</p>
                <p className="text-xl font-black text-red-600">${avgRevengePnl.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Total Damage</p>
                <p className="text-xl font-black text-red-700">-${Math.abs(totalRevengeDamage).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Account w/o revenge:</span>
                <span className={`font-black ${hypotheticalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {hypotheticalPnl >= 0 ? '+' : ''}${hypotheticalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <span className="text-sm font-semibold text-gray-600">Actual account:</span>
                <span className={`font-black ${totalAccountPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalAccountPnl >= 0 ? '+' : ''}${totalAccountPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-red-700">Revenge cost:</span>
                <div className="text-right">
                  <span className="font-black text-red-700">-${Math.abs(totalRevengeDamage).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="text-xs text-red-500 font-bold ml-2">({revengeCostPct.toFixed(0)}% of profit gone)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Sequence (Log) */}
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">
              Most Recent Incident Sequence
            </h4>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold text-center">Type</th>
                    <th className="px-4 py-3 font-semibold text-center">PnL</th>
                    <th className="px-4 py-3 font-semibold">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displaySequence.map((t, i) => {
                    const isRevenge = t.isRevenge;
                    const pnlColor = t.pnl >= 0 ? 'text-green-600' : 'text-red-600';
                    const timeStr = new Date(t.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <tr key={i} className={`${isRevenge ? 'bg-red-50/50' : ''} hover:bg-gray-50 transition-colors`}>
                        <td className="px-4 py-3 font-medium text-gray-600">{timeStr}</td>
                        <td className="px-4 py-3 text-center">
                           <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${t.status === 'Win' ? 'bg-green-100 text-green-700' : t.status === 'Loss' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                             {t.status}
                           </span>
                        </td>
                        <td className={`px-4 py-3 text-center font-black ${pnlColor}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(0)}
                        </td>
                        <td className="px-4 py-3">
                          {isRevenge ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg w-max">
                              <AlertOctagon size={12} /> REVENGE DETECTED
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Psychological Insight Box */}
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <Activity className="text-orange-500 mt-0.5 shrink-0" size={20} />
              <div className="text-sm">
                <p className="font-bold text-orange-900">Psychological Insight</p>
                <p className="text-orange-800 mt-1">
                  You have lost <strong>${Math.abs(totalRevengeDamage).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> to revenge trades. 
                  If you strictly follow this rule: <strong>"After 2 losses in a session, stop for the day"</strong>, 
                  your account balance would be significantly higher.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevengeTradeDetector;
