import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { ObjectionCategory } from '../types';

interface ObjectionsTabProps {
  objections: ObjectionCategory[];
  showRebuttals: boolean;
  setShowRebuttals: (val: boolean) => void;
}

export const ObjectionsTab: React.FC<ObjectionsTabProps> = ({
  objections,
  showRebuttals,
  setShowRebuttals
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 block">
            Stab & Twist Defense Protocols
          </h3>
          <p className="text-xs text-slate-500">
            Pre-loaded responses that stop the delay by making the pain undeniable and ROI urgent.
          </p>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-slate-50 max-w-max self-start sm:self-auto">
          <span className="text-xs text-slate-600 font-bold">Stab & Twist rebuttals:</span>
          <button
            onClick={() => setShowRebuttals(!showRebuttals)}
            className="flex items-center gap-1.5 focus:outline-none font-bold text-xs text-teal-700 hover:text-emerald-600 transition-colors cursor-pointer"
            id="objections-toggle-btn"
            type="button"
          >
            {showRebuttals ? (
              <>
                <span className="bg-teal-50 text-teal-800 py-0.5 px-2 rounded-md border border-teal-300">
                  ON
                </span>
                <ToggleRight className="w-6 h-6 text-teal-600" />
              </>
            ) : (
              <>
                <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-md">
                  OFF
                </span>
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {objections.map((categoryGroup, catIdx) => (
          <div
            key={catIdx}
            className="border border-slate-200 rounded-xl overflow-hidden p-5 space-y-4 shadow-xs bg-white"
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h4 className="text-sm md:text-base font-extrabold text-slate-900">
                {categoryGroup.category}
              </h4>
              <span className="bg-teal-50/70 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full border border-teal-100">
                {categoryGroup.items.length} objection{categoryGroup.items.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-6">
              {categoryGroup.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="pl-4 border-l-2 border-slate-200 space-y-3 pb-2"
                >
                  <div className="flex items-start gap-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded block shrink-0 mt-0.5">
                      Objection {itemIdx + 1}
                    </span>
                    <p className="text-sm md:text-base font-bold text-slate-950 italic">
                      "{item.objection}"
                    </p>
                  </div>

                  {showRebuttals ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Stab */}
                      <div className="bg-[#FCEBEB] border border-[#F2C7C7] rounded-xl p-4">
                        <span className="text-xs font-black tracking-wider text-[#791F1F] uppercase block mb-1">
                          🗡️ Conversational Stab — Active Bleeding Pain
                        </span>
                        <p className="text-xs md:text-sm text-[#791F1F] leading-relaxed font-semibold">
                          {item.stab}
                        </p>
                      </div>

                      {/* Twist */}
                      <div className="bg-[#EAF3DE] border border-[#D5E6BD] rounded-xl p-4">
                        <span className="text-xs font-black tracking-wider text-[#27500A] uppercase block mb-1">
                          🌪️ Conversational Twist — Pivot to Gains
                        </span>
                        <p className="text-xs md:text-sm text-[#27500A] leading-relaxed font-semibold">
                          {item.twist}
                        </p>
                      </div>

                      {/* 6KLH Breakdown */}
                      {item.six_klh_breakdown && (
                        <div className="col-span-1 md:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black tracking-wider text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded-md">
                              Manuj Bajaj's 6KLH Method
                            </span>
                            <span className="text-xs text-slate-500 italic">
                              "Kab Kab, Kahan Kahan, Kitna Kitna Loss Hoga"
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white rounded-lg p-2.5 border border-amber-100">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">
                                📅 Kab Kab (When?)
                              </span>
                              <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                                {item.six_klh_breakdown.kab_kab}
                              </span>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-amber-100">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">
                                📍 Kahan Kahan (Where?)
                              </span>
                              <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                                {item.six_klh_breakdown.kahan_kahan}
                              </span>
                            </div>
                            <div className="bg-white rounded-lg p-2.5 border border-amber-100">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">
                                💰 Kitna Kitna (Loss Cost?)
                              </span>
                              <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                                {item.six_klh_breakdown.kitna_kitna}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Closing Offer Pitch */}
                      {item.closing_offer_pitch && (
                        <div className="col-span-1 md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 mb-1 bg-blue-100 py-0.5 px-2 rounded-md max-w-max">
                            <span className="text-[10px] uppercase font-black text-blue-900">
                              🎯 Closing Offer / Deal Angle
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-blue-950 leading-relaxed font-medium italic">
                            "{item.closing_offer_pitch}"
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Rebuttals hidden. Turn "Stab & Twist" toggle ON or download full report to view.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
