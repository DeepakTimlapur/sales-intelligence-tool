import { SubscriptionPlan } from '../types';

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  badge?: string;
  price: number;
  currency: string;
  priceFormatted: string;
  billingPeriod: string;
  tokenAllocation: number;
  tokenAllocationFormatted: string;
  durationDays?: number;
  features: string[];
  highlight?: boolean;
  ctaText: string;
}

// Configurable pricing and allocation parameters
export const TRIAL_DURATION_DAYS = 30;
export const TRIAL_TOKEN_ALLOCATION = 3000;

export const MONTHLY_PRICE_INR = 1999;
export const MONTHLY_TOKEN_ALLOCATION = 10000;

export const ONETIME_PRICE_INR = 4999;
export const ONETIME_TOKEN_ALLOCATION = 30000;

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Always Free',
    tagline: 'Free forever starter access with on-demand token consumption.',
    price: 0,
    currency: '₹',
    priceFormatted: '₹0',
    billingPeriod: 'forever',
    tokenAllocation: 1000,
    tokenAllocationFormatted: '1,000 Starter Tokens',
    features: [
      '1,000 Starter Tokens credited upon registration',
      'Stab & Twist Objection Handlers (Hinglish & English)',
      '6KLH Leakage Methodology Quantification',
      'Client Mindset Probing Questions & Power Answers',
      'Section 43B(h) & Inaction Cost Sales Calculator',
      'Direct Dossier Export (PDF & Plain Text)'
    ],
    highlight: false,
    ctaText: 'Current Base Plan'
  },
  trial: {
    id: 'trial',
    name: 'Free 1-Month Trial',
    tagline: 'Full premium experience with a 30-day boosted token allowance.',
    badge: '30-Day Pass',
    price: 0,
    currency: '₹',
    priceFormatted: '₹0',
    billingPeriod: 'for 30 days',
    durationDays: TRIAL_DURATION_DAYS,
    tokenAllocation: TRIAL_TOKEN_ALLOCATION,
    tokenAllocationFormatted: '3,000 Trial Tokens',
    features: [
      '30-Day Full Access across all industries & deal sizes',
      '3,000 Trial Tokens instantly credited to account',
      'Generate up to 30 deep custom intelligence reports',
      'Priority Gemini processing response queue',
      'One-time trial activation per account',
      'Zero credit card required to start'
    ],
    highlight: false,
    ctaText: 'Activate 30-Day Free Trial'
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Payment',
    tagline: 'Continuous intelligence firepower for active closers & sales teams.',
    badge: 'Most Popular',
    price: MONTHLY_PRICE_INR,
    currency: '₹',
    priceFormatted: `₹${MONTHLY_PRICE_INR.toLocaleString()}`,
    billingPeriod: '/month',
    tokenAllocation: MONTHLY_TOKEN_ALLOCATION,
    tokenAllocationFormatted: '10,000 Tokens / mo',
    features: [
      '10,000 Tokens auto-replenished every billing month',
      'Generate up to 100 comprehensive sales dossiers / mo',
      'Advanced MSME & Corporate Buyer objection scripts',
      'VIP Gemini processing speed & zero throttling',
      'Roll-over unspent tokens into following month',
      'Cancel or modify renewal anytime with 1-click'
    ],
    highlight: true,
    ctaText: 'Subscribe for ₹1,999/month'
  },
  oneTime: {
    id: 'oneTime',
    name: 'One-Time Payment',
    tagline: 'Refill your token vault on demand without recurring subscriptions.',
    badge: 'No Subscription',
    price: ONETIME_PRICE_INR,
    currency: '₹',
    priceFormatted: `₹${ONETIME_PRICE_INR.toLocaleString()}`,
    billingPeriod: 'one-time',
    tokenAllocation: ONETIME_TOKEN_ALLOCATION,
    tokenAllocationFormatted: '30,000 Non-Expiring Tokens',
    features: [
      '30,000 Tokens added permanently to your balance',
      'Generate up to 300 comprehensive intelligence reports',
      'Tokens never expire or get forfeited',
      'No recurring auto-debit or hidden renewals',
      'Instant balance credit upon transaction confirmation',
      'Can be purchased repeatedly as needed'
    ],
    highlight: false,
    ctaText: 'Buy 30,000 Tokens — ₹4,999'
  }
};

/**
 * Utility to calculate remaining trial time and expiry status.
 */
export function calculateRemainingTrialDays(trialEndDate: string | null | undefined): {
  isExpired: boolean;
  daysLeft: number;
  formatted: string;
} {
  if (!trialEndDate) {
    return { isExpired: false, daysLeft: 0, formatted: '' };
  }

  const endMs = new Date(trialEndDate).getTime();
  const nowMs = Date.now();
  const diffMs = endMs - nowMs;

  if (diffMs <= 0 || isNaN(diffMs)) {
    return { isExpired: true, daysLeft: 0, formatted: 'Expired' };
  }

  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    isExpired: false,
    daysLeft,
    formatted: daysLeft === 1 ? '1 Day Left' : `${daysLeft} Days Left`
  };
}

/**
 * Returns formatted plan badge text for UserBar.
 */
export function formatPlanBadgeText(
  plan: SubscriptionPlan | string | undefined,
  trialEndDate?: string | null
): string {
  const planKey = (plan || 'free') as SubscriptionPlan;
  if (planKey === 'trial') {
    const { isExpired, daysLeft } = calculateRemainingTrialDays(trialEndDate);
    if (isExpired) {
      return 'TRIAL EXPIRED';
    }
    return `TRIAL — ${daysLeft} ${daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT`;
  }
  if (planKey === 'monthly') {
    return 'MONTHLY PLAN';
  }
  if (planKey === 'oneTime') {
    return 'ONE-TIME PLAN';
  }
  return 'FREE PLAN';
}
