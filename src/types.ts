export interface SixKLHBreakdown {
  kab_kab: string;      // When does it hit?
  kahan_kahan: string;  // Where is it leaking?
  kitna_kitna: string;  // How much hard cash lost?
}

export interface ObjectionItem {
  objection: string;
  stab: string;
  twist: string;
  six_klh_breakdown?: SixKLHBreakdown;
  closing_offer_pitch?: string;
}

export interface ObjectionCategory {
  category: string;
  items: ObjectionItem[];
}

export interface ClientQuestionItem {
  question: string;
  why_they_ask: string;
  power_answer_hint: string;
}

export interface ClientQuestionCategory {
  category: string;
  items: ClientQuestionItem[];
}

export interface SalesReport {
  summary: string;
  objections: ObjectionCategory[];
  client_questions: ClientQuestionCategory[];
}

export interface GenerateSalesInfoRequest {
  product: string;
  targetIndustry: string;
  businessModel?: string;
  dealSize?: string;
  buyerProfile?: string;
  additionalContext?: string;
}

export interface CoachNote {
  title: string;
  quote: string;
}

export type SubscriptionPlan = 'free' | 'trial' | 'monthly' | 'oneTime';
export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'cancelled' | 'free';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  plan: SubscriptionPlan;
  tokenBalance: number;
  subscriptionStatus: SubscriptionStatus;
  monthlyTokenAllocation: number | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  hasUsedTrial: boolean;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  billingCycle: string | null;
  paymentProvider: string | null;
  paymentCustomerId: string | null;
  paymentSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TokenTransaction {
  id?: string;
  uid: string;
  type: 'usage' | 'credit' | 'trial_grant' | 'monthly_grant' | 'purchase_grant';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  referenceId?: string;
}

export interface PaymentRecord {
  id: string;
  uid: string;
  plan: SubscriptionPlan;
  provider: 'razorpay';
  razorpayOrderId?: string | null;
  razorpayPaymentId: string;
  razorpaySubscriptionId?: string | null;
  amount: number;
  currency: string;
  status: 'captured' | 'active' | 'cancelled' | 'failed';
  tokensGranted: number;
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string;
}

export type TranscriptFileType = 'txt' | 'srt' | 'vtt';

export interface Transcript {
  id: string;
  title: string;
  fileName: string;
  fileType: TranscriptFileType;
  uploadedBy: string;
  uploadedAt: string;
  status: 'processed' | 'processing' | 'failed';
  chunkCount: number;
  wordCount: number;
  summary: string;
}

export interface TranscriptChunk {
  id: string;
  transcriptId: string;
  title: string;
  content: string;
  chunkIndex: number;
  createdAt: string;
  relevanceScore?: number;
}

export interface KnowledgeRetrievalResult {
  chunks: TranscriptChunk[];
  promptContext: string;
  matchedCount: number;
}
