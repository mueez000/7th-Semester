import React, { useState, useEffect } from 'react';
import { Brain, Trophy, AlertTriangle, Zap, Target } from 'lucide-react';
import api from '../../services/api';

const EMOTION_META = {
  'FOMO': { icon: '😤', type: 'negative' },
  'Greed': { icon: '💰', type: 'negative' },
  'Fear': { icon: '😰', type: 'negative' },
  'Revenge': { icon: '🤬', type: 'negative' },
  'Confident': { icon: '😊', type: 'positive' },
  'Disciplined': { icon: '🧘', type: 'positive' },
  'Neutral': { icon: '😐', type: 'neutral' },
};

const getEmotionMeta = (emotion) => {
  return EMOTION_META[emotion] || { icon: '🧠', type: 'neutral' };
};

const getPerformanceColor = (winRate, count) => {
  if (count === 0) return 'text-gray-400 bg-gray-50';
  if (winRate >= 60) return 'text-green-700 bg-green-50 font-bold';
  if (winRate >= 40) return 'text-yellow-700 bg-yellow-50 font-bold';
  return 'text-red-700 bg-red-50 font-bold';
};

const getPerformanceIndicator = (winRate, count) => {
  if (count === 0) return '';
  if (winRate >= 60) return '🟢';
  if (winRate >= 40) return '🟡';
  return '🔴';
};

const EmotionHeatmap = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trades')
      .then(res => { if (res.data.success) setTrades(res.data.data || []); })
      .catch(e => console.error('EmotionHeatmap load failed', e))
      .finally(() => setLoading(false));
  }, []);

  // Process data
  const emotionStats = {};
  
  // Initialize with standard emotions
  Object.keys(EMOTION_META).forEach(emo => {
    emotionStats[emo] = {
      emotion: emo,
      wins: 0,
      losses: 0,
      be: 0,
      totalPnl: 0,
      count: 0
    };
  });

  let totalAccountPnl = 0;

  trades.forEach(t => {
    if (!t.emotion || t.pnl === undefined) return;
    const emo = t.emotion;
    totalAccountPnl += t.pnl;
    
    if (!emotionStats[emo]) {
      emotionStats[emo] = {
        emotion: emo,
        wins: 0,
        losses: 0,
        be: 0,
        totalPnl: 0,
        count: 0
      };
    }

    emotionStats[emo].count += 1;
    emotionStats[emo].totalPnl += t.pnl;
    
    if (t.status === 'Win') emotionStats[emo].wins += 1;
    else if (t.status === 'Loss') emotionStats[emo].losses += 1;
    else emotionStats[emo].be += 1; // Break-Even or Pending (we assume BE if not Win/Loss but has PnL)
  });

  const processedData = Object.values(emotionStats).map(stat => {
    const avgPnl = stat.count > 0 ? stat.totalPnl / stat.count : 0;
    const winRate = stat.count > 0 ? Math.round((stat.wins / stat.count) * 100) : 0;
    return { ...stat, avgPnl, winRate };
  });

  // Sort: primarily by count (descending) so most frequent are on top, then by name
  processedData.sort((a, b) => b.count - a.count || a.emotion.localeCompare(b.emotion));

  // Insights Calculations
  const tradedEmotions = processedData.filter(d => d.count > 0);
  
  const mostDangerous = tradedEmotions.length > 0
    ? tradedEmotions.reduce((worst, curr) => (curr.totalPnl < worst.totalPnl ? curr : worst), tradedEmotions[0])
    : null;

  const bestMentalState = tradedEmotions.length > 0
    ? tradedEmotions.reduce((best, curr) => (curr.totalPnl > best.totalPnl ? curr : best), tradedEmotions[0])
    : null;

  const positiveEmotions = ['Confident', 'Disciplined'];
  let positivePnl = 0;
  let positiveWins = 0;
  let positiveLosses = 0;
  
  trades.forEach(t => {
    if (t.emotion && positiveEmotions.includes(t.emotion) && t.pnl !== undefined) {
      positivePnl += t.pnl;
      if (t.status === 'Win') positiveWins++;
      if (t.status === 'Loss') positiveLosses++;
    }
  });
  
  // Calculate potential net PnL if ONLY positive emotions were traded
  // This assumes the user skipped all negative/neutral emotion trades.
  const idealPnl = positivePnl;

  if (loading) {
    return (
      <div className="google-card p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="google-card p-6 flex flex-col items-center justify-center h-64 text-gray-400">
        <Brain size={40} className="mb-3 opacity-20" />
        <p className="font-medium text-gray-500">No emotional data yet</p>
        <p className="text-sm">Log your trades with emotions to see your psychological DNA.</p>
      </div>
    );
  }

  return (
    <div className="google-card p-6 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50">
            <Brain className="text-indigo-600" size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#202124]">Emotion vs PnL Heatmap</h3>
            <p className="text-sm text-gray-500">Discover your trading psychology DNA</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm text-left border-collapse border border-gray-200 rounded-xl hidden md:table">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 border-b border-gray-200 rounded-tl-xl font-bold uppercase text-xs">Emotion</th>
              <th className="px-4 py-3 border-b border-gray-200 text-center font-bold uppercase text-xs">Wins</th>
              <th className="px-4 py-3 border-b border-gray-200 text-center font-bold uppercase text-xs">Losses</th>
              <th className="px-4 py-3 border-b border-gray-200 text-center font-bold uppercase text-xs">B/E</th>
              <th className="px-4 py-3 border-b border-gray-200 text-center font-bold uppercase text-xs">Win Rate</th>
              <th className="px-4 py-3 border-b border-gray-200 text-center font-bold uppercase text-xs rounded-tr-xl">Avg PnL</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, i) => {
              const meta = getEmotionMeta(row.emotion);
              const indicator = getPerformanceIndicator(row.winRate, row.count);
              const pnlColorClass = row.avgPnl > 0 ? 'text-green-600' : row.avgPnl < 0 ? 'text-red-600' : 'text-gray-500';
              
              // To make it look like a heatmap, we color the cells based on good/bad
              const winCellColor = row.wins > 0 && row.winRate >= 50 ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600';
              const lossCellColor = row.losses > 0 && row.winRate < 50 ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-600';
              
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span> {row.emotion}
                  </td>
                  <td className={`px-4 py-3 text-center ${winCellColor}`}>
                    {row.wins} {row.wins > 0 && indicator === '🟢' && '🟢'}
                  </td>
                  <td className={`px-4 py-3 text-center ${lossCellColor}`}>
                    {row.losses} {row.losses > 0 && indicator === '🔴' && '🔴'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{row.be}</td>
                  <td className="px-4 py-3 text-center">
                    {row.count > 0 ? (
                       <span className={`px-2 py-1 rounded-lg ${getPerformanceColor(row.winRate, row.count)}`}>
                         {row.winRate}%
                       </span>
                    ) : '-'}
                  </td>
                  <td className={`px-4 py-3 text-center font-black ${pnlColorClass}`}>
                    {row.count > 0 ? `${row.avgPnl >= 0 ? '+' : ''}$${row.avgPnl.toFixed(2)}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Mobile View */}
        <div className="md:hidden space-y-3">
           {processedData.map((row, i) => {
             const meta = getEmotionMeta(row.emotion);
             const pnlColorClass = row.avgPnl > 0 ? 'text-green-600' : row.avgPnl < 0 ? 'text-red-600' : 'text-gray-500';
             return (
               <div key={i} className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm">
                 <div className="flex justify-between items-center mb-3">
                   <div className="font-bold text-gray-800 flex items-center gap-2">
                     <span className="text-xl">{meta.icon}</span> {row.emotion}
                   </div>
                   <div className={`font-black ${pnlColorClass}`}>
                     {row.count > 0 ? `${row.avgPnl >= 0 ? '+' : ''}$${row.avgPnl.toFixed(2)} avg` : 'No trades'}
                   </div>
                 </div>
                 {row.count > 0 && (
                   <div className="grid grid-cols-4 gap-2 text-center text-xs">
                     <div className="bg-gray-50 p-2 rounded-lg">
                       <p className="text-gray-500 mb-1">Wins</p>
                       <p className="font-bold text-green-600">{row.wins}</p>
                     </div>
                     <div className="bg-gray-50 p-2 rounded-lg">
                       <p className="text-gray-500 mb-1">Losses</p>
                       <p className="font-bold text-red-600">{row.losses}</p>
                     </div>
                     <div className="bg-gray-50 p-2 rounded-lg">
                       <p className="text-gray-500 mb-1">B/E</p>
                       <p className="font-bold text-gray-600">{row.be}</p>
                     </div>
                     <div className="bg-gray-50 p-2 rounded-lg">
                       <p className="text-gray-500 mb-1">Win %</p>
                       <p className="font-bold text-indigo-600">{row.winRate}%</p>
                     </div>
                   </div>
                 )}
               </div>
             )
           })}
        </div>
      </div>

      {/* Insights Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mostDangerous && mostDangerous.totalPnl < 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 mt-1 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-red-900 text-lg flex items-center gap-2">
                  ⚠️ Most Dangerous Emotion: {mostDangerous.emotion}
                </h4>
                <p className="text-red-800 mt-1 text-sm">
                  {mostDangerous.losses === mostDangerous.count && mostDangerous.count > 0 
                    ? `Every single ${mostDangerous.emotion.toLowerCase()} trade was a loss.` 
                    : `You have a poor ${mostDangerous.winRate}% win rate when feeling ${mostDangerous.emotion.toLowerCase()}.`}
                </p>
                <p className="text-red-900 font-black mt-2">
                  Total damage: -${Math.abs(mostDangerous.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({mostDangerous.count} trades)
                </p>
              </div>
            </div>
          </div>
        )}

        {bestMentalState && bestMentalState.totalPnl > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Trophy className="text-green-600 mt-1 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-green-900 text-lg flex items-center gap-2">
                  🏆 Best Mental State: {bestMentalState.emotion}
                </h4>
                <p className="text-green-800 mt-1 text-sm">
                  {bestMentalState.wins} wins, {bestMentalState.losses} losses = {bestMentalState.winRate}% win rate.
                </p>
                <p className="text-green-900 font-black mt-2">
                  Total profit in this state: +${bestMentalState.totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {(idealPnl > totalAccountPnl && totalAccountPnl !== 0) && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 md:col-span-2">
            <div className="flex items-start gap-3">
              <Zap className="text-indigo-600 mt-1 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                  💡 Discipline Rule Insight
                </h4>
                <p className="text-indigo-800 mt-1">
                  If you <strong>ONLY</strong> traded when feeling <strong>Confident</strong> or <strong>Disciplined</strong>:
                </p>
                <div className="mt-3 flex flex-wrap gap-6 items-center">
                  <div>
                    <p className="text-indigo-600/80 text-xs font-semibold uppercase tracking-wider">Hypothetical PnL</p>
                    <p className="text-2xl font-black text-indigo-700">${idealPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-indigo-300 hidden md:block">|</div>
                  <div>
                    <p className="text-indigo-600/80 text-xs font-semibold uppercase tracking-wider">Actual PnL</p>
                    <p className={`text-2xl font-black ${totalAccountPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${totalAccountPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold text-indigo-900 bg-white/50 inline-block px-3 py-1.5 rounded-lg">
                  Setup a rule: If emotion is {mostDangerous ? mostDangerous.emotion : 'negative'} → do NOT trade.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionHeatmap;
