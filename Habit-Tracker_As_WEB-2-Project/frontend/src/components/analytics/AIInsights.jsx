import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, AlertTriangle, Lightbulb, Trophy, Zap, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const TYPE_CONFIG = {
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    icon: <AlertTriangle size={16} className="text-amber-600" />,
    label: 'Warning',
    barColor: 'bg-amber-400',
  },
  achievement: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: <Trophy size={16} className="text-emerald-600" />,
    label: 'Achievement',
    barColor: 'bg-emerald-400',
  },
  tip: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: <Lightbulb size={16} className="text-blue-600" />,
    label: 'Tip',
    barColor: 'bg-blue-400',
  },
  encouragement: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    icon: <Zap size={16} className="text-purple-600" />,
    label: 'Push',
    barColor: 'bg-purple-400',
  },
};

const InsightCard = ({ insight, index }) => {
  const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.tip;
  return (
    <div
      className={`rounded-2xl border p-4 ${config.bg} ${config.border} transition-all duration-300 hover:shadow-md animate-in slide-in-from-bottom-2`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Big Emoji */}
        <div className="text-3xl leading-none mt-0.5 shrink-0">{insight.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
              {config.icon}
              {config.label}
            </span>
          </div>
          <h4 className="text-sm font-bold text-[#202124] leading-tight mb-1">{insight.title}</h4>
          <p className="text-xs text-[#5f6368] leading-relaxed">{insight.message}</p>
        </div>
      </div>
    </div>
  );
};

const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await api.get('/analytics/insights');
      if (res.data.success) setInsights(res.data.data);
    } catch (e) {
      console.error('Insights load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#202124] flex items-center gap-2">
            <Brain className="text-[#1a73e8]" size={20} />
            AI Insights & Warnings
          </h3>
          <p className="text-xs text-[#5f6368] mt-1">Smart patterns detected from your habit data</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] px-3 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 p-4 bg-gray-50 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#9aa0a6]">
          <Brain size={40} className="mb-3 opacity-20" />
          <p className="text-sm">No insights yet</p>
          <p className="text-xs mt-1">Keep logging to unlock pattern analysis</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} index={i} />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
            <TrendingUp size={10} />
            Insights are generated from your last 60 days of activity
          </p>
        </>
      )}
    </div>
  );
};

export default AIInsights;
