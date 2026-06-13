import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Lock } from 'lucide-react';
import api from '../services/api';

const ChangePasswordModal = ({ isOpen, onClose, onLogout }) => {
  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (!window.confirm("Changing your password will log you out. Continue?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/users/password', {
        currentPassword: current,
        newPassword: newPassword
      });
      if (res.data.success) {
        toast.success('Password updated successfully');
        onLogout();
      } else {
        toast.error(res.data.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Lock className="mr-2 text-[#1a73e8]" size={24} /> Update Password
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:border-[#1a73e8] focus:ring-[#1a73e8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:border-[#1a73e8] focus:ring-[#1a73e8]"
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:border-[#1a73e8] focus:ring-[#1a73e8]"
              minLength={6}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
