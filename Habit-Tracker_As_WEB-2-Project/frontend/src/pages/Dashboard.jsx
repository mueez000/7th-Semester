import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ArrowRight, CheckSquare, Play, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [summary, setSummary] = useState({
    workHours: 0,
    streakDays: 0,
  });
  const [todayTasks, setTodayTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const [workRes, tasksRes, streakRes] = await Promise.all([
          api.get('/work/today'),
          api.get(`/todo/tasks?dueDate=${new Date().toISOString().split('T')[0]}`),
          api.get('/streak/status'),
        ]);

        let computedWork = 0;
        let computedStreak = 0;

        if (workRes.data.success && workRes.data.data) {
           computedWork = Number((workRes.data.data.totalDuration / 3600).toFixed(1));
        }

        if (tasksRes.data.success) {
           setTodayTasks(tasksRes.data.data.filter(t => t.status !== 'completed' && t.status !== 'archived'));
        }

        if (streakRes.data.success && streakRes.data.data) {
           computedStreak = streakRes.data.data.currentStreak || 0;
        }

        setSummary({
          workHours: computedWork,
          streakDays: computedStreak,
        });

      } catch (error) {
        console.error("Failed to load dashboard summary", error);
      }
    };
    
    fetchDashboardSummary();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      
      {/* Hero Welcome Unit */}
      <div className="google-card bg-[#fff] p-8 md:p-10 border border-[#dadce0] flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#202124] tracking-tight">
            Welcome back, <span className="text-[#1a73e8]">{user?.name?.split(' ')[0] || 'User'}</span>! 👋
          </h1>
          <p className="text-[#5f6368] text-lg">Here's your productivity summary for today.</p>
        </div>
        <div className="hidden md:flex space-x-2 mt-4 md:mt-0">
          <Link to="/todo" className="btn-primary flex items-center">
            <CheckSquare size={18} className="mr-2" /> Start Task
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Work Card */}
        <Link to="/work" className="google-card overflow-hidden group">
          <div className="bg-gradient-google p-6 h-full text-white flex flex-col transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Clock size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold opacity-90">Deep Work</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-bold">{summary.workHours}</p>
              <span className="text-sm opacity-80">hrs today</span>
            </div>
            <div className="mt-6 flex items-center text-sm font-medium opacity-90 group-hover:opacity-100 transition whitespace-nowrap">
              Start Timer <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        </Link>

        {/* Streak Card */}
        <Link to="/streak" className="google-card overflow-hidden group border border-[#dadce0] hover:border-[#6b21a8]">
          <div className="bg-[#6b21a8] p-6 h-full text-white flex flex-col transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Shield size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold opacity-90">Commitment Streak</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-bold">{summary.streakDays}</p>
              <span className="text-sm opacity-80">days</span>
            </div>
            {(user?.shields > 0) && (
              <div className="mt-2 flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full w-fit">
                <Shield size={12} className="text-[#fde047]" fill="currentColor" />
                <span className="text-xs font-semibold text-[#fde047]">{user.shields} Active {user.shields === 1 ? 'Shield' : 'Shields'}</span>
              </div>
            )}
            <div className="mt-6 flex items-center text-sm font-medium opacity-90 group-hover:opacity-100 transition whitespace-nowrap">
              Check Status <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        </Link>

        {/* Todo Card */}
        <Link to="/todo" className="google-card overflow-hidden group border border-[#dadce0] hover:border-[#1a73e8]">
          <div className="bg-[#1a73e8] p-6 h-full text-white flex flex-col transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <CheckSquare size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold opacity-90">Today's Tasks</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-bold">{todayTasks.length}</p>
              <span className="text-sm opacity-80">pending</span>
            </div>
            <div className="mt-6 flex items-center text-sm font-medium opacity-90 group-hover:opacity-100 transition whitespace-nowrap">
              View Tasks <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        </Link>

      </div>

      {/* Today's Tasks Widget */}
      <div className="google-card p-6 md:p-8 bg-white border border-[#dadce0]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#202124] flex items-center">
            <CheckSquare className="mr-3 text-[#1a73e8]" size={24} /> Today's Focus
          </h2>
          <Link to="/todo" className="text-sm font-bold text-[#1a73e8] hover:bg-[#f8f9fa] py-2 px-4 rounded-full transition">View To-Do List</Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-[#f8f9fa] rounded-2xl border border-dashed border-[#dadce0]">
            <CheckSquare className="text-[#dadce0] mb-3" size={48} />
            <p className="text-[#5f6368] font-medium">No pressing tasks today.</p>
            <Link to="/todo" className="text-[#1a73e8] font-semibold mt-2 hover:underline">Plan something new</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayTasks.map(task => (
               <div key={task._id} className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#dadce0] hover:border-[#1a73e8] transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-[#202124] leading-tight">{task.title}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                     <span className="text-sm font-medium text-[#5f6368]">{task.estimatedTime ? `${(task.estimatedTime / 60).toFixed(1).replace(/\.0$/, '')}h est` : ''}</span>
                     <Link to={`/work?taskId=${task._id}`} className="bg-white border border-[#dadce0] p-2 hover:bg-[#e8f0fe] hover:border-[#1a73e8] hover:text-[#1a73e8] rounded-full shadow-sm transition text-[#3c4043]" title="Work on Task">
                       <Play size={16} fill="currentColor" className="ml-0.5" />
                     </Link>
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
