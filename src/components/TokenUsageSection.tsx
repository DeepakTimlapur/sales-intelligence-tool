import React, { useEffect, useState } from 'react';
import { Coins, Sparkles, FileText, AlertTriangle, History, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { REPORT_TOKEN_COST } from '../data/constants';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { TokenTransaction } from '../types';

interface TokenUsageSectionProps {
  onViewPlans?: () => void;
}

export const TokenUsageSection: React.FC<TokenUsageSectionProps> = ({ onViewPlans }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const balance = profile?.tokenBalance ?? 0;
  const reportsAvailable = Math.max(0, Math.floor(balance / REPORT_TOKEN_COST));
  const isInsufficient = balance < REPORT_TOKEN_COST;

  const loadTransactions = async () => {
    if (!user) return;
    setLoadingTx(true);
    try {
      const q = query(
        collection(db, 'tokenTransactions'),
        where('uid', '==', user.uid),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const txs: TokenTransaction[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as TokenTransaction;
        txs.push({ ...data, id: doc.id });
      });
      // Sort client side by createdAt desc to avoid composite index requirements
      txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(txs);
    } catch (err) {
      console.warn('Could not load token transactions history:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadTransactions();
    }
  }, [showHistory, balance]);

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs"
      id="section-token-usage"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Token Usage & Generation Capacity
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            AI Sales Intelligence reports are processed using real-time account tokens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewPlans && (
            <button
              type="button"
              onClick={onViewPlans}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors cursor-pointer shadow-2xs"
              id="btn-section-view-plans"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>View Plans</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
            id="btn-toggle-token-history"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>{showHistory ? 'Hide History' : 'View Ledger'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              refreshProfile();
              if (showHistory) loadTransactions();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Token Balance"
            id="btn-refresh-balance"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
        {/* Metric 1: Current Balance */}
        <div
          className={`rounded-xl p-4 border transition-all ${
            isInsufficient
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-slate-50/80 border-slate-200/70'
          }`}
          id="card-current-balance"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Current Balance</span>
            <Coins className={`w-4 h-4 ${isInsufficient ? 'text-amber-500' : 'text-teal-600'}`} />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight" id="val-current-balance">
            {balance.toLocaleString()}
            <span className="text-xs font-bold text-slate-500 ml-1.5 uppercase">Tokens</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Starter allocation: 1,000 tokens
          </div>
        </div>

        {/* Metric 2: Cost Per Report */}
        <div
          className="rounded-xl p-4 bg-slate-50/80 border border-slate-200/70"
          id="card-cost-per-report"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Cost Per Report</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight" id="val-cost-per-report">
            {REPORT_TOKEN_COST}
            <span className="text-xs font-bold text-slate-500 ml-1.5 uppercase">Tokens/Report</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Fixed AI generation tariff
          </div>
        </div>

        {/* Metric 3: Reports Available */}
        <div
          className={`rounded-xl p-4 border transition-all ${
            isInsufficient
              ? 'bg-red-50/70 border-red-200'
              : 'bg-teal-50/50 border-teal-200/70'
          }`}
          id="card-reports-available"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Available Capacity</span>
            <FileText className={`w-4 h-4 ${isInsufficient ? 'text-red-500' : 'text-teal-600'}`} />
          </div>
          <div
            className={`text-2xl font-black tracking-tight ${
              isInsufficient ? 'text-red-700' : 'text-teal-900'
            }`}
            id="val-reports-available"
          >
            {reportsAvailable}
            <span className="text-xs font-bold text-slate-500 ml-1.5 uppercase">Reports</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {reportsAvailable > 0
              ? `${reportsAvailable} full dossier${reportsAvailable === 1 ? '' : 's'} available`
              : 'Balance below 100 tokens'}
          </div>
        </div>
      </div>

      {/* Insufficient Tokens Alert Banner */}
      {isInsufficient && (
        <div
          className="mt-4 p-3.5 bg-amber-500/10 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900"
          id="banner-insufficient-tokens"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-extrabold block text-amber-950 text-sm mb-0.5">
              Insufficient tokens. Please upgrade your plan or purchase more tokens.
            </strong>
            You currently have <strong>{balance.toLocaleString()} tokens</strong>, but generating an AI Sales Intelligence Report requires <strong>{REPORT_TOKEN_COST} tokens</strong>.
            {onViewPlans && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={onViewPlans}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  id="btn-alert-upgrade-plan"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View Plans &amp; Upgrade</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Token Transaction Ledger Table */}
      {showHistory && (
        <div className="mt-5 pt-4 border-t border-slate-100" id="token-ledger-table">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Recent Token Transactions
            </h3>
            <span className="text-[11px] text-slate-500">Immutable Ledger</span>
          </div>

          {loadingTx ? (
            <div className="py-6 text-center text-xs text-slate-500 font-medium">
              Loading ledger transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/60 font-medium">
              No transactions recorded yet. Generating a report will record an atomic usage transaction.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit / Credit</th>
                    <th className="py-2.5 px-3 text-right">Resulting Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {transactions.map(tx => (
                    <tr key={tx.id || tx.createdAt} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">
                        {tx.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3 text-red-500" />
                          -{tx.amount} Tokens
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {tx.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
