import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Settings, Save, Lock, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import ChangePasswordModal from '../components/ChangePasswordModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

const Profile = () => {
  const { user, updateProfile, gamification, logout } = useAuth();
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    weight: user?.weight || '70',
    dob: user?.dob || '1995-01-01',
  });
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    const res = await updateProfile(formData);
    if (res.success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error(res.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <User className="text-gray-500 mr-2" size={28} />
          Profile Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - General Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-3">
              <Settings size={20} className="mr-2 text-indigo-500" /> Personal Information
            </h2>
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address (Read Only)</label>
                  <input type="email" readOnly value={user?.email || 'user@example.com'} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-500 shadow-sm border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  <Save size={16} className="mr-2" /> Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-start gap-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center w-full border-b pb-3">
              <Lock size={20} className="mr-2 text-indigo-500" /> Account Security
            </h2>
            <p className="text-sm text-gray-600 mb-2">Update your password or permanently delete your account.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Update Password
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
              >
                Delete Account
              </button>

            </div>
          </div>
        </div>

        {/* Right Column - User specific small widgets */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`p-8 text-center relative transition-all duration-500 ${
              gamification.level >= 21 ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900' :
              gamification.level >= 11 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
              gamification.level >= 6 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
              'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              <div className={`w-28 h-28 mx-auto rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold mb-4 backdrop-blur-sm border-4 transition-all duration-500 shadow-xl ${
                gamification.level >= 21 ? 'border-blue-300 animate-pulse shadow-blue-500/50' :
                gamification.level >= 11 ? 'border-yellow-200 shadow-yellow-500/50' :
                gamification.level >= 6 ? 'border-slate-200 shadow-slate-500/50' :
                'border-white/30'
              }`}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <h3 className="text-2xl font-bold text-white drop-shadow-sm">{user?.name || 'User'}</h3>
              <p className="text-white/80 text-sm mt-1">Level {gamification.level} {gamification.title || 'Pioneer'}</p>
              
              <div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/20 pt-6 text-white text-center">
                <div>
                  <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Total XP</p>
                  <p className="text-xl font-extrabold">{gamification.xp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold">Shields</p>
                  <p className="text-xl text-green-300 font-extrabold">{user?.shields || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">To Next Lvl</p>
                  <p className="text-xl font-extrabold">{gamification.xp_to_next_level - gamification.xp}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white">
               <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  <span>Level {gamification.level}</span>
                  <span>{Math.floor((gamification.xp / gamification.xp_to_next_level) * 100)}%</span>
               </div>
               <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1a73e8] rounded-full transition-all duration-1000"
                    style={{ width: `${(gamification.xp / gamification.xp_to_next_level) * 100}%` }}
                  />
               </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
               <Trophy size={20} className="mr-2 text-yellow-500" /> Achievements
             </h2>
             {gamification.badges && gamification.badges.length > 0 ? (
               <div className="grid grid-cols-3 gap-3">
                  {gamification.badges.map((badge, idx) => (
                    <div key={idx} className="group relative flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-help shadow-sm hover:shadow-md">
                        {badge.icon || '🏅'}
                      </div>
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 w-32 p-2 bg-gray-900 text-white text-[10px] rounded-lg text-center shadow-xl">
                        <p className="font-bold">{badge.name}</p>
                        <p className="text-gray-400 mt-1">{badge.description}</p>
                      </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 px-4">Complete habits to earn your first badges!</p>
               </div>
             )}
          </div>
        </div>
      </div>
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        onLogout={logout}
      />
      
      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onLogout={logout}
      />
    </div>
  );
};

export default Profile;
