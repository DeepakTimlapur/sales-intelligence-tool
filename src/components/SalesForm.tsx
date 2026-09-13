import React from 'react';
import { Briefcase, Target, AlignLeft, ArrowRight, Sparkles, Coins, AlertTriangle, ShieldAlert } from 'lucide-react';
import { BUSINESS_MODELS, DEAL_SIZES, BUYER_PROFILES, REPORT_TOKEN_COST } from '../data/constants';
import { useAuth } from '../context/AuthContext';

interface SalesFormProps {
  product: string;
  setProduct: (val: string) => void;
  targetIndustry: string;
  setTargetIndustry: (val: string) => void;
  businessModels: string[];
  setBusinessModels: React.Dispatch<React.SetStateAction<string[]>>;
  dealSize: string;
  setDealSize: (val: string) => void;
  buyerProfiles: string[];
  setBuyerProfiles: React.Dispatch<React.SetStateAction<string[]>>;
  additionalContext: string;
  setAdditionalContext: (val: string) => void;
  hasValidationAttempted: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({
  product,
  setProduct,
  targetIndustry,
  setTargetIndustry,
  businessModels,
  setBusinessModels,
  dealSize,
  setDealSize,
  buyerProfiles,
  setBuyerProfiles,
  additionalContext,
  setAdditionalContext,
  hasValidationAttempted,
  onSubmit
}) => {
  const toggleModel = (model: string) => {
    setBusinessModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const toggleBuyerProfile = (buyer: string) => {
    setBuyerProfiles(prev =>
      prev.includes(buyer) ? prev.filter(b => b !== buyer) : [...prev, buyer]
    );
  };

  const { profile } = useAuth();
  const tokenBalance = profile?.tokenBalance ?? 0;
  const isInsufficient = tokenBalance < REPORT_TOKEN_COST;

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-teal-500 w-5 h-5 animate-pulse" />
          Define Your High-Ticket Sales Situation
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Fill in your offer profile. We will construct bespoke objection defenses and pinpoint exact buyer motivations.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Field: Product */}
        <div id="field-product">
          <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-teal-600" />
            What are you selling? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={product}
            onChange={e => setProduct(e.target.value)}
            placeholder="e.g. ERP software, industrial lubricants, premium coaching program, franchise opportunity…"
            className={`w-full bg-slate-50 border ${
              hasValidationAttempted && !product.trim()
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 focus:ring-teal-600"
            } focus:border-teal-600 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-1 transition-all text-sm`}
            id="input-product"
          />
          {hasValidationAttempted && !product.trim() && (
            <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
              ⚠️ Please specify your product or service.
            </p>
          )}
        </div>

        {/* Field: Target Industry */}
        <div id="field-industry">
          <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-teal-600" />
            Target industry <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={targetIndustry}
            onChange={e => setTargetIndustry(e.target.value)}
            placeholder="e.g. Manufacturing, Retail chains, Healthcare, IT services, F&B, Education…"
            className={`w-full bg-slate-50 border ${
              hasValidationAttempted && !targetIndustry.trim()
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 focus:ring-teal-600"
            } focus:border-teal-600 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-1 transition-all text-sm`}
            id="input-industry"
          />
          {hasValidationAttempted && !targetIndustry.trim() && (
            <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
              ⚠️ Please specify the target industry.
            </p>
          )}
        </div>

        {/* Field: Business Model */}
        <div id="field-business-model" className="space-y-2">
          <label className="block text-sm font-bold text-slate-800">
            Business model (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_MODELS.map(model => {
              const isSelected = businessModels.includes(model);
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleModel(model)}
                  className={`text-xs px-3 py-2 rounded-full font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-teal-50 border-teal-500 text-teal-950 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  id={`model-pill-${model.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  {model}
                  {isSelected && <span className="ml-1 text-teal-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field: Deal Size */}
        <div id="field-deal-size" className="space-y-2">
          <label className="block text-sm font-bold text-slate-800">
            Approximate deal / ticket size
          </label>
          <div className="flex flex-wrap gap-2">
            {DEAL_SIZES.map(size => {
              const isSelected = dealSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDealSize(isSelected ? "" : size)}
                  className={`text-xs px-3 py-2 rounded-full font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-teal-50 border-teal-500 text-teal-950 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  id={`deal-pill-${size.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`}
                >
                  {size}
                  {isSelected && <span className="ml-1 text-teal-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field: Buyer Profile */}
        <div id="field-buyer-profile" className="space-y-2">
          <label className="block text-sm font-bold text-slate-800">
            Who is the buyer?
          </label>
          <div className="flex flex-wrap gap-2">
            {BUYER_PROFILES.map(buyer => {
              const isSelected = buyerProfiles.includes(buyer);
              return (
                <button
                  key={buyer}
                  type="button"
                  onClick={() => toggleBuyerProfile(buyer)}
                  className={`text-xs px-3 py-2 rounded-full font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-teal-50 border-teal-500 text-teal-950 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  id={`buyer-pill-${buyer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  {buyer}
                  {isSelected && <span className="ml-1 text-teal-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field: Additional Context */}
        <div id="field-additional-context">
          <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <AlignLeft className="w-4 h-4 text-teal-600" />
            Any additional context (optional)
          </label>
          <textarea
            rows={3}
            value={additionalContext}
            onChange={e => setAdditionalContext(e.target.value)}
            placeholder="e.g. We are 20% more expensive than the competition, we are a new market entrant, we sell via channel partners…"
            className="w-full bg-slate-50 border border-slate-300 focus:ring-teal-600 focus:border-teal-600 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-1 transition-all text-sm"
            id="textarea-context"
          />
        </div>

        {/* Submit Button & Token Tariff Indicator */}
        <div className="pt-2 space-y-3">
          {isInsufficient && (
            <div
              className="p-3.5 bg-amber-500/10 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900"
              id="form-insufficient-tokens-warning"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                <strong className="font-bold text-amber-950 block text-xs">
                  Insufficient tokens. Please upgrade your plan or purchase more tokens.
                </strong>
                Generating an AI Sales Intelligence Report requires {REPORT_TOKEN_COST} tokens. You currently have {tokenBalance.toLocaleString()} tokens.
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isInsufficient}
              className={`flex-1 w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 font-black transition-all shadow-md ${
                isInsufficient
                  ? 'bg-slate-300 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-slate-900 hover:bg-slate-950 border border-slate-800 text-white active:scale-[0.99] cursor-pointer group'
              }`}
              id="btn-submit-generate"
            >
              <span>Generate Sales Intelligence Report</span>
              <ArrowRight className={`w-5 h-5 transition-transform ${isInsufficient ? 'text-slate-400' : 'text-emerald-400 group-hover:translate-x-1'}`} />
            </button>

            {/* Token Usage Indicator */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 shadow-2xs"
              id="indicator-token-cost"
              title="Token cost per generated report"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{REPORT_TOKEN_COST} tokens per report</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
