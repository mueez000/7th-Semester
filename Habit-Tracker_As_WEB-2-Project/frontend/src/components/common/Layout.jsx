import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import LevelUpModal from '../gamification/LevelUpModal';
import LevelDownModal from '../gamification/LevelDownModal';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import TodoNotificationManager from './TodoNotificationManager';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { levelQueue, closeGamificationModal } = useAuth();
  const currentModal = levelQueue && levelQueue.length > 0 ? levelQueue[0] : null;

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-full overflow-hidden relative">
        <Navbar setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <Outlet />
        </main>

        <div className="relative z-[9999]">
        <LevelUpModal 
          level={currentModal?.level} 
          isOpen={currentModal?.type === 'up'} 
          onClose={closeGamificationModal} 
        />
        <LevelDownModal
          level={currentModal?.level}
          isOpen={currentModal?.type === 'down'}
          onClose={closeGamificationModal}
        />
      </div>  <TodoNotificationManager />
      </div>
    </div>
  );
};

export default Layout;
