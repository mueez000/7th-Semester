import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart2, CheckCircle, Download, Clock, Flame, Activity, Shield } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import HabitCalendar from '../components/analytics/HabitCalendar';
import HabitTimingChart from '../components/analytics/HabitTimingChart';
import ContributionHeatmap from '../components/analytics/ContributionHeatmap';
import TimeOfDayChart from '../components/analytics/TimeOfDayChart';
import VelocityChart from '../components/analytics/VelocityChart';
import AIInsights from '../components/analytics/AIInsights';
import StreakDistributionChart from '../components/analytics/StreakDistributionChart';
import StreakEnduranceChart from '../components/analytics/StreakEnduranceChart';
import RelapseTimeChart from '../components/analytics/RelapseTimeChart';
import GoalTrajectory from '../components/analytics/GoalTrajectory';
import FocusQualityChart from '../components/analytics/FocusQualityChart';
import { exportAllData } from '../services/exportService';

const Analytics = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [heatmapData, setHeatmapData] = useState({ work: {}, tasks: {} });
  const [data, setData] = useState({
    workData: [],
    productivityData: [],
    streakData: [],
    timingData: { work: [], productivity: [], streak: [] },
    monthlyAverages: {},
    highestStreaks: {},
    calendar: {
      work: [], productivity: [], streak: [],
      workMinutes: {}, productivityCounts: {}, streakRelapses: [], streakDayNumbers: {}
    }
  });

  useEffect(() => { fetchAnalytics(selectedMonth); }, [selectedMonth]);
  useEffect(() => { fetchHeatmap(); }, []);

  const fetchAnalytics = async (dateObj) => {
    try {
      setLoading(true);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const res = await api.get(`/analytics/overview?year=${year}&month=${month}`);
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await api.get('/analytics/heatmap');
      if (res.data.success) setHeatmapData(res.data.data);
    } catch (error) {
      console.error('Heatmap load failed', error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const success = await exportAllData();
    setIsExporting(false);
    if (success) toast.success('Data exported successfully!');
    else toast.error('Export failed');
  };

  const ChartCard = ({ title, icon, color, children }) => (
    <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-bold text-[#202124] flex items-center mb-5">
        <span className="mr-2" style={{ color }}>{icon}</span> {title}
      </h3>
      <div className="h-44 w-full">{children}</div>
    </div>
  );

  const EmptyState = ({ msg }) => (
    <div className="flex h-full flex-col items-center justify-center text-[#9aa0a6] text-sm">
      <Activity size={32} className="mb-3 opacity-20" />
      <p>{msg}</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#dadce0]">
        <div>
          <h1 className="text-2xl font-bold text-[#202124] flex items-center">
            <BarChart2 className="text-[#1a73e8] mr-3" size={28} /> Analytics & Reports
          </h1>
          <p className="text-[#5f6368] mt-1 ml-10">Review your past performance and consistency patterns.</p>
        </div>
        <button onClick={handleExport} disabled={isExporting}
          className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#174ea6] text-white font-semibold px-5 py-2.5 rounded-full transition-all hover:shadow-lg disabled:opacity-50 whitespace-nowrap">
          <Download size={18} />
          {isExporting ? 'Generating Excel...' : 'Export Data (.xlsx)'}
        </button>
      </div>

      {/* 2. Monthly Averages & Streaks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Averages */}
        <div className="google-card p-6 bg-gradient-to-br from-[#e8f0fe] to-[#fff]">
          <h3 className="text-sm font-semibold text-[#1967d2] uppercase tracking-wider mb-4 border-b border-[#d2e3fc] pb-2">
            Monthly Average Trend
          </h3>
          <div className="space-y-3">
            {[
              { icon: <Clock size={15}/>, label: 'Deep Work', value: `${data.monthlyAverages?.work || 0} hrs/day`, color: 'text-blue-600' },
              { icon: <CheckCircle size={15}/>, label: 'Tasks', value: `${data.monthlyAverages?.productivity || 0} /day`, color: 'text-amber-600' },
              { icon: <Shield size={15}/>, label: 'Commitment', value: `${data.monthlyAverages?.streak || 0} relapses`, color: 'text-purple-600' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-[#e8f0fe] last:border-0">
                <span className={`font-medium flex items-center gap-2 text-[#3c4043] ${row.color}`}>{row.icon} {row.label}</span>
                <span className="font-bold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded text-sm">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Streaks */}
        <div className="google-card p-6">
          <h3 className="text-sm font-semibold text-[#202124] uppercase tracking-wider mb-4 border-b border-[#dadce0] pb-2 flex items-center gap-2">
            <Flame size={16} className="text-orange-500" /> Highest Streaks (All Time)
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Deep Work', value: data.highestStreaks?.work || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Tasks', value: data.highestStreaks?.productivity || 0, color: 'bg-[#fff8e1] text-[#b08d00] border-[#ffe082]' },
              { label: 'Commitment', value: data.highestStreaks?.streak || 0, color: 'bg-purple-50 text-[#6b21a8] border-purple-200 col-span-2 lg:col-span-1', icon: <Shield size={14} className="inline mr-1"/> },
            ].map(item => (
              <div key={item.label} className={`rounded-2xl border p-3 text-center ${item.color} ${item.label === 'Commitment' ? 'py-4' : ''}`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-semibold mt-0.5 opacity-80">{item.icon}{item.label}</p>
                <p className="text-[10px] opacity-60">days</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Metric Charts (Moved to top as daily breakdown of averages) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ChartCard title="Deep Work Hours" icon={<Clock size={20}/>} color="#1a73e8">
          {data.workData.length === 0 ? <EmptyState msg="No work sessions logged" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="hours" fill="#1a73e8" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Tasks Completed" icon={<CheckCircle size={20}/>} color="#fbbc04">
          {!data.productivityData || data.productivityData.length === 0 ? <EmptyState msg="No tasks completed" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.productivityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="completed" fill="#fbbc04" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Commitment Streak" icon={<Shield size={20}/>} color="#a855f7">
          {!data.streakData || data.streakData.length === 0 ? <EmptyState msg="No streak data" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.streakData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorStreakLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="step" dataKey="days" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorStreakLight)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* 4. AI Insights */}
      <div className="w-full">
        <AIInsights />
      </div>

      {/* 5. Goal Trajectory */}
      <div className="w-full">
        <GoalTrajectory selectedMonth={selectedMonth} />
      </div>

      {/* 6. Contribution Heatmap */}
      <div className="w-full">
        <ContributionHeatmap heatmapData={heatmapData} />
      </div>

      {/* 7. Focus Quality */}
      <div className="w-full">
        <FocusQualityChart />
      </div>

      {/* 8. Time-of-Day Analysis */}
      <div className="w-full">
        <TimeOfDayChart timingData={data.timingData} />
      </div>

      {/* 9. Velocity / Burn-down */}
      <div className="w-full">
        <VelocityChart />
      </div>

      {/* 10. Streak Length Distribution */}
      <div className="w-full">
        <StreakDistributionChart />
      </div>

      {/* 11. Relapse Time Chart */}
      <div className="w-full">
        <RelapseTimeChart />
      </div>

      {/* 12. Streak Endurance Chart */}
      <div className="w-full">
        <StreakEnduranceChart />
      </div>

      {/* 13. Calendar */}
      <div className="w-full">
        <HabitCalendar selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} calendarData={data.calendar} />
      </div>

      {/* 14. Routine Timeline */}
      <div className="w-full">
        <HabitTimingChart timingData={data.timingData} />
      </div>

    </div>
  );
};

export default Analytics;
