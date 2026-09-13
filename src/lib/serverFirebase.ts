import fallbackConfig from '../../firebase-applet-config.json';
import { REPORT_TOKEN_COST } from '../data/constants';
import { TRIAL_DURATION_DAYS, TRIAL_TOKEN_ALLOCATION } from '../data/plans';

interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  firestoreDatabaseId: string;
}

function getFirebaseServerConfig(): FirebaseConfig {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
    firestoreDatabaseId:
      process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || fallbackConfig.firestoreDatabaseId || '(default)',
  };
}

export interface VerifiedAuthUser {
  uid: string;
  email: string;
}

export interface UserTokenState {
  tokenBalance: number;
  updateTime: string;
  userDoc: any;
}

/**
 * Verifies the Firebase ID token using Google Identity Toolkit.
 * This guarantees the UID is derived securely from Firebase Authentication
 * and cannot be spoofed by client-supplied payload parameters.
 */
export async function verifyFirebaseToken(authHeader: string | undefined): Promise<{ user: VerifiedAuthUser | null; idToken: string | null; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, idToken: null, error: 'Authorization header with Bearer token is required.' };
  }

  const idToken = authHeader.substring(7).trim();
  if (!idToken) {
    return { user: null, idToken: null, error: 'Missing Bearer token.' };
  }

  const config = getFirebaseServerConfig();
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Firebase token verification failed:', errData);
      return { user: null, idToken: null, error: 'Invalid or expired authentication session.' };
    }

    const data = await response.json();
    if (!data.users || data.users.length === 0) {
      return { user: null, idToken: null, error: 'User not found for provided token.' };
    }

    const verifiedUser: VerifiedAuthUser = {
      uid: data.users[0].localId,
      email: data.users[0].email || ''
    };

    return { user: verifiedUser, idToken, error: undefined };
  } catch (err: any) {
    console.error('Error during token verification:', err);
    return { user: null, idToken: null, error: 'Authentication verification service error.' };
  }
}

/**
 * Retrieves the current user's profile document from Firestore via the REST API.
 * Uses the authenticated user's ID token to honor Firestore Security Rules.
 * If the user document does not exist yet, initializes it with standard 1,000 starter tokens.
 */
export async function getUserTokenState(idToken: string, uid: string, fallbackEmail?: string): Promise<UserTokenState | null> {
  const config = getFirebaseServerConfig();
  const basePath = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
  const docUrl = `${basePath}/users/${uid}`;

  try {
    const res = await fetch(docUrl, {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    if (res.status === 404) {
      // Auto-initialize standard 1,000 starter tokens profile if not yet created
      const now = new Date().toISOString();
      const createRes = await fetch(`${basePath}/users?documentId=${uid}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            name: { stringValue: fallbackEmail?.split('@')[0] || 'Sales Pro' },
            email: { stringValue: fallbackEmail || '' },
            photoURL: { stringValue: '' },
            plan: { stringValue: 'free' },
            tokenBalance: { integerValue: '1000' },
            subscriptionStatus: { stringValue: 'active' },
            hasUsedTrial: { booleanValue: false },
            trialStartDate: { nullValue: null },
            trialEndDate: { nullValue: null },
            subscriptionStartDate: { nullValue: null },
            subscriptionEndDate: { nullValue: null },
            createdAt: { stringValue: now },
            updatedAt: { stringValue: now }
          }
        })
      });

      if (!createRes.ok) {
        console.error('Failed to auto-initialize user profile:', await createRes.text());
        return null;
      }

      const createdDoc = await createRes.json();
      return {
        tokenBalance: 1000,
        updateTime: createdDoc.updateTime,
        userDoc: createdDoc
      };
    }

    if (!res.ok) {
      console.error('Failed to fetch user doc from Firestore:', res.status, await res.text());
      return null;
    }

    const docData = await res.json();
    const balanceField = docData.fields?.tokenBalance;
    const tokenBalance = balanceField?.integerValue !== undefined
      ? parseInt(balanceField.integerValue, 10)
      : (balanceField?.doubleValue !== undefined ? Math.floor(balanceField.doubleValue) : 0);

    return {
      tokenBalance,
      updateTime: docData.updateTime,
      userDoc: docData
    };
  } catch (err) {
    console.error('Error fetching user token state:', err);
    return null;
  }
}

/**
 * Performs an atomic Firestore transaction to:
 * 1. Deduct cost from the user's token balance.
 * 2. Write an immutable audit log to tokenTransactions/{transactionId}.
 *
 * Uses optimistic concurrency (currentDocument.updateTime) to guarantee that
 * concurrent requests cannot double-spend tokens.
 */
export async function deductTokensAtomic(
  idToken: string,
  uid: string,
  currentBalance: number,
  cost: number,
  currentUpdateTime: string,
  referenceId: string,
  retryCount: number = 2
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const config = getFirebaseServerConfig();
  const basePath = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
  const commitUrl = `${basePath}:commit`;

  if (currentBalance < cost) {
    return {
      success: false,
      newBalance: currentBalance,
      error: 'Insufficient tokens. Please upgrade your plan or purchase more tokens.'
    };
  }

  const newBalance = currentBalance - cost;
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const commitPayload = {
    writes: [
      {
        update: {
          name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/users/${uid}`,
          fields: {
            tokenBalance: { integerValue: String(newBalance) },
            updatedAt: { stringValue: now }
          }
        },
        updateMask: {
          fieldPaths: ['tokenBalance', 'updatedAt']
        },
        currentDocument: {
          updateTime: currentUpdateTime
        }
      },
      {
        update: {
          name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/tokenTransactions/${txId}`,
          fields: {
            uid: { stringValue: uid },
            type: { stringValue: 'usage' },
            amount: { integerValue: String(cost) },
            balanceBefore: { integerValue: String(currentBalance) },
            balanceAfter: { integerValue: String(newBalance) },
            description: { stringValue: 'Sales Intelligence Report generation' },
            createdAt: { stringValue: now },
            referenceId: { stringValue: referenceId }
          }
        },
        currentDocument: {
          exists: false
        }
      }
    ]
  };

  try {
    const res = await fetch(commitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commitPayload)
    });

    if (res.ok) {
      return { success: true, newBalance };
    }

    const errJson = await res.json().catch(() => ({}));
    console.warn(`Firestore commit failed with status ${res.status}:`, errJson);

    // Concurrency conflict / Precondition failed (e.g. 409 or 400 ABORTED)
    if ((res.status === 409 || res.status === 400) && retryCount > 0) {
      console.log('Concurrent modification detected during token deduction. Re-verifying balance and retrying...');
      const freshState = await getUserTokenState(idToken, uid);
      if (!freshState) {
        return { success: false, newBalance: currentBalance, error: 'Could not refresh user token state.' };
      }

      if (freshState.tokenBalance < cost) {
        return {
          success: false,
          newBalance: freshState.tokenBalance,
          error: 'Insufficient tokens. Please upgrade your plan or purchase more tokens.'
        };
      }

      // Retry atomic deduction with fresh state
      return deductTokensAtomic(
        idToken,
        uid,
        freshState.tokenBalance,
        cost,
        freshState.updateTime,
        referenceId,
        retryCount - 1
      );
    }

    return {
      success: false,
      newBalance: currentBalance,
      error: errJson.error?.message || 'Failed to record token deduction in Firestore.'
    };
  } catch (err: any) {
    console.error('Error during atomic token deduction:', err);
    return { success: false, newBalance: currentBalance, error: err.message || 'Network error during transaction commit.' };
  }
}

/**
 * Server-authoritative 30-Day Free Trial Activation.
 * - Verifies that the user has not previously claimed or activated a trial.
 * - Atomically sets plan to "trial", status to "active", sets 30-day start and end dates,
 *   and credits TRIAL_TOKEN_ALLOCATION (3,000 tokens) with an immutable audit transaction record.
 */
export async function activateTrialAtomic(
  idToken: string,
  uid: string
): Promise<{
  success: boolean;
  error?: string;
  plan?: string;
  subscriptionStatus?: string;
  tokenBalance?: number;
  trialStartDate?: string;
  trialEndDate?: string;
}> {
  const config = getFirebaseServerConfig();
  const basePath = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
  const commitUrl = `${basePath}:commit`;

  // Fetch current user document
  const userState = await getUserTokenState(idToken, uid);
  if (!userState) {
    return { success: false, error: 'User document not found in database.' };
  }

  const fields = userState.userDoc.fields || {};
  const currentPlan = fields.plan?.stringValue || 'free';
  const hasUsedTrial = fields.hasUsedTrial?.booleanValue === true;
  const trialStartDateVal = fields.trialStartDate?.stringValue;

  // Strict check: prevent activating trial more than once
  if (hasUsedTrial || trialStartDateVal || currentPlan === 'trial') {
    return {
      success: false,
      error: 'You have already activated your 30-day free trial. The trial offer is valid only once per account.'
    };
  }

  const now = new Date();
  const trialStartDate = now.toISOString();
  const endDate = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const trialEndDate = endDate.toISOString();

  const currentBalance = userState.tokenBalance;
  const newBalance = currentBalance + TRIAL_TOKEN_ALLOCATION;
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const commitPayload = {
    writes: [
      {
        update: {
          name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/users/${uid}`,
          fields: {
            plan: { stringValue: 'trial' },
            subscriptionStatus: { stringValue: 'active' },
            trialStartDate: { stringValue: trialStartDate },
            trialEndDate: { stringValue: trialEndDate },
            hasUsedTrial: { booleanValue: true },
            tokenBalance: { integerValue: String(newBalance) },
            updatedAt: { stringValue: trialStartDate }
          }
        },
        updateMask: {
          fieldPaths: [
            'plan',
            'subscriptionStatus',
            'trialStartDate',
            'trialEndDate',
            'hasUsedTrial',
            'tokenBalance',
            'updatedAt'
          ]
        },
        currentDocument: {
          updateTime: userState.updateTime
        }
      },
      {
        update: {
          name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/tokenTransactions/${txId}`,
          fields: {
            uid: { stringValue: uid },
            type: { stringValue: 'trial_grant' },
            amount: { integerValue: String(TRIAL_TOKEN_ALLOCATION) },
            balanceBefore: { integerValue: String(currentBalance) },
            balanceAfter: { integerValue: String(newBalance) },
            description: { stringValue: `30-Day Free Trial Activation (+${TRIAL_TOKEN_ALLOCATION.toLocaleString()} Tokens)` },
            createdAt: { stringValue: trialStartDate },
            referenceId: { stringValue: 'trial_activation' }
          }
        },
        currentDocument: {
          exists: false
        }
      }
    ]
  };

  try {
    const res = await fetch(commitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commitPayload)
    });

    if (res.ok) {
      return {
        success: true,
        plan: 'trial',
        subscriptionStatus: 'active',
        tokenBalance: newBalance,
        trialStartDate,
        trialEndDate
      };
    }

    const errJson = await res.json().catch(() => ({}));
    console.error('Trial activation commit failed:', res.status, errJson);
    return {
      success: false,
      error: errJson.error?.message || 'Failed to activate trial in database.'
    };
  } catch (err: any) {
    console.error('Error in activateTrialAtomic:', err);
    return { success: false, error: err.message || 'Network failure activating trial.' };
  }
}

export interface RecordPaymentParams {
  plan: 'monthly' | 'oneTime';
  amount: number; // in INR e.g. 1999 or 4999
  tokensToCredit: number; // 10000 or 30000
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  idempotencyKey?: string;
}

/**
 * Checks if a payment has already been recorded in Firestore.
 */
export async function getPaymentById(idToken: string, paymentDocId: string): Promise<any | null> {
  const config = getFirebaseServerConfig();
  const basePath = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
  try {
    const res = await fetch(`${basePath}/payments/${paymentDocId}`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (res.status === 200) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Server-authoritative atomic token credit and payment recording.
 * Idempotent: uses the Razorpay Payment ID as the document ID and idempotency key.
 */
export async function recordPaymentAndCreditTokensAtomic(
  idToken: string,
  uid: string,
  params: RecordPaymentParams
): Promise<{
  success: boolean;
  alreadyProcessed?: boolean;
  newBalance?: number;
  plan?: string;
  subscriptionStatus?: string;
  error?: string;
}> {
  const config = getFirebaseServerConfig();
  const basePath = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
  const commitUrl = `${basePath}:commit`;

  // Standardize payment document ID
  const sanitizedPaymentId = params.razorpayPaymentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const paymentDocId = `pay_${sanitizedPaymentId}`;

  // 1. Idempotency check: check if payment record already exists
  const existingPayment = await getPaymentById(idToken, paymentDocId);
  if (existingPayment) {
    console.log(`Payment ${paymentDocId} was already processed. Returning current state.`);
    const currentState = await getUserTokenState(idToken, uid);
    return {
      success: true,
      alreadyProcessed: true,
      newBalance: currentState?.tokenBalance,
      plan: currentState?.userDoc?.fields?.plan?.stringValue,
      subscriptionStatus: currentState?.userDoc?.fields?.subscriptionStatus?.stringValue
    };
  }

  // 2. Fetch fresh user state
  const userState = await getUserTokenState(idToken, uid);
  if (!userState) {
    return { success: false, error: 'User document not found in database.' };
  }

  const currentBalance = userState.tokenBalance;
  const newBalance = currentBalance + params.tokensToCredit;
  const now = new Date();
  const nowIso = now.toISOString();
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idempotencyKey = params.idempotencyKey || `idem_${params.razorpayPaymentId}`;

  // Compute fields based on plan type
  const userFieldUpdates: Record<string, any> = {
    tokenBalance: { integerValue: String(newBalance) },
    paymentProvider: { stringValue: 'razorpay' },
    updatedAt: { stringValue: nowIso }
  };
  const updateFieldPaths = ['tokenBalance', 'paymentProvider', 'updatedAt'];

  if (params.plan === 'monthly') {
    const endMs = now.getTime() + 30 * 24 * 60 * 60 * 1000;
    const endIso = new Date(endMs).toISOString();

    userFieldUpdates.plan = { stringValue: 'monthly' };
    userFieldUpdates.subscriptionStatus = { stringValue: 'active' };
    userFieldUpdates.billingCycle = { stringValue: 'monthly' };
    userFieldUpdates.monthlyTokenAllocation = { integerValue: '10000' };
    userFieldUpdates.subscriptionStartDate = { stringValue: nowIso };
    userFieldUpdates.subscriptionEndDate = { stringValue: endIso };
    if (params.razorpaySubscriptionId) {
      userFieldUpdates.paymentSubscriptionId = { stringValue: params.razorpaySubscriptionId };
      updateFieldPaths.push('paymentSubscriptionId');
    }
    updateFieldPaths.push(
      'plan',
      'subscriptionStatus',
      'billingCycle',
      'monthlyTokenAllocation',
      'subscriptionStartDate',
      'subscriptionEndDate'
    );
  } else {
    // One-Time purchase: update plan if on free plan, or keep active subscription
    const existingPlan = userState.userDoc?.fields?.plan?.stringValue || 'free';
    if (existingPlan === 'free') {
      userFieldUpdates.plan = { stringValue: 'oneTime' };
      updateFieldPaths.push('plan');
    }
  }

  const paymentDocFields: Record<string, any> = {
    uid: { stringValue: uid },
    plan: { stringValue: params.plan },
    provider: { stringValue: 'razorpay' },
    razorpayPaymentId: { stringValue: params.razorpayPaymentId },
    amount: { integerValue: String(params.amount) },
    currency: { stringValue: 'INR' },
    status: { stringValue: 'captured' },
    tokensGranted: { integerValue: String(params.tokensToCredit) },
    createdAt: { stringValue: nowIso },
    updatedAt: { stringValue: nowIso },
    idempotencyKey: { stringValue: idempotencyKey }
  };

  if (params.razorpayOrderId) {
    paymentDocFields.razorpayOrderId = { stringValue: params.razorpayOrderId };
  }
  if (params.razorpaySubscriptionId) {
    paymentDocFields.razorpaySubscriptionId = { stringValue: params.razorpaySubscriptionId };
  }

  const description =
    params.plan === 'monthly'
      ? `Monthly Subscription Grant (+${params.tokensToCredit.toLocaleString()} Tokens)`
      : `Token Pack Purchase (+${params.tokensToCredit.toLocaleString()} Tokens)`;

  const commitPayload = {
    writes: [
      {
        update: {
          name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/users/${uid}`,
          fields: userFieldUpdates
        },
        updateMask: {
          fieldPaths: updateFieldPaths
        },
        currentDocument: {
          updateTime: userState.updateTime
        }
      },
      {
        update: {
          name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/tokenTransactions/${txId}`,
          fields: {
            uid: { stringValue: uid },
            type: { stringValue: params.plan === 'monthly' ? 'monthly_grant' : 'purchase_grant' },
            amount: { integerValue: String(params.tokensToCredit) },
            balanceBefore: { integerValue: String(currentBalance) },
            balanceAfter: { integerValue: String(newBalance) },
            description: { stringValue: description },
            createdAt: { stringValue: nowIso },
            referenceId: { stringValue: params.razorpayPaymentId }
          }
        },
        currentDocument: {
          exists: false
        }
      },
      {
        update: {
          name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/payments/${paymentDocId}`,
          fields: paymentDocFields
        },
        currentDocument: {
          exists: false
        }
      }
    ]
  };

  try {
    const res = await fetch(commitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commitPayload)
    });

    if (res.ok) {
      return {
        success: true,
        newBalance,
        plan: userFieldUpdates.plan?.stringValue || userState.userDoc?.fields?.plan?.stringValue,
        subscriptionStatus: userFieldUpdates.subscriptionStatus?.stringValue || userState.userDoc?.fields?.subscriptionStatus?.stringValue
      };
    }

    const errJson = await res.json().catch(() => ({}));
    console.error('Record payment transaction failed:', res.status, errJson);
    return {
      success: false,
      error: errJson.error?.message || 'Database commit failed during payment recording.'
    };
  } catch (err: any) {
    console.error('Error in recordPaymentAndCreditTokensAtomic:', err);
    return { success: false, error: err.message || 'Network failure while recording payment.' };
  }
}

/**
 * Retrieves payment history for the authenticated user only.
 */
export async function getUserPayments(idToken: string, uid: string): Promise<any[]> {
  const config = getFirebaseServerConfig();
  const basePath = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
  const queryUrl = `${basePath}:runQuery`;

  try {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'payments' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'uid' },
              op: 'EQUAL',
              value: { stringValue: uid }
            }
          }
        }
      })
    });

    if (!res.ok) {
      console.warn('Failed to fetch user payments from Firestore:', res.status);
      return [];
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    return rows
      .filter((r: any) => r.document && r.document.fields)
      .map((r: any) => {
        const f = r.document.fields;
        const nameParts = (r.document.name || '').split('/');
        const id = nameParts[nameParts.length - 1];
        return {
          id,
          uid: f.uid?.stringValue || '',
          plan: f.plan?.stringValue || 'oneTime',
          provider: f.provider?.stringValue || 'razorpay',
          razorpayOrderId: f.razorpayOrderId?.stringValue || null,
          razorpayPaymentId: f.razorpayPaymentId?.stringValue || '',
          razorpaySubscriptionId: f.razorpaySubscriptionId?.stringValue || null,
          amount: Number(f.amount?.integerValue || 0),
          currency: f.currency?.stringValue || 'INR',
          status: f.status?.stringValue || 'captured',
          tokensGranted: Number(f.tokensGranted?.integerValue || 0),
          createdAt: f.createdAt?.stringValue || '',
          updatedAt: f.updatedAt?.stringValue || '',
          idempotencyKey: f.idempotencyKey?.stringValue || ''
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching user payments:', err);
    return [];
  }
}

