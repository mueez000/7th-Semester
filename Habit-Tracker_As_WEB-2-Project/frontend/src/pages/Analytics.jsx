import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, Layers, CheckCircle, Download, Clock, Moon, Activity, Flame, Smartphone, BookOpen, Shield } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import HabitCalendar from '../components/analytics/HabitCalendar';
import GamificationStats from '../components/analytics/GamificationStats';
import { exportAllData } from '../services/exportService';

const Analytics = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState({
    namazData: [],
    namazData: [],
    workData: [],
    exerciseData: [],
    productivityData: [],
    socialData: [],
    readingData: [],
    monthlyAverages: {},
    highestStreaks: {},
    calendar: {
      namaz: [], work: [], exercise: [], productivity: [],
      namazCounts: {}, workMinutes: {}, exerciseMinutes: {}, productivityCounts: {}
    }
  });

  useEffect(() => { fetchAnalytics(selectedMonth); }, [selectedMonth]);

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
    <div className="flex h-full items-center justify-center text-[#9aa0a6] text-sm">{msg}</div>
  );

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* Header */}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT: Heatmap + Monthly Averages + Streaks */}
        <div className="xl:col-span-1 space-y-6">
          <HabitCalendar selectedMonth={selectedMonth} onMonthChange={setSelectedMonth}
            calendarData={data.calendar} />

          {/* Monthly Averages */}
          <div className="google-card p-6 bg-gradient-to-br from-[#e8f0fe] to-[#fff]">
            <h3 className="text-sm font-semibold text-[#1967d2] uppercase tracking-wider mb-4 border-b border-[#d2e3fc] pb-2">
              Monthly Average Trend
            </h3>
            <div className="space-y-3">
              {[
                { icon: <Moon size={15}/>, label: 'Namaz', value: `${data.monthlyAverages?.namaz || 0}% avg`, color: 'text-emerald-600' },
                { icon: <Clock size={15}/>, label: 'Deep Work', value: `${data.monthlyAverages?.work || 0} hrs/day`, color: 'text-blue-600' },
                { icon: <Activity size={15}/>, label: 'Exercise', value: `${data.monthlyAverages?.exercise || 0} mins/day`, color: 'text-rose-600' },
                { icon: <CheckCircle size={15}/>, label: 'Tasks', value: `${data.monthlyAverages?.productivity || 0} /day`, color: 'text-amber-600' },
                { icon: <Smartphone size={15}/>, label: 'Social Media', value: `${data.monthlyAverages?.social || 0} mins/day`, color: 'text-pink-600' },
                { icon: <BookOpen size={15}/>, label: 'Reading', value: `${data.monthlyAverages?.reading || 0} pgs/day`, color: 'text-[#b45309]' },
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
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Namaz', value: data.highestStreaks?.namaz || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'Deep Work', value: data.highestStreaks?.work || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: 'Exercise', value: data.highestStreaks?.exercise || 0, color: 'bg-rose-50 text-rose-700 border-rose-200' },
                { label: 'Reading', value: data.highestStreaks?.reading || 0, color: 'bg-amber-50 text-[#b45309] border-amber-200' },
                { label: 'Commitment', value: data.highestStreaks?.streak || 0, color: 'bg-purple-50 text-[#6b21a8] border-purple-200', icon: <Shield size={14} className="inline mr-1"/> },
                { label: 'Social Media', value: `${data.highestStreaks?.social || 0}m`, color: 'bg-pink-50 text-pink-700 border-pink-200' },
              ].map(item => (
                <div key={item.label} className={`rounded-2xl border p-3 text-center ${item.color}`}>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs font-semibold mt-0.5 opacity-80">{item.icon}{item.label}</p>
                  <p className="text-xs opacity-60">{item.label === 'Social Media' ? 'best session' : 'days'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Charts */}
        <div className="xl:col-span-2 space-y-6">
          {loading ? (
            <div className="h-96 w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
            </div>
          ) : (
            <>
              {/* 4 Habit Charts in 2x2 Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <ChartCard title="Daily Prayers" icon={<Layers size={20}/>} color="#34a853">
                  {data.namazData.length === 0 ? <EmptyState msg="No prayers logged this month" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.namazData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 5]} tickCount={6} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="prayers" stroke="#34a853" strokeWidth={3} dot={{ r: 3, fill: '#34a853' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

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


                <ChartCard title="Exercise Minutes" icon={<Activity size={20}/>} color="#e37400">
                  {!data.exerciseData || data.exerciseData.length === 0 ? <EmptyState msg="No exercises logged" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.exerciseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="duration" fill="#e37400" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard title="Social Media Time" icon={<Smartphone size={20}/>} color="#E4405F">
                  {!data.socialData || data.socialData.length === 0 ? <EmptyState msg="No social media logged" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.socialData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="minutes" fill="#E4405F" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard title="Pages Read" icon={<BookOpen size={20}/>} color="#b45309">
                  {!data.readingData || data.readingData.length === 0 ? <EmptyState msg="No reading logged" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.readingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="pages" fill="#b45309" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard title="Commitment Streak" icon={<Shield size={20}/>} color="#a855f7">
                  {!data.streakData || data.streakData.length === 0 ? <EmptyState msg="No streak data logged" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.streakData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="days" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

              </div>

              {/* Tasks — full width below */}
              <div className="google-card p-6 w-full animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-[#202124] flex items-center mb-5">
                  <CheckCircle size={20} className="mr-2 text-[#fbbc04]" /> Tasks Completed Per Day
                </h3>
                <div className="h-44 w-full">
                  {!data.productivityData || data.productivityData.length === 0 ? (
                    <EmptyState msg="No tasks completed this month" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.productivityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                        <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="completed" fill="#fbbc04" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gamification Statistics Section */}
      <div className="mt-8">
        <GamificationStats />
      </div>
    </div>
  );
};

export default Analytics;
