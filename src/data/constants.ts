import { CoachNote, SalesReport } from '../types';

export const BUSINESS_MODELS = [
  "B2B",
  "B2C",
  "B2B2C",
  "Institutional / Govt",
  "Export / OEM",
  "Distribution / Retail",
  "Franchise",
  "Manufacturing"
];

export const DEAL_SIZES = [
  "Under ₹1 Lakh",
  "₹1 Lakh–₹5 Lakh",
  "₹5 Lakh–₹20 Lakh",
  "₹20 Lakh–₹1 Crore",
  "₹1 Crore+",
  "Varies widely"
];

export const BUYER_PROFILES = [
  "Business owner / entrepreneur",
  "CEO / C-suite",
  "Procurement manager",
  "Individual consumer",
  "Department head / VP",
  "Govt / institutional buyer"
];

export const COACH_NOTES: CoachNote[] = [
  {
    title: "Analyzing the Blindspots",
    quote: "The prospect's silence is not a rejection; it is an unvoiced doubt that they are waiting for you to call out."
  },
  {
    title: "Preparing the Stab & Twist Strategy",
    quote: "First, you must show them the bleeding wound they already have. Then, you show them how it turns fatal if ignored."
  },
  {
    title: "Mapping High-Ticket Buyer Fears",
    quote: "Before a high-ticket buyer drops six figures, they aren't looking at your features. They're scanning for risk."
  },
  {
    title: "Formulating Live Calculations",
    quote: "Numbers do not negotiate. When you quantify the cost of inaction, you remove the luxury of delaying."
  }
];

export const SAMPLE_REPORT: SalesReport = {
  summary: `Selling B2B enterprise solutions in traditional Indian manufacturing & distribution suffers from high buyer hesitation. Indian decision-makers are risk-averse default negotiators ("Bhav-taav"). Deploying Manuj Bajaj's 6KLH methodology highlights their passive leakages, opening the budget directly.`,
  objections: [
    {
      category: "Price & Negotiations (Bhav-taav)",
      items: [
        {
          objection: "Bhaiya budget bilkul nahi hai, 40% discount do tabhi aage baat karenge!",
          stab: "Yeh discount aap save nahi kar rahe hain, balki har mahine machinery lag aur resource wastage se isse dugna dhandha leak ho raha hai.",
          twist: "Agar agle 6 mahine me yeh process control nahi lagaya, toh competitor aapse bohot aage nikal jayega. Aaj ₹3 Lakh bachaakar salana ₹24 Lakh ka continuous financial loss jhelna Lala dhandhe ki sabse badi galti hai!",
          six_klh_breakdown: {
            kab_kab: "Har din transition shifts, material weighing aur audit entry ke waqt...",
            kahan_kahan: "Factory production yield loss aur logbook tracking bottlenecks...",
            kitna_kitna: "₹1.5 Lakh lost due to reconciliation mismatch and logistics delays month-on-month."
          },
          closing_offer_pitch: "Offer them the Section 43B(h)-friendly trial: minimal initial authorization check, balancing milestone disbursements inside 60-day terms."
        },
        {
          objection: "Abhi market bohot mandha chal raha hai, Diwali baad dekhte hain.",
          stab: "Market tight hai toh inefficiency jhelna sabse bada bura dhandha hai. Har ek bachta hua rupya aapka direct profit hai.",
          twist: "Aap jab tak 4 mahine delay karenge, tab tak badhte steel/raw material parameters se leakage aur badh jayegi. Aaj contract freeze karne se aap poorane scale rate par upgrade ho payenge.",
          six_klh_breakdown: {
            kab_kab: "Agle quarter financial auditing and supplier checkout...",
            kahan_kahan: "Excess buffer inventory holdings and manual double-bill handling...",
            kitna_kitna: "₹80K blockages weekly. Cumulative ₹3.2 Lakh over the seasonal delay!"
          },
          closing_offer_pitch: "Secure today's competitive baseline price with a 15% booking deposit. Balance AMC schedules activate post-implementation next year."
        }
      ]
    },
    {
      category: "Trust & Credibility",
      items: [
        {
          objection: "Nayi startup company lagti hai, purana vendor safe hai hamare liye.",
          stab: "Purane vendor reliable ho sakte hain, par kya unka modular technology badhte modern sales compliance constraints me fit hota hai?",
          twist: "Custom updates ke naam par purane vendor double bill lagate hain, jisse maintenance overheads 3x badh jaati hai. Hum instant backup cloud coverage dete hain jisse down-time flat zero ho jata hai.",
          six_klh_breakdown: {
            kab_kab: "Billing database synchronization and weekly server errors...",
            kahan_kahan: "Sales registers, customer support queries and client satisfaction indicators...",
            kitna_kitna: "₹45,000 direct recovery charges per developer intervention."
          },
          closing_offer_pitch: "100% SLA uptime contract verified directly, with refund clauses matching client system uptime targets."
        }
      ]
    },
    {
      category: "Timing / Lazy delay (Baad me dekhenge)",
      items: [
        {
          objection: "Concept toh behtareen hai bhaiya, par agale saal budget me scope add karenge.",
          stab: "Decision agle saal par chodna normal lagta hai, par daily leaking money agle saal ka wait nahi karegi, vo daily girti rahegi.",
          twist: "12 mahine ke delay ka seedha matlab hai andha dhundh leakage. Yeh leakage direct aapke net post-tax profit se cut hota hai. Kya aap such me agle saal ₹18 Lakh waste karne ke liye tyar hain?",
          six_klh_breakdown: {
            kab_kab: "Har mahine ki 20 tarikh ko GST input tax credit matching ke dauran...",
            kahan_kahan: "Unreconciled ledger items and delayed buyer receivables...",
            kitna_kitna: "₹1.5 Lakh minimum hidden mismatch overhead per delayed quarter."
          },
          closing_offer_pitch: "Rapid 15-day implementation pilot layout. Verify the leak recovery rate before committing to future annual billing."
        }
      ]
    },
    {
      category: "Local Competition / 'Local vendor sasta hai'",
      items: [
        {
          objection: "Local log mast saste me manually karke de rahe hain.",
          stab: "Local sasta lagta hai block me, par kya scale aur safety errors aane par local support available hota hai?",
          twist: "Dhandha grow karega tab aur constraints aayenge. Local system scale nahi ho payega, tab system badalne me teen guna zyada kharcha aur compliance loss ho jayega.",
          six_klh_breakdown: {
            kab_kab: "Peak production cycles and seasonal bulk orders...",
            kahan_kahan: "System storage limitations and data integrity lapses...",
            kitna_kitna: "₹2.5 Lakh immediate backup replacement development packages."
          },
          closing_offer_pitch: "Hardware-only price match with premium complimentary 1-year transition operations SLA support."
        }
      ]
    }
  ],
  client_questions: [
    {
      category: "Direct Financials & ROI",
      items: [
        {
          question: "Iska clear ROI proof milega? Kitne din me poora paisa vasool ho jayega?",
          why_they_ask: "Indian Lala/MSME mindset values direct cash collection returns before authorizing expenditures.",
          power_answer_hint: "Within 4 months maximum. We establish the audit control mapping showing ₹1.5L leakage reduced directly to ₹15K, returning the total layout value before your second quarter cycle."
        }
      ]
    },
    {
      category: "Implementation disruption & downtime in India",
      items: [
        {
          question: "Naye setup ke time factory/ofice kaam toh nahi rukega? Nuksaan nahi hona chahiye!",
          why_they_ask: "Anxiety of temporary process blockages affecting delivery relations with key domestic clients.",
          power_answer_hint: "Zero operational downtime guarantee – migrating redundant logs in offsite night blocks, with instant rollback safety layers."
        }
      ]
    }
  ]
};
