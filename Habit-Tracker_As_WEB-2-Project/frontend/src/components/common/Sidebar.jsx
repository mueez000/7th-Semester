import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { 
  LayoutDashboard, 
  Clock,
  Activity, 
  BarChart2, 
  User, 
  LogOut,
  Moon,
  CheckSquare,
  X,
  Bell,
  Smartphone,
  Shield,
  BookOpen,
  ShoppingBag,
  Target
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'To-Do', path: '/todo', icon: CheckSquare },
    { name: 'Namaz', path: '/namaz', icon: Moon },
    { name: 'Exercise', path: '/exercise', icon: Activity },
    { name: 'Reading', path: '/reading', icon: BookOpen },
    { name: 'Work Timer', path: '/work', icon: Clock },
    { name: 'Social Media', path: '/social', icon: Smartphone },
    { name: 'Streak', path: '/streak', icon: Shield },
    
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed z-30 inset-y-0 left-0 w-68 bg-white border-r border-[#dadce0] transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 pt-2">
          <span className="text-2xl font-bold tracking-tight text-[#1a73e8]">HabitFlow</span>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-[#5f6368] p-2 hover:bg-[#f1f3f4] rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex flex-col h-[calc(100vh-4rem)] justify-between px-4 py-6">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.badge > 0;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center px-4 py-3 min-w-0 text-[14px] font-medium rounded-r-full transition-all duration-200 w-[95%]",
                    isActive 
                      ? "bg-[#e8f0fe] text-[#1967d2]" 
                      : "text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#202124]"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'w-[22px] h-[22px] mr-4 shrink-0',
                          isActive ? 'text-[#1967d2]' : 'text-[#5f6368]'
                        )}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {showBadge && (
                        <span className="ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#d93025] text-white text-[11px] font-bold">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
          
          <div className="border-t border-[#dadce0] mt-4 pt-4 px-2 w-[95%]">
            <button 
              onClick={logout}
              className="flex items-center px-4 py-3 text-[14px] font-medium text-[#d93025] rounded-r-full hover:bg-[#fce8e6] transition-colors w-full"
            >
              <LogOut className="w-[22px] h-[22px] mr-4 text-[#d93025]" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
