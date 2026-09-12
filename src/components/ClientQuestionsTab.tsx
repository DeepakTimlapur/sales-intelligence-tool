import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { ClientQuestionCategory } from '../types';

interface ClientQuestionsTabProps {
  categories: ClientQuestionCategory[];
  showHints: boolean;
  setShowHints: (val: boolean) => void;
}

export const ClientQuestionsTab: React.FC<ClientQuestionsTabProps> = ({
  categories,
  showHints,
  setShowHints
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 block">
            High-Ticket Discovery Intelligence
          </h3>
          <p className="text-xs text-slate-500">
            Uncover what they are truly asking underneath the query, and address it with supreme trust vectors.
          </p>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-slate-50 max-w-max self-start sm:self-auto">
          <span className="text-xs text-slate-600 font-bold">Power answer hints:</span>
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center gap-1.5 focus:outline-none font-bold text-xs text-teal-700 hover:text-emerald-600 transition-colors cursor-pointer"
            id="questions-toggle-btn"
            type="button"
          >
            {showHints ? (
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
        {categories.map((categoryGroup, catIdx) => (
          <div
            key={catIdx}
            className="border border-slate-200 rounded-xl overflow-hidden p-5 space-y-4 shadow-xs bg-white"
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h4 className="text-sm md:text-base font-extrabold text-slate-900">
                {categoryGroup.category}
              </h4>
              <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-100">
                {categoryGroup.items.length} question{categoryGroup.items.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-6">
              {categoryGroup.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="pl-4 border-l-2 border-slate-200 space-y-2.5"
                >
                  <div className="flex items-start gap-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded block shrink-0 mt-0.5">
                      Question {itemIdx + 1}
                    </span>
                    <p className="text-sm md:text-base font-bold text-slate-900 italic">
                      "{item.question}"
                    </p>
                  </div>

                  {showHints ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="bg-[#E6F1FB] rounded-xl p-4 border border-[#BDE0F5]">
                        <span className="text-xs font-black tracking-wider text-[#185FA5] uppercase block mb-1">
                          🔍 Underlying Fear / Reason
                        </span>
                        <p className="text-xs md:text-sm text-[#185FA5] leading-relaxed font-semibold">
                          {item.why_they_ask}
                        </p>
                      </div>

                      <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                        <span className="text-xs font-black tracking-wider text-teal-800 uppercase block mb-1">
                          🛡️ Power Response Strategy
                        </span>
                        <p className="text-xs md:text-sm text-teal-950 leading-relaxed font-semibold">
                          {item.power_answer_hint}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Hints hidden. Turn "Power answer hints" ON or download full report to view.
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
