import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

const XPProgress = ({ level, currentXP, xpToNext }) => {
  const progressPercent = Math.min(100, Math.floor((currentXP / xpToNext) * 100));

  return (
    <div className="mt-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-google-blue rounded-lg shadow-sm">
            <Award size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-700">Level {level}</span>
        </div>
        <span className="text-xs font-semibold text-google-blue bg-blue-50 px-2 py-0.5 rounded-full">
          {currentXP} / {xpToNext} XP
        </span>
      </div>
      
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[#1a73e8] to-[#4285f4] rounded-full shadow-[0_0_10px_rgba(26,115,232,0.3)]"
        />
      </div>
      
      <p className="text-[10px] text-gray-400 mt-1.5 font-medium tracking-tight">
        {xpToNext - currentXP} XP more to reach Level {level + 1}
      </p>
    </div>
  );
};

export default XPProgress;
