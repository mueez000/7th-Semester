import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowDown, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const LevelDownModal = ({ level, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 10, spread: 180, ticks: 100, zIndex: 9999, gravity: 3, colors: ['#ef4444', '#b91c1c', '#7f1d1d'] };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        // Fire from top, mimicking falling rain/drops
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.9), y: -0.1 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, level]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full text-center relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-10 flex flex-col items-center">
              <motion.div
                initial={{ rotate: 180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border-2 border-white/50 shadow-lg"
              >
                <ArrowDown size={48} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Level Down</h2>
            </div>

            <div className="p-8 space-y-4">
              <p className="text-gray-600 font-medium">Consistency is key! You lost some XP.</p>
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="text-red-500" size={20} />
                <span className="text-5xl font-black text-gray-900 tracking-tighter">LEVEL {level}</span>
                <AlertTriangle className="text-red-500" size={20} />
              </div>
              <p className="text-xs text-gray-400">Don't give up! Keep logging your positive habits to climb back up and reclaim your rewards.</p>
              
              <button
                onClick={onClose}
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6"
              >
                I Will Do Better!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LevelDownModal;
