import React from 'react';
import { BookOpen, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const PlaybookTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="text-teal-600 w-5 h-5" />
          Sales Training Playbook & Closing Framework
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Deep dive into Manuj Bajaj's proven high-ticket negotiation systems, psychological levers, and execution drills.
        </p>
      </div>

      {/* 6KLH Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded">
            CORE FOUNDATION
          </span>
          <h4 className="text-sm md:text-base font-bold text-white font-display">
            The 6KLH Methodology: How to Make Inaction Unaffordable
          </h4>
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          Indian B2B buyers delay because "status quo" feels free. The 6KLH framework forces them to confront that staying put is actively draining their cash.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <span className="text-emerald-400 text-xs font-bold block uppercase tracking-wider">
              1. Kab Kab? (When does it bleed?)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Identify every recurring moment inefficiency hits: shift changeovers, billing reconciliations, tax deadlines, or tender submissions.
            </p>
            <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
              "Har mahine ki 20 tarikh ko jab reconciliation mismatch hota hai…"
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <span className="text-emerald-400 text-xs font-bold block uppercase tracking-wider">
              2. Kahan Kahan? (Where is it leaking?)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Point out the exact department, ledger line, or operational bottleneck where capital or margin vanishes without a trace.
            </p>
            <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
              "Aapke inventory buffer me aur supplier double-billing me…"
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <span className="text-emerald-400 text-xs font-bold block uppercase tracking-wider">
              3. Kitna Kitna Loss Hoga? (Quantify hard cash)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Translate intangible delays into cold, undeniable Indian Rupees. Never say "you'll save time"—say "₹1.5 Lakh per month is vanishing".
            </p>
            <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
              "Salana ₹18 Lakh ka direct post-tax profit loss."
            </p>
          </div>
        </div>
      </div>

      {/* High-Ticket Closing Hacks */}
      <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-blue-700 w-5 h-5" />
          <h4 className="text-sm md:text-base font-bold text-blue-950 font-display">
            High-Ticket Closing Hacks (Hinglish & Indian Market Nuances)
          </h4>
        </div>

        <div className="space-y-3">
          {/* Hack 1 */}
          <div className="border bg-white border-blue-100 rounded-xl p-3.5 space-y-1 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-950 text-xs md:text-sm">
                1. The "Paisa-Vasool" 100% Risk Reversal
              </span>
              <span className="bg-yellow-100 text-yellow-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                High Conversion
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Offer a low-barrier trial milestone. Say:{" "}
              <em className="text-slate-800 font-semibold block mt-1 font-sans">
                "Lala ji, aap token money do bas ₹50,000. Hum set up karenge. Agar pehle 30 days me results me difference nahi dikha, toh humara settlement guarantee—kuch mat pay karo hum apna asset wapas le jayenge."
              </em>
            </p>
          </div>

          {/* Hack 2 */}
          <div className="border bg-white border-blue-100 rounded-xl p-3.5 space-y-1 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-950 text-xs md:text-sm">
                2. The "Section 43B(h)" Urgency Hook
              </span>
              <span className="bg-green-100 text-green-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans">
                Tax Angle
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              For B2B deals:{" "}
              <em className="text-slate-800 font-semibold block mt-1 font-sans">
                "Section 43B(h) ke mutabik agar aapki audit ho rahi hai toh MSME payment limits apply hoti hain. Hum early invoice block de rahe hain jisse aapka capital block na ho aur tax deduction time par claim ho sake."
              </em>
            </p>
          </div>

          {/* Hack 3 */}
          <div className="border bg-white border-blue-100 rounded-xl p-3.5 space-y-1 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-950 text-xs md:text-sm">
                3. The Lala-ji "Diwali Baad" Delay Counter
              </span>
              <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans font-semibold">
                Timing Closer
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              When they try to snooze:{" "}
              <em className="text-slate-800 font-semibold block mt-1 font-sans">
                "Aap decision Diwali baad lena sir, bilkul thik baat hai business me dhyan rehta hai. Par tab tak ₹3 Lakh ka raw material to air me ud chuka hoga. Agreement aaj sign karo, execution schedule next month pe locking radd de raha hoon. Rate sheet purani hi frozen rahegi!"
              </em>
            </p>
          </div>
        </div>
      </div>

      {/* Sales Prep & Drill Checklist */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
          <BookOpen className="text-teal-600 w-4 h-4" />
          Sales Preparation & Drill Checklist
        </h4>
        <p className="text-xs text-slate-500">
          Ask your sales team to quickly answer these 4 questions before walking into any client room:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-slate-700">
          <div className="bg-white p-3 rounded-lg border border-slate-100 flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Has the team researched client's current GST penalty rate or production yield losses?</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-100 flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Which Hinglish 6KLH "weapon" is pre-loaded for their likely first negotiation excuse?</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-100 flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Is the customized "Risk Reversal Option" ready inside the formal quote letter?</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-100 flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Are the physical references of 3 successful Indian clients or regional success stories printed/ready?</span>
          </div>
        </div>
      </div>
    </div>
  );
};
