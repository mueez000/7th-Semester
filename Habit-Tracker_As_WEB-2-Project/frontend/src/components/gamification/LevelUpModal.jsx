import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, X } from 'lucide-react';

const LevelUpModal = ({ level, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, level]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full text-center relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-10 flex flex-col items-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border-2 border-white/50 shadow-lg"
              >
                <Trophy size={48} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Level Up!</h2>
            </div>

            <div className="p-8 space-y-4">
              <p className="text-gray-600 font-medium">You've reached a new milestone.</p>
              <div className="flex items-center justify-center space-x-2">
                <Star className="text-yellow-400 fill-yellow-400" size={20} />
                <span className="text-5xl font-black text-gray-900 tracking-tighter">LEVEL {level}</span>
                <Star className="text-yellow-400 fill-yellow-400" size={20} />
              </div>
              <p className="text-xs text-gray-400">Keep up the amazing work! New rewards and borders are waiting as you climb higher.</p>
              
              <button
                onClick={onClose}
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6"
              >
                Continue Your Journey
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpModal;
