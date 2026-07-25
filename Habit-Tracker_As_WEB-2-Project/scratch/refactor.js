const fs = require('fs');
const path = 'c:/Users/moiah/Desktop/New folder/Habit-Tracker_As_WEB-2-Project/frontend/src/pages/Analytics.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state
content = content.replace(
  "const [isExporting, setIsExporting] = useState(false);",
  "const [isExporting, setIsExporting] = useState(false);\n  const [activeTab, setActiveTab] = useState('Overview');\n  const TABS = ['Overview', 'Trading', 'Deep Work', 'Productivity', 'Commitment'];"
);

// 2. Replace the return statement
const returnStart = content.indexOf('  return (\n    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-in fade-in duration-500">');
if (returnStart === -1) throw new Error("Could not find return statement");

const newReturn = `  return (
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

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide bg-white p-2 rounded-2xl border border-[#dadce0] shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={\`px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors \${
              activeTab === tab 
                ? 'bg-[#e8f0fe] text-[#1967d2] shadow-sm' 
                : 'text-[#5f6368] hover:bg-gray-50 hover:text-[#202124]'
            }\`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="google-card p-6 bg-gradient-to-br from-[#e8f0fe] to-[#fff]">
              <h3 className="text-sm font-semibold text-[#1967d2] uppercase tracking-wider mb-4 border-b border-[#d2e3fc] pb-2">
                Monthly Average Trend
              </h3>
              <div className="space-y-3">
                {[
                  { icon: <Clock size={15}/>, label: 'Deep Work', value: \`\${data.monthlyAverages?.work || 0} hrs/day\`, color: 'text-blue-600' },
                  { icon: <CheckCircle size={15}/>, label: 'Tasks', value: \`\${data.monthlyAverages?.productivity || 0} /day\`, color: 'text-amber-600' },
                  { icon: <Shield size={15}/>, label: 'Commitment', value: \`\${data.monthlyAverages?.streak || 0} relapses\`, color: 'text-purple-600' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-[#e8f0fe] last:border-0">
                    <span className={\`font-medium flex items-center gap-2 text-[#3c4043] \${row.color}\`}>{row.icon} {row.label}</span>
                    <span className="font-bold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded text-sm">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

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
                  <div key={item.label} className={\`rounded-2xl border p-3 text-center \${item.color} \${item.label === 'Commitment' ? 'py-4' : ''}\`}>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs font-semibold mt-0.5 opacity-80">{item.icon}{item.label}</p>
                    <p className="text-[10px] opacity-60">days</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

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

          <AIInsights />
          <HabitTimingChart timingData={data.timingData} />
          <ContributionHeatmap heatmapData={heatmapData} />
          <HabitCalendar selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} calendarData={data.calendar} />
        </div>
      )}

      {/* Trading Tab */}
      {activeTab === 'Trading' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <BalanceJourneyChart />
          <BestHourChart />
          <EmotionHeatmap />
          <RevengeTradeDetector />
        </div>
      )}

      {/* Deep Work Tab */}
      {activeTab === 'Deep Work' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <FocusQualityChart />
          <TimeOfDayChart timingData={data.timingData} />
        </div>
      )}

      {/* Productivity Tab */}
      {activeTab === 'Productivity' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <VelocityChart />
          <GoalTrajectory selectedMonth={selectedMonth} />
        </div>
      )}

      {/* Commitment Tab */}
      {activeTab === 'Commitment' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <StreakDistributionChart />
          <RelapseTimeChart />
          <StreakEnduranceChart />
        </div>
      )}

    </div>
  );
};

export default Analytics;`;

content = content.substring(0, returnStart) + newReturn;
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refactored Analytics.jsx');
