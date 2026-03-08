import React from 'react';
import { motion } from 'framer-motion';

const VennDiagram = ({ score, theme = 'light' }) => {
  // Overlap percentage (0-100)
  const percentage = parseFloat(score);
  const isDark = theme === 'dark';
  
  // Calculate offset based on overlap
  // 0% overlap -> offset 50% (circles touching edges)
  // 100% overlap -> offset 0% (circles on top of each other)
  // We want visual separation.
  // Let's say max separation is 60px.
  
  // A simplistic visual representation:
  // We move the circles closer as percentage increases.
  const offset = 60 * (1 - (percentage / 100));

  return (
    <div className="relative h-56 md:h-64 w-full flex items-center justify-center my-4">
      {/* Circle A */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: -offset, opacity: 0.8 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`absolute w-28 h-28 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm
          ${isDark ? 'bg-lime/20 border-2 border-lime/30 text-lime' : 'bg-forest/80 mix-blend-multiply border-4 border-white text-white/50'}
        `}
      >
        <span className={`font-bold text-[10px] md:text-xs uppercase tracking-widest text-center px-2 ${isDark ? 'text-lime/60' : ''}`}>First ETF</span>
      </motion.div>

      {/* Circle B */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: offset, opacity: 0.8 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`absolute w-28 h-28 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm
          ${isDark ? 'bg-white/10 border-2 border-white/20 text-white' : 'bg-lime/80 mix-blend-multiply border-4 border-white text-forest/50'}
        `}
      >
        <span className={`font-bold text-[10px] md:text-xs uppercase tracking-widest text-center px-2 ${isDark ? 'text-white/60' : ''}`}>Second ETF</span>
      </motion.div>

      {/* Result Label */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        className={`z-10 shadow-2xl rounded-2xl px-6 py-4 flex flex-col items-center backdrop-blur-md
          ${isDark ? 'bg-forest/90 border border-white/10 text-white' : 'bg-white border border-forest/5 text-forest'}
        `}
      >
        <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-forest/40'}`}>Overlap Score</span>
        <span className="text-4xl font-black tracking-tighter">{score}%</span>
      </motion.div>
    </div>
  );
};

export default VennDiagram;
