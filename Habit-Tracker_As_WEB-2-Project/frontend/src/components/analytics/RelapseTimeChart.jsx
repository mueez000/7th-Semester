import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Clock, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const TIME_BUCKETS = [
  { id: 'morning', label: 'Morning (6 AM - 12 PM)', color: '#fcd34d', minHour: 6, maxHour: 11, emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 6 PM)', color: '#fb923c', minHour: 12, maxHour: 17, emoji: '☀️' },
  { id: 'evening', label: 'Evening (6 PM - 10 PM)', color: '#818cf8', minHour: 18, maxHour: 21, emoji: '🌇' },
  { id: 'night', label: 'Late Night (10 PM - 6 AM)', color: '#312e81', minHour: 22, maxHour: 5, emoji: '🌙' }, // Wraps around
];

const RelapseTimeChart = () => {
  const [relapseHistory, setRelapseHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const historyRes = await api.get('/streak/history');
        if (historyRes.data.success) setRelapseHistory(historyRes.data.data.relapseHistory || []);
      } catch (e) {
        console.error('Relapse time load failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { chartData, mostVulnerable, totalCount } = useMemo(() => {
    if (!relapseHistory || relapseHistory.length === 0) {
      return { chartData: [], mostVulnerable: null, totalCount: 0 };
    }

    const counts = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    relapseHistory.forEach(r => {
      const date = new Date(r.date);
      const hour = date.getHours();

      if (hour >= 6 && hour < 12) counts.morning++;
      else if (hour >= 12 && hour < 18) counts.afternoon++;
      else if (hour >= 18 && hour < 22) counts.evening++;
      else counts.night++;
    });

    const data = TIME_BUCKETS.map(b => ({
      ...b,
      value: counts[b.id]
    })).filter(d => d.value > 0);

    let max = null;
    if (data.length > 0) {
      max = data.reduce((prev, current) => (prev.value > current.value) ? prev : current);
    }

    return { chartData: data, mostVulnerable: max, totalCount: relapseHistory.length };
  }, [relapseHistory]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const percent = Math.round((d.value / totalCount) * 100);
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3 text-sm min-w-[150px]">
        <p className="font-bold text-[#202124] mb-1">{d.emoji} {d.label.split('(')[0].trim()}</p>
        <div className="flex justify-between items-center text-[#5f6368]">
          <span className="font-semibold" style={{ color: d.color }}>{d.value} relapses</span>
          <span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">{percent}%</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Relapse Time-of-Day</h3>
            <p className="text-xs text-gray-500 mt-0.5">When are you most vulnerable?</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-[#9aa0a6] text-sm">Loading time data...</div>
      </div>
    );
  }

  return (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Clock size={20} className="text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#202124]">Relapse Time-of-Day</h3>
          <p className="text-xs text-[#5f6368] mt-0.5">Identifying your most vulnerable hours</p>
        </div>
      </div>

      {!chartData || chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Clock size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">No relapses recorded</p>
          <p className="text-xs mt-1">Keep your streak going!</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="h-56 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  content={(props) => {
                    const { payload } = props;
                    return (
                      <ul className="space-y-2">
                        {payload.map((entry, index) => (
                          <li key={`item-${index}`} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            {entry.payload.emoji} {entry.value.split('(')[0].trim()}
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-4">
            {mostVulnerable && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 relative overflow-hidden">
                <ShieldAlert className="absolute top-4 right-4 text-orange-200 opacity-50" size={64} />
                <h4 className="text-orange-800 font-bold mb-1 relative z-10">Vulnerability Alert</h4>
                <p className="text-orange-700 text-sm leading-relaxed relative z-10">
                  <span className="font-extrabold text-orange-900 text-lg">{Math.round((mostVulnerable.value / totalCount) * 100)}%</span> of your relapses happen during the <strong>{mostVulnerable.label.split('(')[0].trim().toLowerCase()}</strong>.
                </p>
                <p className="text-orange-600 text-xs mt-3 relative z-10 font-medium">
                  {mostVulnerable.id === 'night' && "Late nights are dangerous. Consider turning off your devices at 10 PM and building a strong sleep routine."}
                  {mostVulnerable.id === 'morning' && "Mornings are your weak point. Jump out of bed immediately and start your deep work right away."}
                  {mostVulnerable.id === 'afternoon' && "Afternoon slumps are getting you. Try a 20-minute power nap or a quick walk instead of scrolling."}
                  {mostVulnerable.id === 'evening' && "You're slipping up after work. Plan an engaging hobby or a workout right after you finish work."}
                </p>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
               <span className="text-sm font-semibold text-gray-600">Total Analyzed</span>
               <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm font-bold text-gray-800 shadow-sm">{totalCount} Relapses</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelapseTimeChart;
