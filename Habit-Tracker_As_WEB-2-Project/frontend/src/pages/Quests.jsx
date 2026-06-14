import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Trophy, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Quests = () => {
  const { gamification, refreshGamification } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await api.get('/quests');
      if (res.data.success) {
        setQuests(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (quest) => {
    try {
      const res = await api.post(`/quests/${quest._id}/claim`);
      if (res.data.success) {
        toast.success(`You claimed ${quest.xpReward} XP & Coins! 🎉`);
        setQuests(quests.map(q => q._id === quest._id ? { ...q, isClaimed: true } : q));
        await refreshGamification();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to claim reward');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div className="google-card bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center shadow-lg">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center drop-shadow-sm">
            <Target className="mr-3" size={32} /> Active Quests
          </h1>
          <p className="text-white/90 mt-2 text-lg">Complete challenges to earn massive XP bonuses.</p>
        </div>
        
        <div className="mt-6 md:mt-0 relative z-10 bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/30 text-center">
          <p className="text-sm uppercase tracking-widest font-bold text-blue-200 mb-1">Total XP</p>
          <div className="flex items-center justify-center text-4xl font-extrabold text-white">
            {gamification.xp.toLocaleString()}
          </div>
        </div>

        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
      ) : quests.length === 0 ? (
        <div className="google-card p-12 text-center border-dashed border-2 border-gray-300 bg-gray-50">
          <Target className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No active quests</h3>
          <p className="text-gray-500">Check back later for new challenges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map(quest => {
            if (quest.isClaimed) return null;
            
            const progressPct = Math.min(100, Math.round((quest.currentProgress / quest.target) * 100));
            const isCompleted = quest.isCompleted;
            
            const daysLeft = Math.ceil((new Date(quest.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

            return (
              <div key={quest._id} className={`google-card p-6 relative overflow-hidden transition-all duration-300 ${isCompleted ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-md scale-[1.02]' : 'bg-white hover:shadow-lg'}`}>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">
                    {quest.icon}
                  </div>
                  {!isCompleted && (
                    <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      <Clock size={12} className="mr-1" /> {daysLeft}d left
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-1">{quest.title}</h3>
                <p className="text-sm text-gray-500 mb-6 h-10 line-clamp-2">{quest.description}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className={isCompleted ? 'text-indigo-600' : 'text-gray-500'}>
                      {quest.currentProgress} / {quest.target}
                    </span>
                    <span className={isCompleted ? 'text-indigo-600' : 'text-gray-500'}>{progressPct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-indigo-500' : 'bg-blue-500'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {isCompleted ? (
                  <button 
                    onClick={() => handleClaim(quest)}
                    className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center group animate-pulse hover:animate-none"
                  >
                    Claim {quest.xpReward} XP <Trophy size={18} className="ml-2 group-hover:scale-125 transition-transform" />
                  </button>
                ) : (
                  <div className="w-full py-3 bg-gray-50 border border-gray-100 text-gray-500 font-bold rounded-xl text-center flex justify-center items-center text-sm">
                    Reward: {quest.xpReward} XP & Coins
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Quests;
