import React from 'react';
import { RefreshCcw, FileText, Download, Award } from 'lucide-react';

interface SituationBarProps {
  product: string;
  targetIndustry: string;
  summary: string;
  onNewAnalysis: () => void;
  onDownloadPdf: () => void;
  onDownloadText: () => void;
}

export const SituationBar: React.FC<SituationBarProps> = ({
  product,
  targetIndustry,
  summary,
  onNewAnalysis,
  onDownloadPdf,
  onDownloadText
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 md:p-5 border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F6E56] block">
            CURRENT SITUATION REPORT
          </span>
          <div className="text-sm font-semibold text-slate-800 mt-1 flex flex-wrap gap-x-3 items-center">
            <span>
              <strong>Product:</strong> {product}
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <strong>Industry:</strong> {targetIndustry}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNewAnalysis}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            id="btn-new-analysis-top"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            New Analysis
          </button>
          <button
            onClick={onDownloadPdf}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-pdf-report-top"
          >
            <FileText className="w-3.5 h-3.5" />
            Save PDF
          </button>
          <button
            onClick={onDownloadText}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-download-report-top"
          >
            <Download className="w-3.5 h-3.5" />
            Text File
          </button>
        </div>
      </div>

      <div className="bg-[#E1F5EE] border-l-4 border-[#1D9E75] rounded-r-2xl p-5 md:p-6 shadow-xs">
        <h4 className="text-xs uppercase tracking-widest font-extrabold text-teal-700 mb-1.5 flex items-center gap-1">
          <Award className="w-4 h-4 text-emerald-500" /> Strategic Sales Analysis Summary
        </h4>
        <p className="text-slate-800 font-medium text-sm md:text-base leading-relaxed italic">
          "{summary}"
        </p>
      </div>
    </div>
  );
};
