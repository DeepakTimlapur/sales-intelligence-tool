import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Zap,
  Clock,
  Coins,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Calendar,
  Lock,
  Loader2,
  Receipt,
  CreditCard,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  PLANS,
  PlanConfig,
  calculateRemainingTrialDays,
  formatPlanBadgeText
} from '../data/plans';
import { PaymentRecord } from '../types';

interface PricingPageProps {
  onBackToAssistant: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBackToAssistant }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<'monthly' | 'oneTime' | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const currentPlanId = (profile?.plan || 'free') as 'free' | 'trial' | 'monthly' | 'oneTime';
  const tokenBalance = profile?.tokenBalance ?? 1000;

  // Trial status calculation
  const trialState = calculateRemainingTrialDays(profile?.trialEndDate);
  const hasUsedTrial = profile?.hasUsedTrial === true || !!profile?.trialStartDate;
  const isTrialActive = currentPlanId === 'trial' && !trialState.isExpired;
  const isTrialExpired = currentPlanId === 'trial' && trialState.isExpired;

  // Fetch payment history
  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setIsLoadingPayments(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/razorpay/payment-history', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.payments)) {
        setPaymentHistory(data.payments);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, fetchPayments]);

  // Handler for activating the 30-day free trial
  const handleActivateTrial = async () => {
    if (!user) {
      setActionMessage({ type: 'error', text: 'Please sign in first to activate your 30-day free trial.' });
      return;
    }
    if (hasUsedTrial) {
      setActionMessage({
        type: 'error',
        text: 'You have already activated your 30-day free trial. Each account is limited to one trial period.'
      });
      return;
    }

    setIsActivatingTrial(true);
    setActionMessage(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/activate-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate free trial.');
      }

      setActionMessage({
        type: 'success',
        text: '30-Day Free Trial Activated! 3,000 trial tokens have been credited to your account.'
      });

      await refreshProfile();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Error occurred while activating trial.'
      });
    } finally {
      setIsActivatingTrial(false);
    }
  };

  // Handler for Razorpay Payments
  const handleInitiatePayment = async (planType: 'monthly' | 'oneTime') => {
    if (!user) {
      setActionMessage({
        type: 'error',
        text: 'Please sign in to proceed with payment and subscribe to a plan.'
      });
      return;
    }

    setActionMessage(null);
    setIsProcessingPayment(planType);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay checkout gateway. Please check your internet connection.');
      }

      const idToken = await user.getIdToken();

      if (planType === 'oneTime') {
        // ONE-TIME ORDER CREATION
        const orderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
          }
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to initialize Razorpay one-time payment order.');
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Sales Objection Sniper',
          description: '30,000 Non-Expiring Token Pack (₹4,999)',
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              setActionMessage({
                type: 'success',
                text: 'Payment received! Verifying cryptographic signature and crediting 30,000 tokens...'
              });

              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: 'oneTime'
                })
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Server verification failed.');
              }

              await refreshProfile();
              await fetchPayments();

              setActionMessage({
                type: 'success',
                text: `Payment Confirmed! 30,000 tokens credited. Reference ID: ${response.razorpay_payment_id}`
              });
            } catch (vErr: any) {
              setActionMessage({
                type: 'error',
                text: vErr.message || 'Payment verification failed on server.'
              });
            } finally {
              setIsProcessingPayment(null);
            }
          },
          prefill: {
            name: user.displayName || '',
            email: user.email || ''
          },
          theme: {
            color: '#0d9488'
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(null);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (failResp: any) => {
          setIsProcessingPayment(null);
          setActionMessage({
            type: 'error',
            text: `Payment failed: ${failResp.error?.description || 'Transaction declined or cancelled.'}`
          });
        });
        rzp.open();
      } else if (planType === 'monthly') {
        // MONTHLY SUBSCRIPTION CREATION
        const subRes = await fetch('/api/razorpay/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
          }
        });

        const subData = await subRes.json();
        if (!subRes.ok) {
          throw new Error(subData.error || 'Failed to initialize Razorpay monthly subscription.');
        }

        const options = {
          key: subData.keyId,
          subscription_id: subData.subscriptionId,
          name: 'Sales Objection Sniper',
          description: 'Monthly Plan — ₹1,999/month (10,000 Tokens/mo)',
          handler: async (response: any) => {
            try {
              setActionMessage({
                type: 'success',
                text: 'Payment received! Verifying subscription and crediting 10,000 monthly tokens...'
              });

              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: 'monthly'
                })
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Subscription verification failed.');
              }

              await refreshProfile();
              await fetchPayments();

              setActionMessage({
                type: 'success',
                text: `Monthly Subscription Activated! 10,000 tokens credited. Subscription ID: ${response.razorpay_subscription_id}`
              });
            } catch (vErr: any) {
              setActionMessage({
                type: 'error',
                text: vErr.message || 'Subscription verification failed on server.'
              });
            } finally {
              setIsProcessingPayment(null);
            }
          },
          prefill: {
            name: user.displayName || '',
            email: user.email || ''
          },
          theme: {
            color: '#0d9488'
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(null);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (failResp: any) => {
          setIsProcessingPayment(null);
          setActionMessage({
            type: 'error',
            text: `Subscription failed: ${failResp.error?.description || 'Transaction declined or cancelled.'}`
          });
        });
        rzp.open();
      }
    } catch (err: any) {
      setIsProcessingPayment(null);
      setActionMessage({
        type: 'error',
        text: err.message || 'An error occurred while launching Razorpay checkout.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onBackToAssistant}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
            id="btn-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-teal-400" />
            <span>Back to Assistant</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Active Plan Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{formatPlanBadgeText(profile?.plan, profile?.trialEndDate)}</span>
            </div>

            {/* Token Balance */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-xs font-semibold text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong className="text-white font-bold">{tokenBalance.toLocaleString()}</strong> Tokens
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Subscription & Token Plans
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Scale Your High-Ticket Sales Intelligence
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Choose the plan that fits your closing volume. Test-mode Razorpay checkout is live with instant cryptographic verification and token crediting.
          </p>
        </div>

        {/* Global Feedback Banner */}
        {actionMessage && (
          <div
            className={`max-w-3xl mx-auto mb-8 p-4 rounded-xl border flex items-start gap-3 shadow-md animate-in fade-in duration-200 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/40 border-red-500/50 text-red-200'
            }`}
            id="plan-action-alert"
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium leading-relaxed">{actionMessage.text}</div>
          </div>
        )}

        {/* Trial Expired Alert Banner */}
        {isTrialExpired && (
          <div className="max-w-3xl mx-auto mb-8 p-4 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-200 flex items-start gap-3 shadow-md">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <strong className="font-bold text-white">Your 30-Day Free Trial Has Expired.</strong>{' '}
              Your trial period ended on {new Date(profile?.trialEndDate || '').toLocaleDateString()}. To continue generating comprehensive objection intelligence dossiers with uninterrupted capacity, select one of the payment options below.
            </div>
          </div>
        )}

        {/* Four Subscription Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* 1. ALWAYS FREE */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
              currentPlanId === 'free'
                ? 'bg-slate-900/90 border-teal-500/60 shadow-lg shadow-teal-500/5 ring-1 ring-teal-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
            id="card-plan-free"
          >
            {currentPlanId === 'free' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500 text-slate-950 shadow-xs">
                Current Plan
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">{PLANS.free.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Starter
                </span>
              </div>

              <p className="text-xs text-slate-400 min-h-[36px] mb-4">{PLANS.free.tagline}</p>

              {/* Pricing */}
              <div className="mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{PLANS.free.priceFormatted}</span>
                  <span className="text-xs font-medium text-slate-400">/ forever</span>
                </div>
                <div className="text-xs text-teal-400 mt-1 font-semibold">
                  1,000 Starter Tokens included
                </div>
              </div>

              {/* Live Balance in Current Card */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">
                  Your Available Balance
                </div>
                <div className="text-base font-bold text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{tokenBalance.toLocaleString()} Tokens</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  No recurring charges or automated debits
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 mb-6 text-xs text-slate-300">
                {PLANS.free.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Button */}
            <div className="pt-2">
              <button
                disabled={true}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition-all border border-slate-700 bg-slate-800/80 text-slate-400 cursor-not-allowed text-center"
                id="btn-plan-free-status"
              >
                {currentPlanId === 'free' ? 'Current Active Plan' : 'Standard Free Tier'}
              </button>
            </div>
          </div>

          {/* 2. FREE 1-MONTH TRIAL */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
              currentPlanId === 'trial'
                ? 'bg-slate-900/90 border-teal-500/60 shadow-lg shadow-teal-500/5 ring-1 ring-teal-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
            id="card-plan-trial"
          >
            {currentPlanId === 'trial' ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500 text-slate-950 shadow-xs">
                Current Plan
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                30-Day Pass
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">{PLANS.trial.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  Risk Free
                </span>
              </div>

              <p className="text-xs text-slate-400 min-h-[36px] mb-4">{PLANS.trial.tagline}</p>

              {/* Pricing */}
              <div className="mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{PLANS.trial.priceFormatted}</span>
                  <span className="text-xs font-medium text-slate-400">/ 30 days</span>
                </div>
                <div className="text-xs text-emerald-400 mt-1 font-semibold">
                  +3,000 Trial Tokens credited
                </div>
              </div>

              {/* Trial Dates & Status Display */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-5 space-y-1.5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
                  <span>Trial Validity</span>
                  <Clock className="w-3 h-3 text-slate-400" />
                </div>

                {isTrialActive && (
                  <>
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{trialState.formatted}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>
                        Expires: {new Date(profile?.trialEndDate || '').toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}

                {isTrialExpired && (
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>Trial Expired on {new Date(profile?.trialEndDate || '').toLocaleDateString()}</span>
                  </div>
                )}

                {!isTrialActive && !isTrialExpired && hasUsedTrial && (
                  <div className="text-xs font-semibold text-slate-400">
                    Trial previously utilized for this account.
                  </div>
                )}

                {!hasUsedTrial && (
                  <div className="text-xs text-slate-300">
                    Activate once for 30 days of elevated tokens and features.
                  </div>
                )}
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 mb-6 text-xs text-slate-300">
                {PLANS.trial.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {isTrialActive ? (
                <button
                  disabled={true}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide border border-teal-500/40 bg-teal-500/10 text-teal-300 cursor-default text-center"
                  id="btn-trial-active"
                >
                  Active Trial Plan
                </button>
              ) : hasUsedTrial ? (
                <button
                  disabled={true}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide border border-slate-800 bg-slate-800/50 text-slate-500 cursor-not-allowed text-center"
                  id="btn-trial-used"
                  title="Trial can only be activated once per account"
                >
                  Trial Offer Claimed
                </button>
              ) : (
                <button
                  onClick={handleActivateTrial}
                  disabled={isActivatingTrial}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition-all bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md hover:shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  id="btn-activate-trial"
                >
                  {isActivatingTrial ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating Trial...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Activate 30-Day Free Trial</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 3. MONTHLY PAYMENT — ₹1,999/month (10,000 Tokens) */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
              currentPlanId === 'monthly'
                ? 'bg-slate-900/90 border-teal-500/60 shadow-lg shadow-teal-500/5 ring-1 ring-teal-500/30'
                : 'bg-slate-900/50 border-teal-500/40 hover:border-teal-500 shadow-md'
            }`}
            id="card-plan-monthly"
          >
            {currentPlanId === 'monthly' ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500 text-slate-950 shadow-xs">
                Current Plan
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500 text-slate-950 shadow-xs">
                Most Popular
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">{PLANS.monthly.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Recurring
                </span>
              </div>

              <p className="text-xs text-slate-400 min-h-[36px] mb-4">{PLANS.monthly.tagline}</p>

              {/* Pricing */}
              <div className="mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{PLANS.monthly.priceFormatted}</span>
                  <span className="text-xs font-medium text-slate-400">/ month</span>
                </div>
                <div className="text-xs text-teal-400 mt-1 font-semibold">
                  10,000 Tokens replenished monthly
                </div>
              </div>

              {/* Highlight Box */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">
                  Monthly Intelligence Capacity
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Up to 100 Comprehensive Reports</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Automated monthly renewal · Cancel anytime
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 mb-6 text-xs text-slate-300">
                {PLANS.monthly.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => handleInitiatePayment('monthly')}
                disabled={isProcessingPayment === 'monthly'}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition-all bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md hover:shadow-teal-500/20 cursor-pointer text-center flex items-center justify-center gap-1.5"
                id="btn-subscribe-monthly"
              >
                {isProcessingPayment === 'monthly' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching Checkout...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Subscribe for ₹1,999/month</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. ONE-TIME PAYMENT — ₹4,999 (30,000 Tokens) */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
              currentPlanId === 'oneTime'
                ? 'bg-slate-900/90 border-teal-500/60 shadow-lg shadow-teal-500/5 ring-1 ring-teal-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
            id="card-plan-onetime"
          >
            {currentPlanId === 'oneTime' ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500 text-slate-950 shadow-xs">
                Current Plan
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shadow-xs">
                No Auto-Debit
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">{PLANS.oneTime.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Pack
                </span>
              </div>

              <p className="text-xs text-slate-400 min-h-[36px] mb-4">{PLANS.oneTime.tagline}</p>

              {/* Pricing */}
              <div className="mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{PLANS.oneTime.priceFormatted}</span>
                  <span className="text-xs font-medium text-slate-400">/ one-time</span>
                </div>
                <div className="text-xs text-amber-400 mt-1 font-semibold">
                  30,000 Non-Expiring Tokens
                </div>
              </div>

              {/* Pack Detail Box */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">
                  Permanent Token Vault
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>300 Full Sales Intelligence Reports</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Tokens remain permanently in your wallet
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 mb-6 text-xs text-slate-300">
                {PLANS.oneTime.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => handleInitiatePayment('oneTime')}
                disabled={isProcessingPayment === 'oneTime'}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition-all bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                id="btn-purchase-onetime"
              >
                {isProcessingPayment === 'oneTime' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching Checkout...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Buy 30,000 Tokens — ₹4,999</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Payment History & Audit Ledger */}
        <div className="mt-14 max-w-4xl mx-auto bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm" id="section-payment-history">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold text-white">Payment & Billing History</h2>
            </div>
            <button
              onClick={fetchPayments}
              disabled={isLoadingPayments}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
              title="Refresh payment records"
              id="btn-refresh-payments"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPayments ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingPayments && paymentHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              <span>Loading payment history...</span>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950/40">
              <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-300">No Payment Records Found</div>
              <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Completed purchases and subscriptions through Razorpay will be cryptographically logged here with payment IDs, tokens credited, and timestamps.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 px-2">Date & Time</th>
                    <th className="pb-3 px-2">Plan</th>
                    <th className="pb-3 px-2">Amount</th>
                    <th className="pb-3 px-2">Tokens Credited</th>
                    <th className="pb-3 px-2">Payment ID</th>
                    <th className="pb-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paymentHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-2 font-semibold text-white">
                        {item.plan === 'monthly' ? 'Monthly Plan' : 'Token Pack'}
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-200">
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-emerald-400 font-bold">
                        +{item.tokensGranted.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-slate-400">
                        {item.razorpayPaymentId}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security & Architectural Transparency Footnote */}
        <div className="mt-10 max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 text-center text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-300 font-semibold text-sm">
            <Lock className="w-4 h-4 text-teal-400" />
            <span>Secure Razorpay Gateway Architecture (Test Mode)</span>
          </div>
          <p className="leading-relaxed">
            All Razorpay payment verifications and token credits occur exclusively server-side using cryptographic HMAC-SHA256 signatures, Firestore transactions with optimistic concurrency, and strict payment ledger auditability. Client browsers cannot tamper with balances.
          </p>
        </div>
      </div>
    </div>
  );
};
