import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { REPORT_TOKEN_COST } from "./src/data/constants";
import {
  verifyFirebaseToken,
  getUserTokenState,
  deductTokensAtomic,
  activateTrialAtomic,
  recordPaymentAndCreditTokensAtomic,
  getUserPayments,
  getSystemServerAuthToken,
  findUserBySubscriptionId,
  updateSubscriptionStatusAtomic,
  recordFailedPayment
} from "./src/lib/serverFirebase";
import {
  isAuthorizedAdmin,
  parseTranscriptText,
  chunkTranscript,
  loadCache,
  saveCache,
  syncTranscriptToFirestore,
  deleteTranscriptFromFirestore,
  retrieveRelevantKnowledge
} from "./src/lib/ragService";
import { Transcript, TranscriptFileType, KnowledgeRetrievalResult } from "./src/types";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Capture raw body buffer for Razorpay webhook HMAC verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  })
);

// Lazy-initialized Razorpay client (Test Mode supported)
let razorpayClient: Razorpay | null = null;
function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id, key_secret });
  }
  return razorpayClient;
}

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

app.post("/api/generate-sales-info", async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Authenticate Request via Firebase ID Token
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);

    if (!user || !idToken) {
      res.status(401).json({
        error: authError || "Authentication required. Please sign in to generate reports."
      });
      return;
    }

    // 2. Validate input fields
    const {
      product,
      targetIndustry,
      businessModel,
      dealSize,
      buyerProfile,
      additionalContext
    } = req.body;

    if (!product || !targetIndustry) {
      res.status(400).json({ error: "Product and Target Industry are required fields." });
      return;
    }

    // 3. Verify user token balance before calling Gemini
    const userState = await getUserTokenState(idToken, user.uid, user.email);
    if (!userState) {
      res.status(500).json({ error: "Could not retrieve user account from database." });
      return;
    }

    if (userState.tokenBalance < REPORT_TOKEN_COST) {
      res.status(403).json({
        error: "You need at least 100 tokens to generate a report.",
        tokenBalance: userState.tokenBalance,
        cost: REPORT_TOKEN_COST
      });
      return;
    }

    const ai = getGemini();
    let reportData: any = null;

    if (!ai) {
      // Structured fallback report if GEMINI_API_KEY is not configured yet
      reportData = {
        summary: `Strategic analysis for ${product} in the ${targetIndustry} sector (${businessModel || "B2B"}). Indian decision-makers are inherently risk-averse default negotiators. Deploying Manuj Bajaj's 6KLH methodology highlights their passive leakages and converts status-quo inertia into high-urgency buying action.`,
        objections: [
          {
            category: "Price & Negotiations (Bhav-taav)",
            items: [
              {
                objection: `Bhaiya ${product} ka budget bilkul nahi hai, 35% discount do tabhi aage baat karenge!`,
                stab: `Yeh discount aap save nahi kar rahe hain, balki har mahine ${targetIndustry} operations aur resource wastage se isse dugna dhandha leak ho raha hai.`,
                twist: `Agar agle 6 mahine me yeh solution implement nahi kiya, toh competitors aapse aage nikal jayenge. Aaj thoda bachaakar salana 10x ka continuous financial loss jhelna Lala dhandhe ki sabse badi galti hai!`,
                six_klh_breakdown: {
                  kab_kab: "Har din transition shifts, material usage aur audit entry ke waqt...",
                  kahan_kahan: `${targetIndustry} operational bottlenecks aur manual reconciliation mismatches...`,
                  kitna_kitna: "Significant operational overheads and margin leaks month-on-month."
                },
                closing_offer_pitch: "Offer them the Section 43B(h)-friendly trial: minimal initial authorization check, balancing milestone disbursements inside 60-day terms."
              },
              {
                objection: "Abhi market bohot mandha chal raha hai, Diwali baad dekhte hain.",
                stab: `Market tight hai toh inefficiency jhelna sabse bura dhandha hai. Har ek bachta hua rupya aapka direct bottom-line profit hai.`,
                twist: `Aap jab tak 4 mahine delay karenge, tab tak operational leakage aur badh jayegi. Aaj contract freeze karne se aap purani baseline pricing lock kar payenge.`,
                six_klh_breakdown: {
                  kab_kab: "Agle financial quarter supplier checkout and inventory audit...",
                  kahan_kahan: "Excess buffer inventory holdings and manual double-handling...",
                  kitna_kitna: "High cumulative cost of delay over the seasonal downtime!"
                },
                closing_offer_pitch: "Secure today's competitive baseline price with a 15% booking deposit. Balance implementation schedules activate post-quarter."
              }
            ]
          },
          {
            category: "Trust & Credibility",
            items: [
              {
                objection: "Nayi company lagti hai, purana vendor safe hai hamare liye.",
                stab: `Purane vendor reliable ho sakte hain, par kya unka traditional approach modern ${targetIndustry} market speed me fit hota hai?`,
                twist: "Custom updates ke naam par purane vendor double bill lagate hain, jisse overheads badh jaati hai. Hum clear SLA backing aur continuous performance guarantee dete hain.",
                six_klh_breakdown: {
                  kab_kab: "Quarterly reviews and unexpected emergency breakdowns...",
                  kahan_kahan: "Workflow dependencies and delayed resolution tickets...",
                  kitna_kitna: "Heavy downtime impact per delayed incident."
                },
                closing_offer_pitch: "100% SLA uptime contract verified directly, with milestone performance checkpoints."
              }
            ]
          },
          {
            category: "Timing / Lazy delay (Baad me dekhenge)",
            items: [
              {
                objection: "Concept toh behtareen hai bhaiya, par agale saal budget me scope add karenge.",
                stab: "Decision agle saal par chodna aasan lagta hai, par daily leaking money agle saal ka wait nahi karegi, vo daily girti rahegi.",
                twist: "12 mahine ke delay ka seedha matlab hai andha dhundh leakage. Yeh leakage direct aapke net profit se cut hota hai.",
                six_klh_breakdown: {
                  kab_kab: "Har mahine end reconciliation cycle ke dauran...",
                  kahan_kahan: "Unreconciled ledger items and delayed buyer receivables...",
                  kitna_kitna: "Compounding monthly losses that exceed the investment cost!"
                },
                closing_offer_pitch: "Rapid 15-day implementation pilot layout. Verify the leak recovery rate before committing to annual scale."
              }
            ]
          },
          {
            category: "Local Competition / 'Local vendor sasta hai'",
            items: [
              {
                objection: "Local log mast saste me manually karke de rahe hain.",
                stab: "Local sasta lagta hai pehle, par kya scale aur emergency errors aane par local support available hota hai?",
                twist: "Dhandha grow karega tab aur constraints aayenge. Local system scale nahi ho payega, tab system badalne me teen guna zyada kharcha ho jayega.",
                six_klh_breakdown: {
                  kab_kab: "Peak production cycles and seasonal bulk orders...",
                  kahan_kahan: "System limitations and data integrity lapses...",
                  kitna_kitna: "Costly emergency patches and delayed execution cycles."
                },
                closing_offer_pitch: "Modular onboarding package with dedicated 1-year transition operations SLA support."
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
                why_they_ask: "Indian MSME / enterprise mindset values direct cash collection returns before authorizing expenditures.",
                power_answer_hint: "Within 3-4 months maximum. We establish benchmark metrics showing direct waste reduction, recovering the complete investment before the second quarter."
              }
            ]
          },
          {
            category: "Implementation disruption & downtime in India",
            items: [
              {
                question: "Naye setup ke time business/office kaam toh nahi rukega? Nuksaan nahi hona chahiye!",
                why_they_ask: "Anxiety of temporary process blockages affecting delivery relations with key clients.",
                power_answer_hint: "Zero operational downtime guarantee – parallel shadow deployment with instant rollback safety layers."
              }
            ]
          }
        ]
      };
    }

    // Retrieve relevant client video transcript knowledge via RAG
    let ragResult: KnowledgeRetrievalResult = { chunks: [], promptContext: "", matchedCount: 0 };
    try {
      ragResult = retrieveRelevantKnowledge({
        product,
        targetIndustry,
        businessModel,
        dealSize,
        buyerProfile,
        additionalContext
      });
    } catch (ragErr) {
      console.warn("The analysis completed, but transcript knowledge was temporarily unavailable:", ragErr);
    }

    const prompt = `
You are Manuj Bajaj, renowned Indian B2B sales coach, Amazon bestselling author of 26 books, and creator of the Stab & Twist and 6KLH sales objection handling methodologies.

Generate a comprehensive, actionable, high-conversion sales intelligence report tailored for the Indian business context (with natural Hinglish flavor where appropriate for the Indian B2B/Lala-ji/MSME mindset).
${ragResult.promptContext ? `\n${ragResult.promptContext}\n` : ""}
PROSPECT PROFILE:
- Product/Service being sold: ${product}
- Target Industry: ${targetIndustry}
- Business Model: ${businessModel || "B2B"}
- Estimated Deal Size: ${dealSize || "₹5 Lakh–₹20 Lakh"}
- Buyer Profile: ${buyerProfile || "Business owner / entrepreneur"}
- Additional Context: ${additionalContext || "None provided"}

METHODOLOGY INSTRUCTIONS:
1. "Stab & Twist":
   - Stab: Expose the prospect's bleeding wound that they are trying to hide or normalize.
   - Twist: Rotate the dagger by calculating the devastating compounding cost of continuing inaction.
2. "6KLH Method": "Kab Kab, Kahan Kahan, Kitna Kitna Loss Hoga"
   - Kab Kab: Specific recurring triggers and moments when inefficiency bites.
   - Kahan Kahan: Exact department, process, or ledger leakage.
   - Kitna Kitna: Tangible estimated financial loss in Indian Rupees (₹).
3. "Closing Offer Pitch": High-leverage risk-reversal or timing incentive to seal the deal.
4. "Client Questions": Underlying skeptical fears and power response strategies.

Generate at least 4 objection categories (e.g. Price & Negotiations (Bhav-taav), Trust & Credibility, Timing / Lazy delay (Baad me dekhenge), Local Competition) with 1-2 sharp objection items each, plus 2 client question categories.

Return ONLY a valid JSON object strictly matching this schema:
{
  "summary": "High-level strategic sales analysis summary paragraph",
  "objections": [
    {
      "category": "Category Name",
      "items": [
        {
          "objection": "The exact objection phrase in Hindi/Hinglish or English",
          "stab": "Bleeding stab exposing current hidden pain",
          "twist": "Compounding twist revealing devastating cost of inaction",
          "six_klh_breakdown": {
            "kab_kab": "When inefficiency strikes...",
            "kahan_kahan": "Where the leak happens...",
            "kitna_kitna": "Quantified rupee loss amount..."
          },
          "closing_offer_pitch": "Actionable closing deal angle or risk reversal"
        }
      ]
    }
  ],
  "client_questions": [
    {
      "category": "Category Name",
      "items": [
        {
          "question": "The probing question the prospect asks",
          "why_they_ask": "The underlying fear or skeptical mindset",
          "power_answer_hint": "The coach response protocol"
        }
      ]
    }
  ]
}
`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response generated by Gemini model.");
      }

      reportData = JSON.parse(responseText);
    }

    if (!reportData || !reportData.objections) {
      throw new Error("Failed to formulate a valid structured sales report.");
    }

    // 4. Report is successfully generated and verified. Now perform atomic token deduction.
    const referenceId = `rep_${Date.now()}`;
    const deductionResult = await deductTokensAtomic(
      idToken,
      user.uid,
      userState.tokenBalance,
      REPORT_TOKEN_COST,
      userState.updateTime,
      referenceId
    );

    if (!deductionResult.success) {
      res.status(403).json({
        error: deductionResult.error || "Token deduction failed.",
        tokenBalance: deductionResult.newBalance
      });
      return;
    }

    // 5. Return the report alongside the confirmed updated balance
    res.json({
      ...reportData,
      _tokenBalance: deductionResult.newBalance,
      _transactionId: referenceId,
      _knowledgeUsed: ragResult.matchedCount
    });
  } catch (error: any) {
    console.error("Error in /api/generate-sales-info:", error);
    res.status(500).json({ error: error.message || "Failed to generate sales report." });
  }
});

/**
 * Server-authoritative endpoint to activate a 30-Day Free Trial.
 * Guarantees:
 * - Strict Firebase ID token authentication.
 * - One-time trial activation per account (rejects repeats).
 * - Sets 30-day window and credits trial token allocation atomically.
 */
app.post("/api/activate-trial", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);

    if (!user || !idToken) {
      res.status(401).json({
        error: authError || "Authentication required. Please sign in to activate your free trial."
      });
      return;
    }

    const result = await activateTrialAtomic(idToken, user.uid);
    if (!result.success) {
      res.status(400).json({ error: result.error || "Failed to activate 30-day free trial." });
      return;
    }

    res.json({
      success: true,
      message: "30-Day Free Trial activated successfully! Trial tokens have been credited to your balance.",
      plan: result.plan,
      subscriptionStatus: result.subscriptionStatus,
      tokenBalance: result.tokenBalance,
      trialStartDate: result.trialStartDate,
      trialEndDate: result.trialEndDate
    });
  } catch (error: any) {
    console.error("Error in /api/activate-trial:", error);
    res.status(500).json({ error: error.message || "Failed to process trial activation." });
  }
});

/**
 * Payment gateway placeholder endpoint (retained for backward compatibility).
 */
app.post("/api/subscription/placeholder", async (req: Request, res: Response): Promise<void> => {
  const { planId } = req.body;
  res.json({
    success: false,
    isPlaceholder: true,
    planId: planId || "unknown",
    message: "Razorpay payment integration is active. Please use the direct checkout options on the pricing page."
  });
});

/**
 * Razorpay: Create Order for One-Time Token Pack (₹4,999 / 30,000 Tokens)
 */
app.post("/api/razorpay/create-order", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);

    if (!user || !idToken) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      res.status(500).json({
        error: "Razorpay credentials are not configured on the server. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      });
      return;
    }

    // Amount in paise: ₹4,999 * 100 = 499900 paise
    const amountInPaise = 499900;
    const shortUid = user.uid.substring(0, 8);
    const receipt = `rcpt_one_${Date.now().toString().slice(-6)}_${shortUid}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        uid: user.uid,
        email: user.email || "",
        plan: "oneTime",
        tokensGranted: "30000"
      }
    });

    const publicRazorpayKey = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicRazorpayKey,
      plan: "oneTime",
      tokens: 30000
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: error.message || "Failed to create Razorpay payment order." });
  }
});

/**
 * Razorpay: Create Subscription for Monthly Plan (₹1,999/month / 10,000 Tokens)
 */
app.post("/api/razorpay/create-subscription", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);

    if (!user || !idToken) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      res.status(500).json({
        error: "Razorpay credentials are not configured on the server. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      });
      return;
    }

    const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
    if (!planId) {
      res.status(400).json({
        error: "Razorpay Monthly Plan ID is not configured (missing RAZORPAY_MONTHLY_PLAN_ID). Please create a ₹1,999/month plan in your Razorpay Dashboard and set the plan ID in environment variables."
      });
      return;
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        uid: user.uid,
        email: user.email || "",
        plan: "monthly",
        tokensGranted: "10000"
      }
    });

    const publicRazorpayKey = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    res.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: publicRazorpayKey,
      plan: "monthly",
      tokens: 10000
    });
  } catch (error: any) {
    console.error("Error creating Razorpay subscription:", error);
    res.status(500).json({ error: error.message || "Failed to create Razorpay subscription." });
  }
});

/**
 * Razorpay: Server-Side Cryptographic Payment Verification and Atomic Token Crediting
 */
app.post("/api/razorpay/verify-payment", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);

    if (!user || !idToken) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }

    const razorpay = getRazorpay();
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpay || !keySecret) {
      res.status(500).json({ error: "Razorpay server configuration is missing." });
      return;
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan
    } = req.body;

    if (!razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: "Missing required Razorpay payment confirmation parameters." });
      return;
    }

    // 1. ONE-TIME PAYMENT VERIFICATION
    if (razorpay_order_id) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.error("One-Time payment signature mismatch!", {
          generated: generatedSignature,
          received: razorpay_signature
        });
        res.status(400).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Fetch payment details from Razorpay to verify amount, currency, order association, and status
      const paymentDetails: any = await razorpay.payments.fetch(razorpay_payment_id);
      if (!paymentDetails) {
        res.status(400).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Verify order association
      if (paymentDetails.order_id && paymentDetails.order_id !== razorpay_order_id) {
        console.error("Razorpay order ID mismatch:", {
          expected: razorpay_order_id,
          actual: paymentDetails.order_id
        });
        res.status(400).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Verify user account association
      if (paymentDetails.notes?.uid && paymentDetails.notes.uid !== user.uid) {
        console.error("User ownership mismatch on payment:", {
          orderUid: paymentDetails.notes.uid,
          currentUid: user.uid
        });
        res.status(403).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Verify payment currency: Expected 'INR'
      if (paymentDetails.currency !== "INR") {
        console.error(`Invalid payment currency: ${paymentDetails.currency}`);
        res.status(400).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Verify payment amount: ₹4,999 = 499900 paise
      if (paymentDetails.amount !== 499900) {
        console.error(`Payment amount mismatch: Expected 499900, got ${paymentDetails.amount}`);
        res.status(400).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // If authorized but not yet captured, auto-capture
      if (paymentDetails.status === "authorized") {
        await razorpay.payments.capture(razorpay_payment_id, 499900, "INR");
      } else if (paymentDetails.status !== "captured") {
        console.error(`Unexpected payment status: ${paymentDetails.status}`);
        res.status(400).json({
          error: "Payment could not be verified. No tokens were credited."
        });
        return;
      }

      // Perform atomic idempotent Firestore credit
      const creditResult = await recordPaymentAndCreditTokensAtomic(idToken, user.uid, {
        plan: "oneTime",
        amount: 4999,
        tokensToCredit: 30000,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        idempotencyKey: `pay_${razorpay_payment_id}`
      });

      if (!creditResult.success) {
        res.status(500).json({ error: creditResult.error || "Payment could not be verified. No tokens were credited." });
        return;
      }

      res.json({
        success: true,
        alreadyProcessed: creditResult.alreadyProcessed || false,
        message: "Payment verified successfully! 30,000 tokens have been credited to your balance.",
        plan: creditResult.plan || "oneTime",
        subscriptionStatus: creditResult.subscriptionStatus || "active",
        tokenBalance: creditResult.newBalance,
        tokensGranted: 30000,
        paymentId: razorpay_payment_id
      });
      return;
    }

    // 2. SUBSCRIPTION PAYMENT VERIFICATION
    if (razorpay_subscription_id) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.error("Subscription payment signature mismatch!", {
          generated: generatedSignature,
          received: razorpay_signature
        });
        res.status(400).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Fetch subscription from Razorpay
      const subscriptionDetails: any = await razorpay.subscriptions.fetch(razorpay_subscription_id);
      if (!subscriptionDetails) {
        res.status(400).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Verify user association if present in subscription notes
      if (subscriptionDetails.notes?.uid && subscriptionDetails.notes.uid !== user.uid) {
        console.error("Subscription user mismatch:", {
          subUid: subscriptionDetails.notes.uid,
          userUid: user.uid
        });
        res.status(403).json({ error: "Payment could not be verified. No tokens were credited." });
        return;
      }

      // Perform atomic idempotent Firestore credit
      const creditResult = await recordPaymentAndCreditTokensAtomic(idToken, user.uid, {
        plan: "monthly",
        amount: 1999,
        tokensToCredit: 10000,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySubscriptionId: razorpay_subscription_id,
        idempotencyKey: `sub_${razorpay_payment_id}`
      });

      if (!creditResult.success) {
        res.status(500).json({ error: creditResult.error || "Payment could not be verified. No tokens were credited." });
        return;
      }

      res.json({
        success: true,
        alreadyProcessed: creditResult.alreadyProcessed || false,
        message: "Monthly Subscription activated! 10,000 monthly tokens credited to your balance.",
        plan: "monthly",
        subscriptionStatus: "active",
        tokenBalance: creditResult.newBalance,
        tokensGranted: 10000,
        paymentId: razorpay_payment_id,
        subscriptionId: razorpay_subscription_id
      });
      return;
    }

    res.status(400).json({
      error: "Invalid request: Neither razorpay_order_id nor razorpay_subscription_id was provided."
    });
  } catch (error: any) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ error: "Payment could not be verified. No tokens were credited." });
  }
});

/**
 * Razorpay: Webhook Verification Endpoint
 * Validates X-Razorpay-Signature using RAZORPAY_WEBHOOK_SECRET and raw request body.
 * Authoritatively handles recurring monthly charges, token allocation, and subscription lifecycle events.
 */
app.post("/api/razorpay/webhook", async (req: Request, res: Response): Promise<void> => {
  const webhookSignature = req.headers["x-razorpay-signature"] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
    res.status(200).json({ status: "skipped", reason: "Webhook secret not configured" });
    return;
  }

  const rawBodyBuffer = (req as any).rawBody;
  if (!rawBodyBuffer || !webhookSignature) {
    res.status(400).json({ error: "Missing raw body or X-Razorpay-Signature header." });
    return;
  }

  const generatedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBodyBuffer)
    .digest("hex");

  if (generatedSignature !== webhookSignature) {
    console.error("Invalid Razorpay webhook signature!");
    res.status(400).json({ error: "Invalid webhook signature." });
    return;
  }

  const event = req.body;
  const eventType = event.event;
  console.log(`Verified Razorpay Webhook received: ${eventType}`);

  try {
    const systemToken = await getSystemServerAuthToken();
    if (!systemToken) {
      console.error("Could not obtain system auth token for webhook processing.");
      res.status(500).json({ error: "Internal server authentication error" });
      return;
    }

    switch (eventType) {
      // 1. Recurring Monthly Subscription Charged
      case "subscription.charged": {
        const payment = event.payload?.payment?.entity;
        const subscription = event.payload?.subscription?.entity;

        if (!payment || !subscription) {
          console.warn("subscription.charged missing payment or subscription entity.");
          break;
        }

        const subscriptionId = subscription.id;
        const paymentId = payment.id;
        // Deterministic idempotency key per payment charge
        const idempotencyKey = `sub_charge_${paymentId}`;

        // Find user UID: check subscription notes, payment notes, or query by subscriptionId in Firestore
        let targetUid = subscription.notes?.uid || payment.notes?.uid;
        if (!targetUid) {
          targetUid = await findUserBySubscriptionId(systemToken, subscriptionId);
        }

        if (!targetUid) {
          console.warn(`Could not determine target user UID for subscription ${subscriptionId}`);
          break;
        }

        console.log(`Processing subscription.charged for user ${targetUid}, payment ${paymentId}`);
        const creditResult = await recordPaymentAndCreditTokensAtomic(systemToken, targetUid, {
          plan: "monthly",
          amount: Math.round((payment.amount || 199900) / 100),
          tokensToCredit: 10000,
          razorpayPaymentId: paymentId,
          razorpaySubscriptionId: subscriptionId,
          idempotencyKey
        });

        if (creditResult.alreadyProcessed) {
          console.log(`Recurring charge ${paymentId} already processed (idempotent skipped).`);
        } else if (creditResult.success) {
          console.log(`Successfully credited 10,000 recurring tokens to user ${targetUid}`);
        } else {
          console.error(`Failed to credit recurring tokens: ${creditResult.error}`);
        }
        break;
      }

      // 2. One-Time Payment Captured or Order Paid
      case "payment.captured":
      case "order.paid": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const plan = payment.notes?.plan;
        const targetUid = payment.notes?.uid;

        // Only handle one-time token pack purchases asynchronously if not already handled by client verify
        if (plan === "oneTime" && targetUid && payment.amount === 499900) {
          const paymentId = payment.id;
          const orderId = payment.order_id;
          const idempotencyKey = `pay_${paymentId}`;

          console.log(`Processing webhook payment.captured for oneTime pack: user ${targetUid}`);
          const creditResult = await recordPaymentAndCreditTokensAtomic(systemToken, targetUid, {
            plan: "oneTime",
            amount: 4999,
            tokensToCredit: 30000,
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            idempotencyKey
          });

          if (creditResult.alreadyProcessed) {
            console.log(`Payment ${paymentId} already processed (idempotent).`);
          } else if (creditResult.success) {
            console.log(`Successfully credited 30,000 tokens via webhook for user ${targetUid}`);
          }
        }
        break;
      }

      // 3. Payment Failed
      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const targetUid = payment.notes?.uid;
        if (targetUid) {
          console.warn(`Payment failed recorded for user ${targetUid}: payment ${payment.id}`);
          await recordFailedPayment(systemToken, targetUid, {
            paymentId: payment.id,
            orderId: payment.order_id,
            subscriptionId: payment.subscription_id,
            amount: Math.round((payment.amount || 0) / 100),
            errorDescription: payment.error_description || "Payment failed at gateway"
          });
        }
        break;
      }

      // 4. Subscription Cancelled
      case "subscription.cancelled": {
        const subscription = event.payload?.subscription?.entity;
        if (!subscription) break;

        let targetUid = subscription.notes?.uid;
        if (!targetUid) {
          targetUid = await findUserBySubscriptionId(systemToken, subscription.id);
        }

        if (targetUid) {
          console.log(`Setting subscription status to 'cancelled' for user ${targetUid}`);
          await updateSubscriptionStatusAtomic(systemToken, targetUid, "cancelled");
        }
        break;
      }

      // 5. Subscription Paused
      case "subscription.paused": {
        const subscription = event.payload?.subscription?.entity;
        if (!subscription) break;

        let targetUid = subscription.notes?.uid;
        if (!targetUid) {
          targetUid = await findUserBySubscriptionId(systemToken, subscription.id);
        }

        if (targetUid) {
          console.log(`Setting subscription status to 'paused' for user ${targetUid}`);
          await updateSubscriptionStatusAtomic(systemToken, targetUid, "paused");
        }
        break;
      }

      // 6. Subscription Resumed
      case "subscription.resumed": {
        const subscription = event.payload?.subscription?.entity;
        if (!subscription) break;

        let targetUid = subscription.notes?.uid;
        if (!targetUid) {
          targetUid = await findUserBySubscriptionId(systemToken, subscription.id);
        }

        if (targetUid) {
          console.log(`Setting subscription status to 'active' for user ${targetUid}`);
          await updateSubscriptionStatusAtomic(systemToken, targetUid, "active");
        }
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${eventType}`);
    }

    res.status(200).json({ status: "ok", receivedEvent: eventType });
  } catch (err: any) {
    console.error("Error handling webhook event:", err);
    res.status(500).json({ error: "Internal webhook processing error" });
  }
});

/**
 * Razorpay: User Payment History Endpoint
 */
app.get("/api/razorpay/payment-history", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);

    if (!user || !idToken) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }

    const payments = await getUserPayments(idToken, user.uid);
    res.json({ success: true, payments });
  } catch (error: any) {
    console.error("Error retrieving user payment history:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve payment history." });
  }
});

/**
 * ============================================================================
 * PHASE 3: CLIENT VIDEO TRANSCRIPT KNOWLEDGE BASE (ADMIN ENDPOINTS)
 * ============================================================================
 */

/**
 * Checks whether the authenticated user has administrator privileges.
 * Server-authoritative validation using verified Firebase ID token email.
 */
app.get("/api/admin/check-status", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, error: authError } = await verifyFirebaseToken(authHeader);
    if (!user) {
      res.status(401).json({ isAdmin: false, error: authError || "Authentication required." });
      return;
    }
    const isAdmin = isAuthorizedAdmin(user.email);
    res.json({ isAdmin, email: user.email });
  } catch (err: any) {
    res.status(500).json({ isAdmin: false, error: err.message });
  }
});

/**
 * Lists all uploaded video transcripts for administrators.
 */
app.get("/api/admin/transcripts", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, error: authError } = await verifyFirebaseToken(authHeader);
    if (!user) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }
    if (!isAuthorizedAdmin(user.email)) {
      res.status(403).json({ error: "Administrator access required." });
      return;
    }

    const cache = loadCache();
    res.json({ success: true, transcripts: cache.transcripts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve transcripts." });
  }
});

/**
 * Uploads, parses, chunks, and indexes a video transcript file (.txt, .srt, .vtt).
 * Synchronizes metadata and chunks to Firestore and local persistent RAG index.
 */
app.post("/api/admin/transcripts/upload", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);
    if (!user || !idToken) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }
    if (!isAuthorizedAdmin(user.email)) {
      res.status(403).json({ error: "Administrator access required." });
      return;
    }

    const { title, fileName, fileContent, fileType } = req.body;
    if (!title || !fileContent || !fileName) {
      res.status(400).json({ error: "Title, fileName, and fileContent are required." });
      return;
    }

    const validTypes: TranscriptFileType[] = ["txt", "srt", "vtt"];
    const detectedExt = fileName.split(".").pop()?.toLowerCase();
    const cleanType = ((fileType || detectedExt || "txt") as string).toLowerCase() as TranscriptFileType;

    if (!validTypes.includes(cleanType)) {
      res.status(400).json({ error: "Unsupported file format. Please upload .txt, .srt, or .vtt." });
      return;
    }

    // Parse and normalize transcript text
    const { text, wordCount } = parseTranscriptText(fileContent, cleanType);
    if (wordCount < 10) {
      res.status(400).json({
        error: "The transcript file appears to be empty or contains insufficient dialogue text."
      });
      return;
    }

    const transcriptId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const chunks = chunkTranscript(transcriptId, title.trim(), text);

    const transcript: Transcript = {
      id: transcriptId,
      title: title.trim(),
      fileName: fileName.trim(),
      fileType: cleanType,
      uploadedBy: user.email || user.uid,
      uploadedAt: new Date().toISOString(),
      status: "processed",
      chunkCount: chunks.length,
      wordCount,
      summary: text.slice(0, 240) + (text.length > 240 ? "..." : "")
    };

    // Update cache
    const cache = loadCache();
    // Check for duplicate fileName / title
    const existingIndex = cache.transcripts.findIndex(
      t => t.fileName.toLowerCase() === transcript.fileName.toLowerCase() || t.title.toLowerCase() === transcript.title.toLowerCase()
    );
    if (existingIndex >= 0) {
      // Gracefully replace previous duplicate version
      const oldId = cache.transcripts[existingIndex].id;
      cache.transcripts[existingIndex] = transcript;
      cache.chunks = cache.chunks.filter(c => c.transcriptId !== oldId).concat(chunks);
    } else {
      cache.transcripts.unshift(transcript);
      cache.chunks.push(...chunks);
    }
    saveCache(cache);

    // Sync to Firestore using admin token
    syncTranscriptToFirestore(idToken, transcript, chunks).catch(err => {
      console.warn("Background Firestore transcript sync notice:", err);
    });

    res.json({
      success: true,
      transcript,
      chunksCount: chunks.length,
      wordCount
    });
  } catch (err: any) {
    console.error("Error processing transcript upload:", err);
    res.status(500).json({ error: err.message || "Failed to process transcript upload." });
  }
});

/**
 * Retrieves the chunks of a specific transcript for admin inspection.
 */
app.get("/api/admin/transcripts/:id/chunks", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, error: authError } = await verifyFirebaseToken(authHeader);
    if (!user) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }
    if (!isAuthorizedAdmin(user.email)) {
      res.status(403).json({ error: "Administrator access required." });
      return;
    }

    const transcriptId = req.params.id;
    const cache = loadCache();
    const chunks = cache.chunks.filter(c => c.transcriptId === transcriptId);
    res.json({ success: true, chunks });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve transcript chunks." });
  }
});

/**
 * Deletes a transcript and all associated chunks.
 */
app.delete("/api/admin/transcripts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { user, idToken, error: authError } = await verifyFirebaseToken(authHeader);
    if (!user || !idToken) {
      res.status(401).json({ error: authError || "Authentication required." });
      return;
    }
    if (!isAuthorizedAdmin(user.email)) {
      res.status(403).json({ error: "Administrator access required." });
      return;
    }

    const transcriptId = req.params.id;
    const cache = loadCache();
    const existing = cache.transcripts.find(t => t.id === transcriptId);
    if (!existing) {
      res.status(404).json({ error: "Transcript not found." });
      return;
    }

    const chunkIds = cache.chunks.filter(c => c.transcriptId === transcriptId).map(c => c.id);
    cache.transcripts = cache.transcripts.filter(t => t.id !== transcriptId);
    cache.chunks = cache.chunks.filter(c => c.transcriptId !== transcriptId);
    saveCache(cache);

    // Sync deletion to Firestore
    deleteTranscriptFromFirestore(idToken, transcriptId, chunkIds).catch(err => {
      console.warn("Background Firestore transcript deletion notice:", err);
    });

    res.json({ success: true, deletedId: transcriptId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete transcript." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
