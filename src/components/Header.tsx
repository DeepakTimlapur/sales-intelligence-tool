import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
      {/* Background glow accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/5 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-[#1D9E75] rounded-full blur-xs opacity-75 animate-pulse" />
            <img
              src="https://picsum.photos/seed/manuj_coach/300/300"
              alt="Manuj Bajaj"
              className="relative w-20 h-20 rounded-full object-cover border-2 border-slate-900 shadow-xl bg-slate-950"
              referrerPolicy="no-referrer"
              id="manuj-bajaj-photo-top"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 justify-center sm:justify-start flex-wrap">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded">
                PRO METHODOLOGY
              </span>
              <span className="text-emerald-300/80 text-xs font-semibold">
                Author of 26 books
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display">
              Sales Objections Handling Assistant{" "}
              <span className="text-emerald-400 block sm:inline">by Manuj Bajaj</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-semibold mt-1">
              Powered by Stab & Twist and 6KLH Methodologies
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-5 py-3.5 md:text-right shadow-inner">
          <span className="text-emerald-400 text-xs font-bold block mb-1 uppercase tracking-wider font-display">
            Coach Credentials
          </span>
          <div className="text-xs text-slate-300 space-y-1">
            <p className="flex items-center justify-center md:justify-end gap-1.5">
              <span>🏆</span> Amazon Bestselling Author
            </p>
            <p className="flex items-center justify-center md:justify-end gap-1.5">
              <span>👥</span> 10,000+ Business Owners Coached
            </p>
            <p className="flex items-center justify-center md:justify-end gap-1.5">
              <span>💼</span> 15+ Years Sales Mastery
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
        <div className="bg-slate-900/60 hover:bg-slate-900/80 transition-colors rounded-lg py-2 px-3 text-center border border-slate-800/50">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
            EXPERIENCE
          </span>
          <span className="text-xs font-extrabold text-white">10k+ Coached</span>
        </div>
        <div className="bg-slate-900/60 hover:bg-slate-900/80 transition-colors rounded-lg py-2 px-3 text-center border border-slate-800/50">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block font-display">
            METHODOLOGIES
          </span>
          <span className="text-xs font-extrabold text-white">Stab, Twist & 6KLH</span>
        </div>
        <div className="bg-slate-900/60 hover:bg-slate-900/80 transition-colors rounded-lg py-2 px-3 text-center border border-slate-800/50">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
            PUBLISHED
          </span>
          <span className="text-xs font-extrabold text-white">26 Books Authored</span>
        </div>
        <div className="bg-slate-900/60 hover:bg-slate-900/80 transition-colors rounded-lg py-2 px-3 text-center border border-slate-800/50">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">
            ACCUMULATION
          </span>
          <span className="text-xs font-extrabold text-white">Amazon Bestseller</span>
        </div>
      </div>
    </header>
  );
};
