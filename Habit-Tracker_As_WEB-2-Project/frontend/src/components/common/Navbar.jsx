import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

const Navbar = ({ setSidebarOpen }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="bg-white border-b border-[#dadce0] h-16 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      <button 
        onClick={() => setSidebarOpen(true)}
        className="text-[#5f6368] hover:bg-[#f1f3f4] p-2 rounded-full lg:hidden"
      >
        <Menu size={24} />
      </button>
      
      <div className="flex-1"></div>
      
      <div className="flex items-center space-x-4">
        <Link
          to="/notifications"
          className="relative text-[#5f6368] hover:bg-[#f1f3f4] p-2 rounded-full transition-colors"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#d93025] text-white text-[10px] font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link to="/profile" className="flex items-center space-x-3 cursor-pointer hover:bg-[#f1f3f4] p-1.5 rounded-full pr-4 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-google flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-medium text-[#3c4043] hidden sm:block">
            {user?.name || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
