import React from 'react';

export const CalculatorTab: React.FC = () => {
  return (
    <div className="space-y-6 py-12 text-center max-w-xl mx-auto flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shadow-xs mb-4">
        📊
      </div>
      <span className="text-[10px] bg-amber-100 text-amber-800 font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-xs border border-amber-200">
        🔒 Coming soon - shortly
      </span>
      <h3 className="text-xl font-bold font-display text-slate-900 mt-4">
        Inaction Cost Ledger & Calculators
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
        This calculation engine and diagnostic slider tool is currently undergoing alignment. The standard modeling matrices of the 5-10 year cumulative ledger will be activated shortly.
      </p>
    </div>
  );
};
