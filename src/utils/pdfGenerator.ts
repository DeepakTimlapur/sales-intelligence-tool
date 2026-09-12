import { SalesReport } from '../types';

interface PdfGeneratorOptions {
  product: string;
  targetIndustry: string;
  businessModel: string[];
  dealSize: string;
  report: SalesReport;
}

export function generatePdfReport({
  product,
  targetIndustry,
  businessModel,
  dealSize,
  report
}: PdfGeneratorOptions): void {
  if (!report) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to save/print the PDF report!");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Sales Objections Handling Report — Manuj Bajaj</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .font-display {
          font-family: 'Space Grotesk', sans-serif;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff;
            padding: 0;
            margin: 0;
          }
          .page-break {
            page-break-before: always;
          }
          .section-block {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body class="p-6 md:p-10 max-w-4xl mx-auto bg-slate-50">
      <!-- Print Header Bar (web only) -->
      <div class="no-print mb-6 p-4 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200">
        <div>
          <h4 class="font-bold text-sm text-slate-900">PDF Report Generation Portal</h4>
          <p class="text-xs text-slate-500 mt-0.5">Press print to save as a B2B PDF document locally.</p>
        </div>
        <button onclick="window.print()" class="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer">
          🖨️ Open Print & Save PDF
        </button>
      </div>

      <!-- Printable Canvas Page -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <!-- Branded top strip -->
        <div class="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-900">
              <img src="https://picsum.photos/seed/manuj_coach/200/200" alt="Manuj Bajaj" class="w-full h-full object-cover">
            </div>
            <div>
              <span class="text-[10px] bg-emerald-500 text-slate-950 font-black tracking-widest uppercase px-2 py-0.5 rounded shadow-xs font-display">
                PRO SALES DEPLOYMENT
              </span>
              <h1 class="text-xl font-extrabold text-slate-950 font-display mt-0.5">
                Sales Objections Defense Dossier
              </h1>
              <p class="text-xs text-slate-500 font-semibold">
                Curated using Manuj Bajaj's Stab & Twist and 6KLH Methodology
              </p>
            </div>
          </div>
          <div class="text-right text-[11px] text-slate-500 hidden sm:block">
            <p><strong class="text-slate-800 font-bold">10,000+ Business Owners</strong> Coached</p>
            <p>Amazon Bestseller &bull; 26 Books</p>
          </div>
        </div>

        <!-- Deal Profile Details -->
        <div class="py-4 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[10px]">Product / Service</span>
            <strong class="text-slate-950 block mt-0.5">${product}</strong>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[10px]">Target Industry</span>
            <strong class="text-slate-950 block mt-0.5">${targetIndustry}</strong>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[10px]">Business Model</span>
            <strong class="text-slate-950 block mt-0.5">${businessModel.join(", ") || "N/A"}</strong>
          </div>
          <div>
            <span class="text-slate-400 font-bold block uppercase text-[10px]">Est. Deal size</span>
            <strong class="text-slate-950 block mt-0.5">${dealSize || "N/A"}</strong>
          </div>
        </div>

        <!-- Narrative Summary -->
        <div class="py-5 border-b border-slate-100 section-block">
          <h3 class="text-xs font-black tracking-widest uppercase text-teal-800 font-display mb-1.5 flex items-center gap-1.5">
            <span>🎯</span> Strategic Situation Summary
          </h3>
          <p class="text-slate-850 italic font-medium leading-relaxed text-xs bg-[#e1f5ee] p-3.5 rounded-xl border border-emerald-100/50">
            "${report.summary}"
          </p>
        </div>

        <!-- Cost of Inaction calculations -->
        <div class="py-5 border-b border-slate-100 section-block">
          <h3 class="text-xs font-black tracking-widest uppercase text-red-700 font-display mb-2.5 flex items-center gap-1.5">
            <span>⚠️</span> Cost of Inaction (COI) Ledger
          </h3>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center my-1.5">
            <p class="text-xs text-slate-500 font-medium">Calculation engines and cumulative ledger adjustments are currently undergoing alignment.</p>
            <span class="inline-block mt-2 text-[9px] font-black tracking-widest uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">Coming soon - shortly</span>
          </div>
        </div>

        <!-- Detailed Objection Blocks -->
        <div class="py-5 section-block">
          <h3 class="text-xs font-black tracking-widest uppercase text-slate-900 border-b border-slate-900 pb-1 mb-4 font-display flex items-center gap-1.5">
            <span>🗡️</span> Objections & Stab & Twist Counter-Defenses (Hinglish Trained)
          </h3>
          <div class="space-y-6">
            ${report.objections.map(category => `
              <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 section-block">
                <h4 class="font-extrabold text-[11px] text-slate-850 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-display">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${category.category}
                </h4>
                <div class="space-y-5">
                  ${category.items.map((item, idx) => `
                    <div class="pl-3 border-l-2 border-emerald-500 space-y-2 text-xs">
                      <p class="font-bold text-slate-900 text-sm">#${idx + 1} "${item.objection}"</p>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        <div class="p-2.5 bg-red-50/80 border border-red-200 rounded-lg">
                          <span class="text-[9px] font-black uppercase tracking-wider text-red-700 block mb-0.5">🗡️ Bleeding Stab</span>
                          <p class="text-red-900 font-medium text-xs leading-relaxed">${item.stab}</p>
                        </div>
                        <div class="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg">
                          <span class="text-[9px] font-black uppercase tracking-wider text-emerald-800 block mb-0.5">🌪️ Value Twist</span>
                          <p class="text-emerald-950 font-medium text-xs leading-relaxed">${item.twist}</p>
                        </div>
                      </div>
                      ${item.six_klh_breakdown ? `
                        <div class="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1 mt-1 text-[11px]">
                          <strong class="text-[9px] font-black uppercase tracking-wider text-amber-900 block">6KLH Method (Kab, Kahan, Kitna):</strong>
                          <p><span class="text-slate-400 font-bold">When:</span> ${item.six_klh_breakdown.kab_kab}</p>
                          <p><span class="text-slate-400 font-bold">Where:</span> ${item.six_klh_breakdown.kahan_kahan}</p>
                          <p><span class="text-slate-400 font-bold">Loss:</span> ${item.six_klh_breakdown.kitna_kitna}</p>
                        </div>
                      ` : ""}
                      ${item.closing_offer_pitch ? `
                        <p class="text-xs text-slate-700 mt-1"><strong class="text-indigo-800 font-bold uppercase text-[9px]">Closing Pitch:</strong> ${item.closing_offer_pitch}</p>
                      ` : ""}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- High-ticket Client Discovery Questions -->
        <div class="py-5 section-block">
          <h3 class="text-xs font-black tracking-widest uppercase text-slate-900 border-b border-slate-900 pb-1 mb-4 font-display flex items-center gap-1.5">
            <span>❓</span> Brand Discovery Trust Answers
          </h3>
          <div class="space-y-4">
            ${report.client_questions.map(cat => `
              <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 section-block">
                <h4 class="font-extrabold text-[11px] text-slate-850 uppercase tracking-widest mb-2 font-display">
                  ${cat.category}
                </h4>
                <div class="space-y-4">
                  ${cat.items.map((qItem, qIdx) => `
                    <div class="pl-3 border-l-2 border-slate-400 space-y-1 text-xs">
                      <p class="font-bold text-slate-950">"${qIdx + 1}. ${qItem.question}"</p>
                      <p class="text-slate-500"><strong class="text-blue-700 font-semibold uppercase text-[9px]">Skeptical Mindset:</strong> ${qItem.why_they_ask}</p>
                      <p class="text-slate-900 font-medium bg-emerald-50/40 p-2 rounded-md border border-emerald-100/30"><strong class="text-emerald-800 font-bold uppercase text-[9px]">Coach Response Protocol:</strong> ${qItem.power_answer_hint}</p>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Document certification line -->
        <div class="mt-8 pt-5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest font-display">
          Sales Objections Handling Assistant | Manuj Bajaj Sales Coach Systems | Bestseller 26 Books
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
