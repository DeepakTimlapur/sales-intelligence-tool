import React from 'react';
import { ShieldAlert, Sparkles, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { PlanConfig } from '../data/plans';

interface PaymentPlaceholderModalProps {
  plan: PlanConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentPlaceholderModal: React.FC<PaymentPlaceholderModalProps> = ({
  plan,
  isOpen,
  onClose
}) => {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden"
        id="payment-placeholder-modal"
      >
        {/* Decorative ambient accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          id="btn-close-payment-modal"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
              Phase 2C Pipeline
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Payment Gateway Integration Coming Next
            </h3>
          </div>
        </div>

        {/* Informative Explanation */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          You selected the <strong className="text-teal-300 font-semibold">{plan.name}</strong> ({plan.priceFormatted} {plan.billingPeriod}). In accordance with strict SaaS security standards, our real payment gateway (Stripe / Razorpay) will be enabled in Phase 2C.
        </p>

        {/* Security Notice Card */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">No False Activation: </span>
              Your account has not been falsely upgraded and no financial charges were made.
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Vaulted Allocation: </span>
              Upon payment gateway enablement, this tier will instantly provision <strong className="text-emerald-300">{plan.tokenAllocationFormatted}</strong> and activate automated audit ledgers.
            </div>
          </div>
        </div>

        {/* Plan Breakdown Summary */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Selected Plan</div>
            <div className="text-sm font-bold text-white">{plan.name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Rate</div>
            <div className="text-sm font-bold text-teal-400">
              {plan.priceFormatted} <span className="text-xs font-normal text-slate-400">{plan.billingPeriod}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2"
          id="btn-dismiss-payment-placeholder"
        >
          <span>Understood — Continue with Available Tokens</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
