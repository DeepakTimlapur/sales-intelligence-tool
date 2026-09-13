import React from 'react';
import { LogOut, Coins, ShieldCheck, Sparkles, ArrowLeft, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPlanBadgeText, calculateRemainingTrialDays } from '../data/plans';

interface UserBarProps {
  onViewPlans?: () => void;
  onViewKnowledge?: () => void;
  currentView?: 'assistant' | 'plans' | 'knowledge';
  isAdmin?: boolean;
}

export const UserBar: React.FC<UserBarProps> = ({
  onViewPlans,
  onViewKnowledge,
  currentView = 'assistant',
  isAdmin = false
}) => {
  const { user, profile, logout } = useAuth();

  if (!user) return null;

  const displayName = profile?.name || user.displayName || user.email?.split('@')[0] || 'Member';
  const planBadgeText = formatPlanBadgeText(profile?.plan, profile?.trialEndDate);
  const tokenBalance = profile?.tokenBalance ?? 1000;
  const photoURL = profile?.photoURL || user.photoURL;

  // Determine badge styling based on plan and expiry
  const isTrial = profile?.plan === 'trial';
  const trialState = calculateRemainingTrialDays(profile?.trialEndDate);
  const isExpired = isTrial && trialState.isExpired;

  const badgeColorClass = isExpired
    ? 'bg-red-500/20 text-red-300 border-red-500/40'
    : isTrial
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : profile?.plan === 'monthly'
    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    : profile?.plan === 'oneTime'
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-slate-700/60 text-slate-300 border-slate-600/50';

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-2.5 shadow-md">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: User Identity & Plan */}
        <div className="flex items-center gap-3">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-slate-700 object-cover shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-bold text-xs shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-sm text-slate-100 tracking-tight" id="user-display-name">
              {displayName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 sm:mt-0">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeColorClass}`}
                id="user-plan-badge"
              >
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>{planBadgeText}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: View Plans, Token Balance & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
          {/* Admin Knowledge Base Button (Shown only to authorized administrators) */}
          {isAdmin && onViewKnowledge && (
            <button
              onClick={onViewKnowledge}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                currentView === 'knowledge'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
              }`}
              id="btn-toggle-knowledge-view"
              title="Manage Video Transcript Knowledge Base (Admin)"
            >
              {currentView === 'knowledge' ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Assistant</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Knowledge Base</span>
                </>
              )}
            </button>
          )}

          {/* Manage Plan / View Plans Button */}
          {onViewPlans && (
            <button
              onClick={onViewPlans}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                currentView === 'plans'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                  : 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30'
              }`}
              id="btn-toggle-plans-view"
              title="View all subscription options and token packages"
            >
              {currentView === 'plans' ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
                  <span>Assistant</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>View Plans</span>
                </>
              )}
            </button>
          )}

          {/* Token Balance Pill */}
          <div
            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 transition-colors shadow-xs"
            title="Available Generation Tokens"
            id="user-token-balance"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">{tokenBalance.toLocaleString()}</strong> Tokens
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-red-950/40 border border-slate-700/60 hover:border-red-800/60 transition-all cursor-pointer shadow-xs"
            id="btn-logout"
            title="Sign out of account"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
