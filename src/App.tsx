import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, AlertCircle, Award, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { SalesForm } from './components/SalesForm';
import { LoadingState } from './components/LoadingState';
import { SituationBar } from './components/SituationBar';
import { ObjectionsTab } from './components/ObjectionsTab';
import { ClientQuestionsTab } from './components/ClientQuestionsTab';
import { CalculatorTab } from './components/CalculatorTab';
import { PlaybookTab } from './components/PlaybookTab';
import { ActionButtons } from './components/ActionButtons';
import { UserBar } from './components/UserBar';
import { AuthCard } from './components/AuthCard';
import { TokenUsageSection } from './components/TokenUsageSection';
import { PricingPage } from './components/PricingPage';
import { useAuth } from './context/AuthContext';
import { generatePdfReport } from './utils/pdfGenerator';
import { SAMPLE_REPORT, REPORT_TOKEN_COST } from './data/constants';
import { SalesReport } from './types';

export const App: React.FC = () => {
  const { user, profile, loading: authLoading, updateTokenBalance, refreshProfile } = useAuth();

  const [product, setProduct] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [businessModels, setBusinessModels] = useState<string[]>([]);
  const [dealSize, setDealSize] = useState("");
  const [buyerProfiles, setBuyerProfiles] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");

  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"objections" | "questions" | "calculator" | "playbook">("objections");
  const [showRebuttals, setShowRebuttals] = useState(true);
  const [showQuestionHints, setShowQuestionHints] = useState(true);
  const [hasValidationAttempted, setHasValidationAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'assistant' | 'plans'>('assistant');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasValidationAttempted(true);

    if (!product.trim() || !targetIndustry.trim()) {
      return;
    }

    if (!user) {
      setApiError("Authentication required. Please sign in to generate reports.");
      return;
    }

    const currentBalance = profile?.tokenBalance ?? 0;
    if (currentBalance < REPORT_TOKEN_COST) {
      setApiError("Insufficient tokens. Please upgrade your plan or purchase more tokens.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/generate-sales-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          product: product.trim(),
          targetIndustry: targetIndustry.trim(),
          businessModel: businessModels.join(", "),
          dealSize: dealSize || "Varies widely",
          buyerProfile: buyerProfiles.join(", "),
          additionalContext: additionalContext.trim()
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data: any = await response.json();
      if (!data.objections || data.objections.length === 0) {
        throw new Error("Invalid response format received from AI model.");
      }

      // Optimistic balance update from backend confirmation
      if (typeof data._tokenBalance === "number") {
        updateTokenBalance(data._tokenBalance);
      }
      refreshProfile();

      setReport(data);
    } catch (err: any) {
      console.error("Failed to generate sales report:", err);
      setApiError(err.message || "Failed to generate report. You can load our curated offline demo report below.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoReport = () => {
    if (!product) setProduct("ERP & Factory Automation Platform");
    if (!targetIndustry) setTargetIndustry("Manufacturing & Distribution");
    if (businessModels.length === 0) setBusinessModels(["B2B", "Manufacturing"]);
    if (!dealSize) setDealSize("₹5 Lakh–₹20 Lakh");
    if (buyerProfiles.length === 0) setBuyerProfiles(["Business owner / entrepreneur", "Procurement manager"]);
    setReport(SAMPLE_REPORT);
    setApiError(null);
  };

  const handleDownloadText = () => {
    if (!report) return;

    let text = `========================================================
SALES OBJECTIONS HANDLING DOSSIER — MANUJ BAJAJ
========================================================
Product: ${product}
Target Industry: ${targetIndustry}
Business Model: ${businessModels.join(", ") || "N/A"}
Estimated Deal Size: ${dealSize || "N/A"}
Buyer Profile: ${buyerProfiles.join(", ") || "N/A"}

========================================================
STRATEGIC SITUATION SUMMARY
========================================================
"${report.summary}"

========================================================
OBJECTIONS & 6KLH STAB & TWIST COUNTER-DEFENSES
========================================================
`;

    report.objections.forEach(cat => {
      text += `\n--- CATEGORY: ${cat.category.toUpperCase()} ---\n`;
      cat.items.forEach((item, idx) => {
        text += `\n#${idx + 1} OBJECTION: "${item.objection}"\n`;
        text += `  🗡️ BLEEDING STAB: ${item.stab}\n`;
        text += `  🌪️ VALUE TWIST: ${item.twist}\n`;
        if (item.six_klh_breakdown) {
          text += `  [6KLH Method]\n`;
          text += `    📅 Kab Kab (When?): ${item.six_klh_breakdown.kab_kab}\n`;
          text += `    📍 Kahan Kahan (Where?): ${item.six_klh_breakdown.kahan_kahan}\n`;
          text += `    💰 Kitna Kitna (Loss Cost?): ${item.six_klh_breakdown.kitna_kitna}\n`;
        }
        if (item.closing_offer_pitch) {
          text += `  🎯 CLOSING PITCH / DEAL ANGLE: ${item.closing_offer_pitch}\n`;
        }
      });
    });

    text += `\n========================================================
HIGH-TICKET CLIENT QUESTIONS & DEFENSES
========================================================
`;

    report.client_questions.forEach(cat => {
      text += `\n--- CATEGORY: ${cat.category.toUpperCase()} ---\n`;
      cat.items.forEach((item, idx) => {
        text += `\n#${idx + 1} QUESTION: "${item.question}"\n`;
        text += `  🔍 SKEPTICAL MINDSET: ${item.why_they_ask}\n`;
        text += `  🛡️ POWER RESPONSE STRATEGY: ${item.power_answer_hint}\n`;
      });
    });

    text += `\n========================================================
Generated by Sales Objections Handling Assistant
Coach Manuj Bajaj Systems • 26 Books Authored • 10,000+ Coached
========================================================\n`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedName = product.slice(0, 15).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    link.download = `sales-intelligence-${sanitizedName || "report"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    if (!report) return;
    const firstObjection = report.objections[0]?.items[0];
    const message = `🔥 *High-Ticket Sales Defense Strategy for ${product} (${targetIndustry})*\n\n` +
      `*Summary:* ${report.summary.slice(0, 160)}...\n\n` +
      (firstObjection ? `*Top Objection:* "${firstObjection.objection}"\n*Stab & Twist Counter:* ${firstObjection.twist}\n\n` : "") +
      `_Curated using Manuj Bajaj's 6KLH & Stab-Twist Methodology (Author of 26 Books)_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleShareEmail = () => {
    if (!report) return;
    const subject = `Sales Objections Strategy Dossier: ${product}`;
    const body = `Hi Team,\n\nHere is our strategic high-ticket sales objection handling protocol for ${product} (${targetIndustry}).\n\n` +
      `SITUATION SUMMARY:\n${report.summary}\n\n` +
      `Check the full objections breakdown and 6KLH protocols.\n\n` +
      `Coached via Manuj Bajaj Methodologies.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    generatePdfReport({
      product,
      targetIndustry,
      businessModel: businessModels,
      dealSize,
      report
    });
  };

  const handleNewAnalysis = () => {
    setReport(null);
    setHasValidationAttempted(false);
    setApiError(null);
    setActiveTab("objections");
  };

  const totalObjections = report?.objections.reduce((acc, cat) => acc + cat.items.length, 0) || 0;
  const totalQuestions = report?.client_questions.reduce((acc, cat) => acc + cat.items.length, 0) || 0;

  // 1. Loading State during auth session check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300 tracking-wide">
          Verifying secure SaaS session...
        </p>
      </div>
    );
  }

  // 2. Protected Application Area: Unauthenticated view
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
          <Header />
          <AuthCard />
        </div>
      </div>
    );
  }

  // 3. Authenticated View: Pricing & Subscription Management View
  if (currentView === 'plans') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <UserBar
          onViewPlans={() => setCurrentView('assistant')}
          currentView="plans"
        />
        <PricingPage onBackToAssistant={() => setCurrentView('assistant')} />
      </div>
    );
  }

  // 4. Authenticated View: Sales Objections Assistant with User Dashboard Bar
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* SaaS User Bar */}
      <UserBar
        onViewPlans={() => setCurrentView('plans')}
        currentView="assistant"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Header with Coach profile */}
        <Header />

        {/* Token Usage & Capacity Dashboard Section */}
        <TokenUsageSection onViewPlans={() => setCurrentView('plans')} />

        {/* API Error Banner */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-900 text-sm block">Generation Issue:</strong>
                <p className="text-red-800 text-xs">{apiError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {apiError.toLowerCase().includes("insufficient tokens") ? (
                <button
                  onClick={() => setCurrentView('plans')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
                  id="btn-error-view-plans"
                >
                  View Plans & Upgrade
                </button>
              ) : null}
              <button
                onClick={handleLoadDemoReport}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
                id="btn-load-demo"
              >
                Load Offline Demo Report
              </button>
            </div>
          </div>
        )}

        {/* Dynamic View: Form, Loading, or Report Dashboard */}
        {!report && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SalesForm
              product={product}
              setProduct={setProduct}
              targetIndustry={targetIndustry}
              setTargetIndustry={setTargetIndustry}
              businessModels={businessModels}
              setBusinessModels={setBusinessModels}
              dealSize={dealSize}
              setDealSize={setDealSize}
              buyerProfiles={buyerProfiles}
              setBuyerProfiles={setBuyerProfiles}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
              hasValidationAttempted={hasValidationAttempted}
              onSubmit={handleSubmit}
            />

            {/* Quick Demo Trigger Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleLoadDemoReport}
                className="text-xs text-slate-500 hover:text-teal-700 font-semibold underline transition-colors cursor-pointer"
              >
                Or preview with pre-configured sample B2B scenario (Manufacturing & ERP)
              </button>
            </div>
          </motion.div>
        )}

        {loading && <LoadingState currentStep={loadingStep} />}

        {report && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Situation Header Bar */}
            <SituationBar
              product={product}
              targetIndustry={targetIndustry}
              summary={report.summary}
              onNewAnalysis={handleNewAnalysis}
              onDownloadPdf={handleDownloadPdf}
              onDownloadText={handleDownloadText}
            />

            {/* Navigation Tabs Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveTab("objections")}
                  className={`py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "objections"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  id="tab-btn-objections"
                >
                  <span>💣 Objections & 6KLH</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === "objections" ? "bg-emerald-500 text-slate-950 font-black" : "bg-slate-200 text-slate-700 font-bold"
                  }`}>
                    {totalObjections}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("questions")}
                  className={`py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "questions"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  id="tab-btn-questions"
                >
                  <span>❓ Client Questions</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === "questions" ? "bg-blue-400 text-slate-950 font-black" : "bg-slate-200 text-slate-700 font-bold"
                  }`}>
                    {totalQuestions}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("calculator")}
                  className={`py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "calculator"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  id="tab-btn-calculator"
                >
                  <span>📊 Inaction Cost Calculator</span>
                </button>

                <button
                  onClick={() => setActiveTab("playbook")}
                  className={`py-3 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "playbook"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  id="tab-btn-playbook"
                >
                  <span>🎯 Sales Playbook & Closers</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-4 sm:p-6 mt-2">
                {activeTab === "objections" && (
                  <ObjectionsTab
                    objections={report.objections}
                    showRebuttals={showRebuttals}
                    setShowRebuttals={setShowRebuttals}
                  />
                )}

                {activeTab === "questions" && (
                  <ClientQuestionsTab
                    categories={report.client_questions}
                    showHints={showQuestionHints}
                    setShowHints={setShowQuestionHints}
                  />
                )}

                {activeTab === "calculator" && <CalculatorTab />}

                {activeTab === "playbook" && <PlaybookTab />}
              </div>
            </div>

            {/* Bottom Global Action Buttons */}
            <ActionButtons
              onDownloadPdf={handleDownloadPdf}
              onDownloadText={handleDownloadText}
              onShareWhatsApp={handleShareWhatsApp}
              onShareEmail={handleShareEmail}
              onNewAnalysis={handleNewAnalysis}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default App;
