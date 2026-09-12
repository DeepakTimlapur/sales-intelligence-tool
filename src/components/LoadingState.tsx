import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { COACH_NOTES } from '../data/constants';

interface LoadingStateProps {
  currentStep: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ currentStep }) => {
  const activeNote = COACH_NOTES[currentStep % COACH_NOTES.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 text-center min-h-[450px] flex flex-col justify-center items-center"
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-teal-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-teal-600 w-6 h-6 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-2">
        Drafting Stab & Twist Framework...
      </h3>

      <div className="w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden mb-8">
        <motion.div
          className="bg-teal-500 h-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-w-xl text-left shadow-xs"
        >
          <span className="text-xs uppercase tracking-widest font-extrabold text-teal-700 block mb-1">
            Coach Strategy Note: {activeNote.title}
          </span>
          <p className="text-slate-700 italic text-sm md:text-base leading-relaxed">
            "{activeNote.quote}"
          </p>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-slate-400 mt-8">
        Typically takes 8-15 seconds to formulate the 5 distinct categories, calculations, and answers.
      </p>
    </motion.div>
  );
};
