import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const DeleteAccountModal = ({ isOpen, onClose, onLogout }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.delete('/users/account', {
        data: { email, password }
      });
      if (res.data.success) {
        toast.success('Account deleted successfully');
        onLogout();
      } else {
        toast.error(res.data.error || 'Failed to delete account');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-red-600 flex items-center">
            <AlertTriangle className="mr-2" size={24} /> Delete Account
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm font-medium border border-red-100">
            This action cannot be undone. All your data will be permanently deleted.
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email for verification</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:border-red-500 focus:ring-red-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password for verification</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:border-red-500 focus:ring-red-500"
                placeholder="Enter your password"
              />
            </div>
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
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Yes, Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
