import React from 'react';
import { FileText, Download, Share2, Mail, RefreshCw } from 'lucide-react';

interface ActionButtonsProps {
  onDownloadPdf: () => void;
  onDownloadText: () => void;
  onShareWhatsApp: () => void;
  onShareEmail: () => void;
  onNewAnalysis: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDownloadPdf,
  onDownloadText,
  onShareWhatsApp,
  onShareEmail,
  onNewAnalysis
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-200">
      <button
        onClick={onDownloadPdf}
        className="col-span-2 md:col-span-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs md:text-sm cursor-pointer"
        id="global-btn-pdf"
      >
        <FileText className="w-4 h-4" />
        Download PDF
      </button>

      <button
        onClick={onDownloadText}
        className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-xs md:text-sm cursor-pointer"
        id="global-btn-download"
      >
        <Download className="w-4 h-4" />
        Download Text
      </button>

      <button
        onClick={onShareWhatsApp}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-xs md:text-sm cursor-pointer"
        id="global-btn-whatsapp"
      >
        <Share2 className="w-4 h-4" />
        Share WhatsApp
      </button>

      <button
        onClick={onShareEmail}
        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-xs md:text-sm cursor-pointer"
        id="global-btn-email"
      >
        <Mail className="w-4 h-4" />
        Share Email
      </button>

      <button
        onClick={onNewAnalysis}
        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-xs md:text-sm cursor-pointer"
        id="global-btn-new"
      >
        <RefreshCw className="w-4 h-4" />
        New Analysis
      </button>
    </div>
  );
};
