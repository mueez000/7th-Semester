import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Plus, Trash2, Gift, Coins, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Shop = () => {
  const { gamification, refreshGamification } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newReward, setNewReward] = useState({
    title: '',
    cost: 100,
    icon: '🍕'
  });

  const availableIcons = ['🍕', '🎮', '🎬', '🛌', '🍩', '🛍️', '🎫', '🏝️', '📱', '🎧'];

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await api.get('/rewards');
      if (res.data.success) {
        setRewards(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/rewards', newReward);
      if (res.data.success) {
        setRewards([...rewards, res.data.data].sort((a, b) => a.cost - b.cost));
        setIsAdding(false);
        setNewReward({ title: '', cost: 100, icon: '🍕' });
        toast.success('Reward added to shop!');
      }
    } catch (error) {
      toast.error('Failed to create reward');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/rewards/${id}`);
      setRewards(rewards.filter(r => r._id !== id));
      toast.success('Reward deleted');
    } catch (error) {
      toast.error('Failed to delete reward');
    }
  };

  const handlePurchase = async (reward) => {
    const coins = gamification.coins !== undefined ? gamification.coins : gamification.xp;
    if (coins < reward.cost) {
      toast.error(`Not enough coins! You need ${reward.cost - coins} more.`);
      return;
    }

    if (window.confirm(`Are you sure you want to spend ${reward.cost} coins on "${reward.title}"?`)) {
      try {
        const res = await api.post(`/rewards/${reward._id}/purchase`);
        if (res.data.success) {
          toast.success(`Enjoy your ${reward.title}!`);
          await refreshGamification();
        }
      } catch (error) {
        toast.error('Failed to purchase reward');
      }
    }
  };

  const userCoins = gamification.coins !== undefined ? gamification.coins : gamification.xp;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header Unit */}
      <div className="google-card bg-gradient-to-br from-yellow-500 to-orange-500 p-8 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center drop-shadow-sm">
            <ShoppingBag className="mr-3" size={32} /> Reward Shop
          </h1>
          <p className="text-white/90 mt-2 text-lg">Spend your hard-earned coins on real-life rewards.</p>
        </div>
        
        <div className="mt-6 md:mt-0 relative z-10 bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/30 text-center shadow-lg">
          <p className="text-sm uppercase tracking-widest font-bold text-yellow-100 mb-1">Coin Balance</p>
          <div className="flex items-center justify-center text-4xl font-extrabold text-white">
            <Coins className="mr-2 text-yellow-300" size={32} />
            {userCoins.toLocaleString()}
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-xl"></div>
      </div>

      {/* Shop Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Gift className="mr-2 text-indigo-500" size={24} /> Available Rewards
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary flex items-center"
        >
          {isAdding ? 'Cancel' : <><Plus size={18} className="mr-2" /> New Reward</>}
        </button>
      </div>

      {/* Add Reward Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="google-card p-6 bg-white border border-indigo-100 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create a Custom Reward</h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <select 
                value={newReward.icon} 
                onChange={(e) => setNewReward({...newReward, icon: e.target.value})}
                className="w-full border-gray-300 rounded-md shadow-sm border p-2 text-2xl"
              >
                {availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              </select>
            </div>
            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward Title (e.g. 1 Episode of Anime)</label>
              <input 
                type="text" 
                required
                value={newReward.title} 
                onChange={(e) => setNewReward({...newReward, title: e.target.value})}
                placeholder="What will you treat yourself to?"
                className="w-full border-gray-300 rounded-md shadow-sm border p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (Coins)</label>
              <input 
                type="number" 
                required
                min="1"
                value={newReward.cost} 
                onChange={(e) => setNewReward({...newReward, cost: parseInt(e.target.value)})}
                className="w-full border-gray-300 rounded-md shadow-sm border p-2"
              />
            </div>
            <div className="md:col-span-2 pb-0.5">
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition">
                Save Reward
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Rewards Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
      ) : rewards.length === 0 ? (
        <div className="google-card p-12 text-center border-dashed border-2 border-gray-300 bg-gray-50">
          <Gift className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Your shop is empty</h3>
          <p className="text-gray-500 mb-4">Create rewards you want to buy with your hard-earned XP.</p>
          <button onClick={() => setIsAdding(true)} className="text-indigo-600 font-semibold hover:underline">Add your first reward</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map(reward => {
            const canAfford = userCoins >= reward.cost;
            return (
              <div key={reward._id} className="google-card bg-white p-6 relative group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                <button 
                  onClick={() => handleDelete(reward._id)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Reward"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-4xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  {reward.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{reward.title}</h3>
                
                <div className="flex items-center text-yellow-600 font-bold bg-yellow-50 inline-flex px-3 py-1 rounded-full text-sm mb-6 border border-yellow-200">
                  <Coins size={16} className="mr-1.5" /> {reward.cost.toLocaleString()} Coins
                </div>
                
                <button 
                  onClick={() => handlePurchase(reward)}
                  disabled={!canAfford}
                  className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center transition-all ${
                    canAfford 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  {canAfford ? (
                    <>Buy Now <CheckCircle size={16} className="ml-2" /></>
                  ) : (
                    <>Need {reward.cost - userCoins} more <AlertTriangle size={16} className="ml-2" /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Shop;
