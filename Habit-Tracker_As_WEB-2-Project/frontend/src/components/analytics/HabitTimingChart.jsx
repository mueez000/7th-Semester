import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Activity, CheckCircle, BookOpen, Smartphone, Shield } from 'lucide-react';

const HabitTimingChart = ({ timingData }) => {
  const [view, setView] = useState('M'); // 'W' or 'M'
  const [activeHabit, setActiveHabit] = useState('work');

  const options = {
    work: { title: 'Deep Work', icon: <Clock size={16} />, color: '#1a73e8' },
    exercise: { title: 'Exercise', icon: <Activity size={16} />, color: '#e37400' },
    productivity: { title: 'Tasks', icon: <CheckCircle size={16} />, color: '#fbbc04' },
    reading: { title: 'Reading', icon: <BookOpen size={16} />, color: '#b45309' },
    streak: { title: 'Relapse', icon: <Shield size={16} />, color: '#ef5350' }
  };

  const { title, icon, color } = options[activeHabit];
  const data = timingData[activeHabit] || [];

  const formatTimeAMPM = (decimalHours) => {
    if (decimalHours === null || decimalHours === undefined) return '';
    let h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    if (m === 60) {
      h += 1;
    }
    const mins = m === 60 ? 0 : m;
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
    let displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;
    return `${String(displayHour).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
  };

  const formatTick = (val) => {
    if (val === 24) return '12:00 AM';
    if (val === 0) return '12:00 AM';
    if (val === 12) return '12:00 PM';
    return val > 12 ? `${String(val - 12).padStart(2, '0')}:00 PM` : `${String(val).padStart(2, '0')}:00 AM`;
  };

  let chartData = [];
  if (view === 'M') {
    // Pre-fill all days of the month (up to today or end of month)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const allMonthDays = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      allMonthDays.push({
        dateStr,
        dayLabel: i + (['st', 'nd', 'rd'][((i+90)%100-10)%10-1] || 'th'),
        sum: 0,
        count: 0,
        timeDecimal: null
      });
    }

    data.forEach(d => {
      const target = allMonthDays.find(day => day.dateStr === d.date);
      if (target) {
        target.sum += d.timeDecimal;
        target.count += 1;
      }
    });

    chartData = allMonthDays.map(d => ({
      dayLabel: d.dayLabel,
      dateStr: d.dateStr,
      timeDecimal: d.count > 0 ? Number((d.sum / d.count).toFixed(2)) : null
    }));
  } else {
    // Pre-fill last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      last7Days.push({
        dateStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sum: 0,
        count: 0,
        timeDecimal: null
      });
    }
    
    data.forEach(d => {
      const target = last7Days.find(day => day.dateStr === d.date);
      if (target) {
        target.sum += d.timeDecimal;
        target.count += 1;
      }
    });
    
    chartData = last7Days.map(d => ({
      dayLabel: d.dayLabel,
      dateStr: d.dateStr,
      timeDecimal: d.count > 0 ? Number((d.sum / d.count).toFixed(2)) : null
    }));
  }

  const validDataPoints = chartData.filter(d => d.timeDecimal !== null);
  let avgDecimal = 0;
  if (validDataPoints.length > 0) {
    avgDecimal = validDataPoints.reduce((acc, curr) => acc + curr.timeDecimal, 0) / validDataPoints.length;
  }

  let latestDecimal = 0;
  validDataPoints.forEach(d => {
    if (d.timeDecimal > latestDecimal) latestDecimal = d.timeDecimal;
  });

  const hasData = validDataPoints.length > 0;

  return (
    <div className="google-card p-6 w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#202124] flex items-center gap-3">
            <span className="p-2 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{icon}</span>
            Routine Timing
          </h3>
          <div className="mt-2 ml-11">
             <select 
               value={activeHabit} 
               onChange={e => setActiveHabit(e.target.value)}
               className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-semibold text-[#5f6368] hover:border-gray-300 focus:outline-none focus:border-[#1a73e8] transition"
             >
               <option value="productivity">Tasks Timing</option>
               <option value="exercise">Exercise Timing</option>
               <option value="reading">Reading Timing</option>
               <option value="work">Deep Work Timing</option>
               <option value="streak">Relapse Timing</option>
             </select>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('W')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${view === 'W' ? 'bg-white shadow-sm text-[#1a73e8]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setView('M')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${view === 'M' ? 'bg-white shadow-sm text-[#1a73e8]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="flex flex-col mb-6 ml-11">
        <p className="text-4xl font-bold text-[#202124] tracking-tight">{hasData ? formatTimeAMPM(avgDecimal) : '--:--'}</p>
        <p className="text-sm text-gray-500 font-medium mt-1">Avg {title.toLowerCase()} time</p>
      </div>

      {hasData && (
        <div className="mb-6 px-4 py-2.5 rounded-xl text-sm font-semibold ml-11 inline-block" style={{ backgroundColor: `${color}10`, color }}>
          Latest time this month: {formatTimeAMPM(latestDecimal)}
        </div>
      )}

      <div className="h-72 w-full mt-4">
        {!hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Clock size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No timing data available for this habit</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
              <XAxis dataKey="dayLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f6368', fontWeight: 500 }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                domain={[0, 24]} 
                ticks={[0, 4, 8, 12, 16, 20, 24]}
                tickFormatter={formatTick}
                tick={{ fontSize: 11, fill: '#5f6368' }} 
              />
              <Tooltip 
                cursor={{ stroke: '#f1f3f4', strokeWidth: 2 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #dadce0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(value) => [formatTimeAMPM(value), 'Time']}
                labelStyle={{ color: '#5f6368', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Line 
                type="linear" 
                dataKey="timeDecimal" 
                stroke={color} 
                strokeWidth={3} 
                connectNulls={true}
                dot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 7, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default HabitTimingChart;
