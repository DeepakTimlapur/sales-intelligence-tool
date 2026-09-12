import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

    const ai = getGemini();

    if (!ai) {
      // Return structured fallback report if GEMINI_API_KEY is not configured yet
      res.json({
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
      });
      return;
    }

    const prompt = `
You are Manuj Bajaj, renowned Indian B2B sales coach, Amazon bestselling author of 26 books, and creator of the Stab & Twist and 6KLH sales objection handling methodologies.

Generate a comprehensive, actionable, high-conversion sales intelligence report tailored for the Indian business context (with natural Hinglish flavor where appropriate for the Indian B2B/Lala-ji/MSME mindset).

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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response generated by Gemini model.");
    }

    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-sales-info:", error);
    res.status(500).json({ error: error.message || "Failed to generate sales report." });
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
