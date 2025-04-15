import { useEffect, useState } from 'preact/hooks';
import { motion, AnimatePresence } from 'framer-motion';

export default function LetterCard({ letter, animateOut }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (animateOut) {
      setTimeout(() => setHidden(true), 500);
    }
  }, [animateOut]);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={animateOut ? { scale: 0.5, opacity: 0, x: 100, y: 100 } : {}}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[100px] h-[140px] rounded-lg border-[4px] 
          border-blue-600 shadow-xl 
          flex items-center justify-center text-6xl font-bold text-white card-style select-none"
        >
          {letter}
        </motion.div>
      )}
    </AnimatePresence>
  );
}