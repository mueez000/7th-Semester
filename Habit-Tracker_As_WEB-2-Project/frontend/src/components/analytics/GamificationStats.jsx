import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  BarChart3, 
  History, 
  Zap, 
  Flame, 
  TrendingUp 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import gamificationService from '../../services/gamificationService';

const COLORS = ['#1a73e8', '#34a853', '#fbbc05', '#ea4335', '#a142f4', '#24c1e0'];

const GamificationStats = () => {
  const [stats, setStats] = useState({
    categoryXP: [],
    dailyXP: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await gamificationService.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch gamification stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="google-card p-8 bg-white animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64 bg-gray-100 rounded-xl"></div>
        <div className="h-64 bg-gray-100 rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="google-card p-6 md:p-8 bg-white border border-[#dadce0]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-[#202124] flex items-center">
            <Trophy className="mr-3 text-[#fbbc05]" size={24} /> Gamification Insights
          </h2>
          <div className="flex space-x-2">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center">
              <History size={12} className="mr-1" /> Lifetime View
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart: XP by Category */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
              <BarChart3 size={16} className="mr-2" /> XP Distribution
            </h3>
            <div className="h-64 w-full">
              {stats.categoryXP.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryXP}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="totalXP"
                      nameKey="source"
                    >
                      {stats.categoryXP.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Start earning XP to see distribution
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart: Recent Daily XP */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
              <TrendingUp size={16} className="mr-2" /> Recent Growth
            </h3>
            <div className="h-64 w-full">
               {stats.dailyXP.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyXP}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#5f6368'}}
                        format={(val) => val.split('-').slice(1).join('/')}
                      />
                      <YAxis hide />
                      <ReTooltip 
                         cursor={{fill: '#f8f9fa'}}
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="amount" fill="#1a73e8" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                   Activity history will appear here
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
           <div className="p-4 bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center text-center">
              <Zap className="text-blue-600 mb-1" size={20} />
              <span className="text-xl font-bold text-blue-900">{stats.categoryXP.reduce((a, b) => a + b.totalXP, 0)}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Total XP</span>
           </div>
           <div className="p-4 bg-orange-50/50 rounded-2xl flex flex-col items-center justify-center text-center">
              <Flame className="text-orange-600 mb-1" size={20} />
              <span className="text-xl font-bold text-orange-900">{stats.dailyXP.length}</span>
              <span className="text-[10px] font-bold text-orange-600 uppercase">Active Days</span>
           </div>
           <div className="p-4 bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center text-center">
              <Trophy className="text-emerald-600 mb-1" size={20} />
              <span className="text-xl font-bold text-emerald-900">{stats.categoryXP.length}</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Disciplines</span>
           </div>
           <div className="p-4 bg-purple-50/50 rounded-2xl flex flex-col items-center justify-center text-center">
              <BarChart3 className="text-purple-600 mb-1" size={20} />
              <span className="text-xl font-bold text-purple-900">
                {(stats.categoryXP.reduce((a, b) => a + b.totalXP, 0) / (stats.dailyXP.length || 1)).toFixed(0)}
              </span>
              <span className="text-[10px] font-bold text-purple-600 uppercase">Avg XP/Day</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationStats;
