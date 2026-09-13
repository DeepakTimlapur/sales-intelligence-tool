import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface PresetOption {
  name: string;
  monthlyRevenue: number;
  leadsPerMonth: number;
  avgDealValue: number;
  currentConversionRate: number;
  targetConversionRate: number;
  delayMonths: number;
}

const PRESETS: PresetOption[] = [
  {
    name: 'MSME B2B / Industrial',
    monthlyRevenue: 1500000,
    leadsPerMonth: 40,
    avgDealValue: 150000,
    currentConversionRate: 8,
    targetConversionRate: 15,
    delayMonths: 6
  },
  {
    name: 'High-Ticket SaaS / Agency',
    monthlyRevenue: 2500000,
    leadsPerMonth: 50,
    avgDealValue: 250000,
    currentConversionRate: 10,
    targetConversionRate: 18,
    delayMonths: 3
  },
  {
    name: 'Enterprise Advisory / Consulting',
    monthlyRevenue: 5000000,
    leadsPerMonth: 20,
    avgDealValue: 1000000,
    currentConversionRate: 15,
    targetConversionRate: 25,
    delayMonths: 6
  }
];

function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const rounded = Math.round(amount);
  return '₹' + rounded.toLocaleString('en-IN');
}

function formatINRLakhCrore(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return `₹${cr} Cr`;
  }
  if (abs >= 100000) {
    const lakh = (amount / 100000).toFixed(2);
    return `₹${lakh} Lakh`;
  }
  return formatINR(amount);
}

export const CalculatorTab: React.FC = () => {
  // State for user inputs
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(1500000);
  const [leadsPerMonth, setLeadsPerMonth] = useState<number>(40);
  const [avgDealValue, setAvgDealValue] = useState<number>(150000);
  const [currentConversionRate, setCurrentConversionRate] = useState<number>(10);
  const [targetConversionRate, setTargetConversionRate] = useState<number>(18);
  const [delayMonths, setDelayMonths] = useState<number>(6);
  const [manualLostDeals, setManualLostDeals] = useState<string>(''); // empty string means auto-calculated
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-calculated closed & lost deals
  const calculatedClosedDeals = useMemo(() => {
    return Math.max(0, Math.round(leadsPerMonth * (currentConversionRate / 100)));
  }, [leadsPerMonth, currentConversionRate]);

  const autoLostDeals = useMemo(() => {
    return Math.max(0, leadsPerMonth - calculatedClosedDeals);
  }, [leadsPerMonth, calculatedClosedDeals]);

  const effectiveLostDeals = useMemo(() => {
    if (manualLostDeals !== '' && !isNaN(Number(manualLostDeals))) {
      return Math.max(0, Number(manualLostDeals));
    }
    return autoLostDeals;
  }, [manualLostDeals, autoLostDeals]);

  // Calculations
  const calculations = useMemo(() => {
    // 1. Estimated monthly revenue leakage
    const monthlyLeakage = effectiveLostDeals * avgDealValue;

    // 2. Estimated annual revenue leakage
    const annualLeakage = monthlyLeakage * 12;

    // 3. Estimated cost of inaction for the selected period
    const costOfInaction = monthlyLeakage * delayMonths;

    // 4. Potential recovered revenue with improved conversion rate
    const conversionUplift = Math.max(0, targetConversionRate - currentConversionRate);
    const additionalDealsPerMonth = (leadsPerMonth * conversionUplift) / 100;
    const monthlyRecoveredRevenue = additionalDealsPerMonth * avgDealValue;
    const periodRecoveredRevenue = monthlyRecoveredRevenue * delayMonths;
    const annualRecoveredRevenue = monthlyRecoveredRevenue * 12;

    // 5. Current vs Improved performance
    const currentClosedRevenue = calculatedClosedDeals * avgDealValue;
    const improvedClosedDeals = calculatedClosedDeals + additionalDealsPerMonth;
    const improvedClosedRevenue = improvedClosedDeals * avgDealValue;
    const netMonthlyGain = improvedClosedRevenue - currentClosedRevenue;
    const netAnnualGain = netMonthlyGain * 12;
    const percentageUplift = currentClosedRevenue > 0
      ? (netMonthlyGain / currentClosedRevenue) * 100
      : 0;

    return {
      monthlyLeakage,
      annualLeakage,
      costOfInaction,
      conversionUplift,
      additionalDealsPerMonth,
      monthlyRecoveredRevenue,
      periodRecoveredRevenue,
      annualRecoveredRevenue,
      currentClosedRevenue,
      improvedClosedDeals,
      improvedClosedRevenue,
      netMonthlyGain,
      netAnnualGain,
      percentageUplift
    };
  }, [
    effectiveLostDeals,
    avgDealValue,
    delayMonths,
    leadsPerMonth,
    currentConversionRate,
    targetConversionRate,
    calculatedClosedDeals
  ]);

  const handleApplyPreset = (preset: PresetOption) => {
    setMonthlyRevenue(preset.monthlyRevenue);
    setLeadsPerMonth(preset.leadsPerMonth);
    setAvgDealValue(preset.avgDealValue);
    setCurrentConversionRate(preset.currentConversionRate);
    setTargetConversionRate(preset.targetConversionRate);
    setDelayMonths(preset.delayMonths);
    setManualLostDeals('');
  };

  const handleReset = () => {
    handleApplyPreset(PRESETS[0]);
  };

  const handleCopyPitch = () => {
    const pitchText = `*Cost of Inaction & Revenue Leakage Diagnostic (Manuj Bajaj 6KLH Model)*

📊 *Current Sales Baseline:*
• Monthly Leads: ${leadsPerMonth}
• Average Deal Size: ${formatINR(avgDealValue)}
• Current Conversion: ${currentConversionRate}% (${calculatedClosedDeals} deals closed/mo)
• Missed / Lost Deals: ${effectiveLostDeals} deals/mo

💣 *Estimated Financial Leakage:*
• Monthly Revenue Leakage: ${formatINR(calculations.monthlyLeakage)} (${formatINRLakhCrore(calculations.monthlyLeakage)})
• Annual Revenue Bleed: ${formatINR(calculations.annualLeakage)} (${formatINRLakhCrore(calculations.annualLeakage)})
• Cost of ${delayMonths}-Month Inaction: ${formatINR(calculations.costOfInaction)} (${formatINRLakhCrore(calculations.costOfInaction)})

🚀 *Recovery at ${targetConversionRate}% Conversion (+${calculations.conversionUplift.toFixed(1)}% Uplift):*
• Extra Deals Closed: +${calculations.additionalDealsPerMonth.toFixed(1)} deals/mo
• Potential Recovered Revenue: ${formatINR(calculations.periodRecoveredRevenue)} over ${delayMonths} months
• Net Annual Top-Line Gain: +${formatINR(calculations.netAnnualGain)} (${formatINRLakhCrore(calculations.netAnnualGain)})

*Conclusion:* Delaying this decision by ${delayMonths} months costs approximately ${formatINR(calculations.costOfInaction)}. Overcoming status-quo objections today recovers hard cash immediately.`;

    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-4" id="inaction-cost-calculator">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-emerald-400">
                Decision Support Engine • 100% Client-Side • 0 Tokens
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white flex items-center gap-2.5">
              <Calculator className="w-7 h-7 text-emerald-400" />
              Inaction Cost & Revenue Leakage Calculator
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Quantify the exact rupee cost of prospect hesitation, delay tactics, and status-quo inertia.
              Use transparent formulas to show Indian decision-makers why waiting 3–6 months is their most expensive mistake.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Reset to standard defaults"
              id="calc-reset-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={handleCopyPitch}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Copy pitch summary to clipboard"
              id="calc-copy-pitch-btn"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Pitch Copied!' : 'Copy Pitch Script'}
            </button>
          </div>
        </div>

        {/* Quick Industry Presets */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Presets:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Inputs (Left) & Metrics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 space-y-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Sales & Pipeline Parameters
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter your prospect or business opportunity parameters.
            </p>
          </div>

          {/* 1. Monthly Revenue Baseline */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <label htmlFor="input-monthly-rev">Current Monthly Revenue</label>
              <span className="text-emerald-700 font-mono font-extrabold">
                {formatINRLakhCrore(monthlyRevenue)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
              <input
                id="input-monthly-rev"
                type="number"
                min="0"
                step="50000"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 2. Leads / Opportunities Per Month */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <label htmlFor="input-leads">Leads / Opportunities per Month</label>
              <span className="text-slate-900 font-mono font-extrabold">{leadsPerMonth} leads</span>
            </div>
            <input
              id="input-leads"
              type="number"
              min="1"
              max="5000"
              value={leadsPerMonth}
              onChange={(e) => setLeadsPerMonth(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 3. Average Deal Value */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <label htmlFor="input-avg-deal">Average Deal Value (₹)</label>
              <span className="text-emerald-700 font-mono font-extrabold">
                {formatINRLakhCrore(avgDealValue)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
              <input
                id="input-avg-deal"
                type="number"
                min="1000"
                step="25000"
                value={avgDealValue}
                onChange={(e) => setAvgDealValue(Math.max(100, Number(e.target.value) || 0))}
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 4. Current Conversion Rate Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <label htmlFor="input-current-conv">Current Conversion Rate</label>
              <span className="text-blue-700 font-mono font-extrabold">{currentConversionRate}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="input-current-conv"
                type="range"
                min="1"
                max="80"
                value={currentConversionRate}
                onChange={(e) => setCurrentConversionRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="w-12 text-right font-mono text-xs font-bold text-slate-600">
                {currentConversionRate}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>Closed: ~{calculatedClosedDeals} deals/mo</span>
              <span>Missed: ~{autoLostDeals} deals/mo</span>
            </div>
          </div>

          {/* 5. Target / Improved Conversion Rate Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <label htmlFor="input-target-conv">Improved Conversion Rate (Target)</label>
              <span className="text-emerald-700 font-mono font-extrabold">{targetConversionRate}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="input-target-conv"
                type="range"
                min={currentConversionRate}
                max="90"
                value={targetConversionRate}
                onChange={(e) => setTargetConversionRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="w-12 text-right font-mono text-xs font-bold text-emerald-600">
                {targetConversionRate}%
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 mt-1 font-semibold">
              +{calculations.conversionUplift.toFixed(1)}% uplift over baseline
            </p>
          </div>

          {/* 6. Estimated Lost Opportunities (Optional Manual Override) */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <label htmlFor="input-lost-deals">Estimated Lost Deals / Month</label>
              <span className="text-rose-700 font-mono font-extrabold">
                {effectiveLostDeals} missed
              </span>
            </div>
            <input
              id="input-lost-deals"
              type="number"
              min="0"
              placeholder={`Auto: ${autoLostDeals} (or enter custom)`}
              value={manualLostDeals}
              onChange={(e) => setManualLostDeals(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Leave blank to auto-derive from Leads × (100% - Conversion).
            </p>
          </div>

          {/* 7. Delay / Inaction Horizon (Months) */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <label htmlFor="input-delay-months" className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Inaction / Delay Horizon
              </label>
              <span className="text-amber-700 font-mono font-extrabold">{delayMonths} Months</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setDelayMonths(m)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    delayMonths === m
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {m} Mo
                </button>
              ))}
            </div>
            <input
              id="input-delay-months"
              type="range"
              min="1"
              max="24"
              value={delayMonths}
              onChange={(e) => setDelayMonths(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top 3 Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Monthly Leakage */}
            <div className="bg-rose-950/20 border border-rose-200/80 rounded-2xl p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">
                <span>Monthly Leakage</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-rose-700">
                {formatINRLakhCrore(calculations.monthlyLeakage)}
              </div>
              <p className="text-[10px] text-rose-600/90 font-mono mt-1">
                {formatINR(calculations.monthlyLeakage)} / mo
              </p>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-rose-200/50">
                {effectiveLostDeals} lost deals × {formatINRLakhCrore(avgDealValue)}
              </div>
            </div>

            {/* Metric 2: Annual Leakage */}
            <div className="bg-amber-950/20 border border-amber-200/80 rounded-2xl p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                <span>Annual Leakage</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-700">
                {formatINRLakhCrore(calculations.annualLeakage)}
              </div>
              <p className="text-[10px] text-amber-600/90 font-mono mt-1">
                {formatINR(calculations.annualLeakage)} / yr
              </p>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-amber-200/50">
                Compounded over 12 months
              </div>
            </div>

            {/* Metric 3: Cost of Inaction */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-md text-white">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <span>Cost of Inaction ({delayMonths}M)</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {formatINRLakhCrore(calculations.costOfInaction)}
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                {formatINR(calculations.costOfInaction)}
              </p>
              <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                {delayMonths} months of status quo
              </div>
            </div>
          </div>

          {/* Performance Comparison Ledger: Current vs Improved */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 font-display">
                  Current vs. Improved Performance Comparison
                </h4>
                <p className="text-[11px] text-slate-500">
                  Direct revenue impact when objection handling improves closing rates from {currentConversionRate}% to {targetConversionRate}%.
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200">
                +{calculations.percentageUplift.toFixed(0)}% Lift
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Current Column */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                  Current Baseline ({currentConversionRate}% Conv.)
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Closed Deals / Mo:</span>
                  <span className="font-mono font-bold text-slate-900">{calculatedClosedDeals} deals</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Monthly Closed Revenue:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINRLakhCrore(calculations.currentClosedRevenue)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Annualized Closed Revenue:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINRLakhCrore(calculations.currentClosedRevenue * 12)}</span>
                </div>
              </div>

              {/* Improved Column */}
              <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/80 space-y-2.5">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800">
                  Improved Baseline ({targetConversionRate}% Conv.)
                </div>
                <div className="flex justify-between items-center text-emerald-900">
                  <span>Closed Deals / Mo:</span>
                  <span className="font-mono font-bold text-emerald-950">
                    {calculations.improvedClosedDeals.toFixed(1)} deals (+{calculations.additionalDealsPerMonth.toFixed(1)})
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-900">
                  <span>Monthly Closed Revenue:</span>
                  <span className="font-mono font-bold text-emerald-950">
                    {formatINRLakhCrore(calculations.improvedClosedRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-900">
                  <span>Annualized Closed Revenue:</span>
                  <span className="font-mono font-bold text-emerald-950">
                    {formatINRLakhCrore(calculations.improvedClosedRevenue * 12)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Difference Summary Row */}
            <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold block">
                  Net Recoverable Top-Line Difference
                </span>
                <span className="text-xs text-slate-300">
                  Additional revenue captured purely by overcoming prospect objections
                </span>
              </div>
              <div className="text-right sm:text-right">
                <div className="text-xl font-black font-mono text-emerald-400">
                  +{formatINRLakhCrore(calculations.netMonthlyGain)} <span className="text-xs font-normal text-slate-400">/ mo</span>
                </div>
                <div className="text-xs font-mono text-emerald-300 font-bold">
                  +{formatINRLakhCrore(calculations.netAnnualGain)} / year
                </div>
              </div>
            </div>
          </div>

          {/* Manuj Bajaj 6KLH Methodology Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Manuj Bajaj 6KLH Framing (Sales Battlecard)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 block mb-1">
                  1. Kab Kab (When it Bleeds)
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Every month when {effectiveLostDeals} hot leads walk away saying "Baad me sochenge" or demanding 30% discounts.
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 block mb-1">
                  2. Kahan Kahan (Where it Leaks)
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Lost pipeline margin between proposal submission and contract signing, draining sales rep morale and CAC.
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-400 block mb-1">
                  3. Kitna Kitna (The Rupee Loss)
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <span className="text-rose-400 font-mono font-bold">{formatINR(calculations.costOfInaction)}</span> over {delayMonths} months. Total annual risk: <span className="text-rose-400 font-mono font-bold">{formatINR(calculations.annualLeakage)}</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Transparent Assumptions & Formula Callout */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Transparent Modeling Formulas & Assumptions</span>
            </div>
            <ul className="text-[11px] space-y-1 text-slate-500 list-disc list-inside leading-relaxed">
              <li>
                <strong>Monthly Leakage:</strong> <span className="font-mono">Lost Deals/Month ({effectiveLostDeals}) × Average Deal Value ({formatINR(avgDealValue)}) = {formatINR(calculations.monthlyLeakage)}</span>
              </li>
              <li>
                <strong>Annual Leakage:</strong> <span className="font-mono">Monthly Leakage × 12 = {formatINR(calculations.annualLeakage)}</span>
              </li>
              <li>
                <strong>Cost of Inaction:</strong> <span className="font-mono">Monthly Leakage × Selected Period ({delayMonths} Months) = {formatINR(calculations.costOfInaction)}</span>
              </li>
              <li>
                <strong>Recovered Revenue:</strong> <span className="font-mono">Leads ({leadsPerMonth}) × Conversion Uplift ({calculations.conversionUplift.toFixed(1)}%) × Average Deal Value = {formatINR(calculations.monthlyRecoveredRevenue)}/mo</span>
              </li>
              <li>
                <em>Note: This is a sales decision-support estimator based on entered business metrics, not hard customer financial audits.</em>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
