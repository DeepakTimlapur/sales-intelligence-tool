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
