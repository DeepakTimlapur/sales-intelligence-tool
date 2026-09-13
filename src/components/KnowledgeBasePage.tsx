import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Layers,
  Calendar,
  Eye,
  X,
  FileCode,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Transcript, TranscriptChunk, TranscriptFileType } from '../types';

interface KnowledgeBasePageProps {
  onBackToAssistant: () => void;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ onBackToAssistant }) => {
  const { user } = useAuth();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [detectedType, setDetectedType] = useState<TranscriptFileType>('txt');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Chunk Inspection Modal
  const [inspectingTranscript, setInspectingTranscript] = useState<Transcript | null>(null);
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Delete Confirmation Modal
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/transcripts', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTranscripts(data.transcripts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load video transcripts.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccessMessage(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['txt', 'srt', 'vtt'].includes(ext)) {
      setError('Please select a valid transcript file (.txt, .srt, or .vtt).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum transcript size is 10 MB.');
      return;
    }

    setSelectedFile(file);
    setDetectedType(ext as TranscriptFileType);

    if (!title.trim()) {
      // Auto-suggest title from filename (removing extension and hyphens/underscores)
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text || '');
    };
    reader.onerror = () => {
      setError('Failed to read transcript file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this transcript.');
      return;
    }
    if (!selectedFile || !fileContent.trim()) {
      setError('Please select a transcript file to upload.');
      return;
    }

    if (!user) {
      setError('You must be signed in with admin credentials to upload transcripts.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/transcripts/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          title: title.trim(),
          fileName: selectedFile.name,
          fileContent,
          fileType: detectedType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload transcript.');
      }

      setSuccessMessage(
        `Successfully indexed "${data.transcript.title}" into ${data.chunksCount} semantic RAG chunks (${data.wordCount.toLocaleString()} words).`
      );
      setTitle('');
      setSelectedFile(null);
      setFileContent('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchTranscripts();
    } catch (err: any) {
      setError(err.message || 'Transcript processing failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleInspectChunks = async (transcript: Transcript) => {
    setInspectingTranscript(transcript);
    setLoadingChunks(true);
    setChunks([]);
    try {
      if (!user) return;
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/transcripts/${transcript.id}/chunks`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await res.json();
      setChunks(data.chunks || []);
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId || !user) return;
    setIsDeleting(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/transcripts/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete transcript.');
      }
      setSuccessMessage('Transcript and associated RAG chunks removed successfully.');
      setTranscripts(prev => prev.filter(t => t.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete transcript.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToAssistant}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
              id="btn-back-assistant"
            >
              <ArrowLeft className="w-4 h-4 text-teal-400" />
              <span>Back to Assistant</span>
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                <ShieldCheck className="w-3 h-3" />
                Admin Only
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Client Video Knowledge Base (RAG)
              </h1>
            </div>
          </div>

          <button
            onClick={fetchTranscripts}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Refresh transcripts list"
            id="btn-refresh-transcripts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* RAG Information Notice */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-teal-500/20 rounded-2xl p-5 sm:p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Retrieval-Augmented Generation (RAG) System
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                Upload video transcripts, masterclass recordings, and coaching case studies (.TXT, .SRT, .VTT).
                When any user submits a sales inquiry, our semantic RAG engine automatically retrieves the most
                relevant coaching excerpts and injects authentic Indian market turnarounds into Gemini's
                Stab &amp; Twist and 6KLH objection handlers.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-teal-400/90 font-medium">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>RAG architecture: Content remains strictly private and is dynamically retrieved at prompt-time (no permanent base-model fine-tuning).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-red-200">
              <strong className="block font-semibold">Error:</strong>
              {error}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-200">
              <strong className="block font-semibold">Success:</strong>
              {successMessage}
            </div>
          </div>
        )}

        {/* Upload Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <UploadCloud className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Upload New Video Transcript</h2>
                <p className="text-xs text-slate-400">Supported formats: Plain Text (.txt), SubRip Subtitles (.srt), WebVTT (.vtt)</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Transcript Title / Masterclass Topic <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Overcoming Price & Bhav-Taav Objections in Indian B2B"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                disabled={uploading}
                id="input-transcript-title"
              />
            </div>

            {/* Drag and drop zone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Transcript File <span className="text-red-400">*</span>
              </label>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-teal-400 bg-teal-950/20'
                    : selectedFile
                    ? 'border-teal-500/50 bg-slate-950/80'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
                }`}
                id="dropzone-transcript"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.srt,.vtt,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-xs">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-100">{selectedFile.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="uppercase font-mono bg-slate-800 px-2 py-0.5 rounded text-[10px] text-teal-300 font-bold">
                        {detectedType}
                      </span>
                      <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <span className="text-xs text-teal-400 underline mt-1">Click or drop to replace file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-1">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      Drag &amp; drop transcript here, or <span className="text-teal-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports .TXT, .SRT, or .VTT files up to 10 MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileContent('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
                >
                  Clear File
                </button>
              )}

              <button
                type="submit"
                disabled={uploading || !selectedFile || !title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                id="btn-submit-transcript"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing &amp; Indexing RAG Chunks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Upload &amp; Extract Chunks</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Transcripts List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Knowledge Base Transcripts</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {transcripts.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                All indexed transcripts actively queried by the AI assistant during report generation.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
              <p className="text-xs">Loading indexed transcripts...</p>
            </div>
          ) : transcripts.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-300">No transcripts uploaded yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Upload your first coaching video transcript above. The RAG engine will normalize the dialogue and create semantic chunks.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {transcripts.map((t) => (
                <div
                  key={t.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-100 truncate">{t.title}</span>
                      <span className="uppercase font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        {t.fileType}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        PROCESSED
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{t.fileName}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-teal-400" />
                        <span><strong>{t.chunkCount}</strong> chunks</span>
                      </span>
                      {t.wordCount > 0 && (
                        <span>{t.wordCount.toLocaleString()} words</span>
                      )}
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(t.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </span>
                    </div>

                    {t.summary && (
                      <p className="text-xs text-slate-400 italic line-clamp-2 max-w-3xl pt-0.5">
                        "{t.summary}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleInspectChunks(t)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-teal-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Inspect extracted semantic chunks"
                      id={`btn-inspect-${t.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Chunks</span>
                    </button>

                    <button
                      onClick={() => setDeletingId(t.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 hover:border-red-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Delete transcript from knowledge base"
                      id={`btn-delete-${t.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chunks Inspection Modal */}
      {inspectingTranscript && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100 truncate">
                    {inspectingTranscript.title}
                  </h3>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                    {inspectingTranscript.fileType}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Semantic Chunks ({inspectingTranscript.chunkCount}) — injected selectively based on query relevance
                </p>
              </div>
              <button
                onClick={() => setInspectingTranscript(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {loadingChunks ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
                  <p className="text-xs">Loading semantic chunks...</p>
                </div>
              ) : chunks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No chunks found for this transcript.</p>
              ) : (
                chunks.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-teal-400/90">
                      <span>Chunk #{c.chunkIndex + 1}</span>
                      <span className="text-slate-500 font-sans">{c.content.length} chars</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/90">
              <button
                onClick={() => setInspectingTranscript(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Transcript?</h3>
                <p className="text-xs text-slate-400">This will remove this transcript and all of its RAG knowledge chunks permanently.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-50"
                id="btn-confirm-delete"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Transcript</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
