import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart2, Layers, CheckCircle, Download, Clock, Moon, Activity, Flame, Brain, BookOpen, Shield, Users } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import HabitCalendar from '../components/analytics/HabitCalendar';
import HabitTimingChart from '../components/analytics/HabitTimingChart';
import { exportAllData } from '../services/exportService';

const Analytics = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState({
    namazData: [],
    workData: [],
    exerciseData: [],
    productivityData: [],
    socialData: [],
    readingData: [],
    streakData: [],
    timingData: { work: [], exercise: [], productivity: [], social: [], reading: [] },
    monthlyAverages: {},
    highestStreaks: {},
    allTimeNamazStats: { total: 0, jamat: 0, onTime: 0, qaza: 0, missed: 0, jamatPercentage: 0, onTimePercentage: 0, qazaPercentage: 0, missedPercentage: 0, perPrayer: {} },
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
    <div className="flex h-full flex-col items-center justify-center text-[#9aa0a6] text-sm">
      <Activity size={32} className="mb-3 opacity-20" />
      <p>{msg}</p>
    </div>
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

      {/* FULL WIDTH: Calendar */}
      <div className="w-full">
        <HabitCalendar selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} calendarData={data.calendar} />
      </div>

      {/* FULL WIDTH: Time-Series Routine Chart */}
      <div className="w-full">
        <HabitTimingChart timingData={data.timingData} />
      </div>

      {/* Monthly Averages & Streaks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Namaz', value: data.highestStreaks?.namaz || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Deep Work', value: data.highestStreaks?.work || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Exercise', value: data.highestStreaks?.exercise || 0, color: 'bg-rose-50 text-rose-700 border-rose-200' },
              { label: 'Tasks', value: data.highestStreaks?.productivity || 0, color: 'bg-[#fff8e1] text-[#b08d00] border-[#ffe082]' },
              { label: 'Reading', value: data.highestStreaks?.reading || 0, color: 'bg-amber-50 text-[#b45309] border-amber-200' },

              { label: 'Commitment', value: data.highestStreaks?.streak || 0, color: 'bg-purple-50 text-[#6b21a8] border-purple-200 col-span-2 lg:col-span-3', icon: <Shield size={14} className="inline mr-1"/> },
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

      {/* Bottom Metric Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ChartCard title="Daily Prayers" icon={<Layers size={20}/>} color="#34a853">
          {data.namazData.length === 0 ? <EmptyState msg="No prayers logged" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.namazData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorNamazLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34a853" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34a853" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 5]} tickCount={6} tick={{ fontSize: 11, fill: '#5f6368' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="prayers" stroke="#34a853" strokeWidth={3} fillOpacity={1} fill="url(#colorNamazLight)" />
              </AreaChart>
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

      {/* Monthly Namaz History */}
      {data.allTimeNamazStats && data.allTimeNamazStats.total > 0 && (() => {
        const ns = data.allTimeNamazStats;
        const totalCompleted = ns.jamat + ns.onTime + ns.qaza;
        const completionRate = ns.total > 0 ? Number(((totalCompleted / ns.total) * 100).toFixed(1)) : 0;
        const prayerLabels = { fajr: 'Fajr', zuhr: 'Zuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
        const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
        return (
        <div className="google-card p-6 w-full animate-in fade-in duration-500 delay-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#202124] flex items-center">
                <Moon className="text-[#34a853] mr-2" size={24} /> {monthName} — Namaz Report
              </h3>
              <p className="text-xs text-gray-400 ml-8 mt-1">{daysInMonth} days · {ns.total} total prayers</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completion</span>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${completionRate >= 80 ? 'bg-emerald-100 text-emerald-700' : completionRate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{completionRate}%</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/60 text-center">
              <Users size={20} className="mx-auto text-blue-600 mb-2" />
              <span className="text-3xl font-black text-blue-700 block">{ns.jamat}</span>
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">With Jamat</span>
              <span className="text-[10px] text-blue-500 block mt-1">{ns.jamatPercentage}%</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-200/60 text-center">
              <CheckCircle size={20} className="mx-auto text-emerald-600 mb-2" />
              <span className="text-3xl font-black text-emerald-700 block">{ns.onTime}</span>
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Prayed</span>
              <span className="text-[10px] text-emerald-500 block mt-1">{ns.onTimePercentage}%</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-200/60 text-center">
              <Clock size={20} className="mx-auto text-amber-600 mb-2" />
              <span className="text-3xl font-black text-amber-700 block">{ns.qaza}</span>
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Kaza</span>
              <span className="text-[10px] text-amber-500 block mt-1">{ns.qazaPercentage}%</span>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-2xl p-4 border border-rose-200/60 text-center">
              <Flame size={20} className="mx-auto text-rose-500 mb-2" />
              <span className="text-3xl font-black text-rose-600 block">{ns.missed}</span>
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Missed</span>
              <span className="text-[10px] text-rose-500 block mt-1">{ns.missedPercentage}%</span>
            </div>
          </div>

          {/* Stacked Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Distribution</span>
              <span className="text-xs text-gray-400">Total: {ns.total} prayers</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
              {ns.jamat > 0 && <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${ns.jamatPercentage}%` }} title={`Jamat: ${ns.jamatPercentage}%`}></div>}
              {ns.onTime > 0 && <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${ns.onTimePercentage}%` }} title={`Prayed: ${ns.onTimePercentage}%`}></div>}
              {ns.qaza > 0 && <div className="bg-amber-400 h-full transition-all duration-700" style={{ width: `${ns.qazaPercentage}%` }} title={`Kaza: ${ns.qazaPercentage}%`}></div>}
              {ns.missed > 0 && <div className="bg-rose-400 h-full transition-all duration-700" style={{ width: `${ns.missedPercentage}%` }} title={`Missed: ${ns.missedPercentage}%`}></div>}
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Jamat</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Prayed</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Kaza</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span> Missed</span>
            </div>
          </div>

          {/* Per-Prayer Breakdown Table */}
          {ns.perPrayer && Object.keys(ns.perPrayer).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Per-Prayer Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Prayer</th>
                      <th className="text-center py-2.5 px-3 text-xs font-bold text-blue-600 uppercase tracking-wider">Jamat</th>
                      <th className="text-center py-2.5 px-3 text-xs font-bold text-emerald-600 uppercase tracking-wider">Prayed</th>
                      <th className="text-center py-2.5 px-3 text-xs font-bold text-amber-600 uppercase tracking-wider">Kaza</th>
                      <th className="text-center py-2.5 px-3 text-xs font-bold text-rose-600 uppercase tracking-wider">Missed</th>
                      <th className="text-center py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(ns.perPrayer).map(([key, pp]) => {
                      const total = pp.jamat + pp.prayed + pp.kaza + pp.missed;
                      const rate = total > 0 ? Math.round(((pp.jamat + pp.prayed + pp.kaza) / total) * 100) : 0;
                      return (
                        <tr key={key} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-gray-800">{prayerLabels[key]}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md text-xs">{pp.jamat}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-xs">{pp.prayed}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md text-xs">{pp.kaza}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-md text-xs">{pp.missed}</span>
                            {pp.missed > 0 && pp.missedDates && pp.missedDates.length > 0 && (
                              <div className="mt-1.5 text-[10px] text-rose-600/80 max-w-[120px] mx-auto leading-tight max-h-[60px] overflow-y-auto custom-scrollbar">
                                {pp.missedDates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${rate}%` }}></div>
                              </div>
                              <span className={`text-xs font-bold ${rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        );
      })()}
    </div>
  );
};

export default Analytics;
