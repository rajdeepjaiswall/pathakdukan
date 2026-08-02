const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;

// Sandbox URLs
const SANDBOX_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const SANDBOX_OAUTH_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

// Production URLs
const PROD_BASE_URL = 'https://api.phonepe.com/apis/pg';
const PROD_OAUTH_URL = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';

// Override via env vars, or toggle test mode via PHONEPE_TEST_MODE
const IS_TEST_MODE = (process.env.PHONEPE_TEST_MODE || 'true').toLowerCase() !== 'false';
const BASE_URL = process.env.PHONEPE_BASE_URL || (IS_TEST_MODE ? SANDBOX_BASE_URL : PROD_BASE_URL);
const OAUTH_URL = process.env.PHONEPE_OAUTH_URL || (IS_TEST_MODE ? SANDBOX_OAUTH_URL : PROD_OAUTH_URL);

interface PhonePeTokenResponse {
  access_token: string;
  encrypted_access_token: string;
  expires_in: number | null;
  issued_at: number;
  expires_at: number;
  session_expires_at: number;
  token_type: string; // Will be "O-Bearer"
}

interface PhonePePaymentResponse {
  orderId?: string;
  state?: string;
  expireAt?: number;
  redirectUrl?: string;
  code?: string;
  message?: string;
}

interface PhonePeStatusResponse {
  orderId?: string;
  merchantOrderId?: string;
  state?: string;
  amount?: number;
  expireAt?: number;
  metaInfo?: any;
  paymentDetails?: Array<{
    transactionId?: string;
    paymentMode?: string;
    timestamp?: number;
    amount?: number;
    state?: string;
    rail?: {
      type?: string;
      utr?: string;
      rrn?: string;
    };
  }>;
  code?: string;
  message?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPhonePeAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    console.log('Using cached PhonePe access token');
    return cachedToken.token;
  }

  console.log('Generating new PhonePe access token...');
  console.log('OAuth URL:', OAUTH_URL);
  console.log('Client ID configured:', !!PHONEPE_CLIENT_ID);
  console.log('Client Secret configured:', !!PHONEPE_CLIENT_SECRET);
  console.log('Merchant ID configured:', !!PHONEPE_MERCHANT_ID);

  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    throw new Error('PhonePe credentials not configured. Check PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET');
  }

  const params = new URLSearchParams({
    client_id: PHONEPE_CLIENT_ID,
    client_version: PHONEPE_CLIENT_VERSION,
    client_secret: PHONEPE_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  console.log('Sending OAuth request to PhonePe...');
  const response = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  console.log('PhonePe OAuth Response Status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('PhonePe OAuth Error Response:', response.status, errorText);
    throw new Error(`Failed to get PhonePe access token: ${response.status} ${errorText}`);
  }

  const data: PhonePeTokenResponse = await response.json();
  console.log('PhonePe OAuth Success, token type:', data.token_type, 'expires_at:', data.expires_at);
  
  cachedToken = {
    token: data.access_token,
    expiresAt: data.expires_at * 1000,
  };

  return data.access_token;
}

export async function initiatePhonePePayment(params: {
  orderId: number;
  merchantTransactionId: string;
  userId: number;
  amount: number;
  phone?: string;
  redirectUrl: string;
  callbackUrl: string;
}): Promise<{ success: boolean; redirectUrl?: string; orderId?: string; error?: string }> {
  try {
    const accessToken = await getPhonePeAccessToken();

    // According to PhonePe documentation, the payload structure is:
    // - merchantOrderId: unique order ID
    // - amount: in paisa (₹10 = 1000)
    // - paymentFlow.type: "PG_CHECKOUT"
    // - paymentFlow.merchantUrls.redirectUrl: where to redirect after payment
    const payload = {
      merchantOrderId: params.merchantTransactionId,
      amount: Math.round(params.amount * 100), // Convert to paisa
      expireAfter: 1200, // 20 minutes
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: `Payment for Order #${params.orderId}`,
        merchantUrls: {
          redirectUrl: params.redirectUrl,
        },
      },
      metaInfo: {
        udf1: `order_${params.orderId}`,
        udf2: `user_${params.userId}`,
      },
    };

    console.log('PhonePe Payment Payload:', JSON.stringify(payload, null, 2));
    console.log('Payment API URL:', `${BASE_URL}/checkout/v2/pay`);

    // According to docs, Authorization header uses "O-Bearer" token type
    const response = await fetch(`${BASE_URL}/checkout/v2/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('PhonePe Payment Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('PhonePe Payment Response Raw:', responseText);
    
    let data: PhonePePaymentResponse;
    try {
      data = JSON.parse(responseText);
      console.log('PhonePe Payment Response Parsed:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse PhonePe response as JSON');
      return {
        success: false,
        error: `Invalid response from PhonePe: ${responseText}`,
      };
    }

    if (!response.ok) {
      console.error('PhonePe API Error:', response.status, data);
      return {
        success: false,
        error: data.message || `PhonePe API error: ${response.status}`,
      };
    }

    // According to docs, successful response has:
    // - orderId: PhonePe's internal order ID
    // - state: "PENDING"
    // - redirectUrl: URL to redirect user for payment
    if (data.redirectUrl) {
      return {
        success: true,
        redirectUrl: data.redirectUrl,
        orderId: data.orderId,
      };
    }

    return {
      success: false,
      error: data.message || 'Payment initiation failed - no redirect URL received',
    };
  } catch (error) {
    console.error('PhonePe Payment Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkPhonePePaymentStatus(merchantOrderId: string): Promise<{
  success: boolean;
  status?: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId?: string;
  paymentMode?: string;
  data?: any;
  error?: string;
}> {
  try {
    const accessToken = await getPhonePeAccessToken();

    // According to docs: GET /checkout/v2/order/{merchantOrderId}/status
    const statusUrl = `${BASE_URL}/checkout/v2/order/${merchantOrderId}/status`;
    console.log('Checking payment status:', statusUrl);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`,
      },
    });

    console.log('PhonePe Status Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('PhonePe Status Response Raw:', responseText);
    
    let data: PhonePeStatusResponse;
    try {
      data = JSON.parse(responseText);
      console.log('PhonePe Status Response Parsed:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse PhonePe status response as JSON');
      return {
        success: false,
        error: `Invalid response from PhonePe: ${responseText}`,
      };
    }

    if (!response.ok) {
      console.error('PhonePe Status API Error:', response.status, data);
      return {
        success: false,
        error: data.message || `PhonePe API error: ${response.status}`,
      };
    }

    // Parse state from response
    let status: 'SUCCESS' | 'PENDING' | 'FAILED' = 'PENDING';
    
    // Check for multiple success indicators
    if (data.state === 'COMPLETED' || data.code === 'PAYMENT_SUCCESS' || data.state === 'SUCCESS') {
      status = 'SUCCESS';
    } else if (data.state === 'FAILED' || data.state === 'CANCELLED' || data.code === 'PAYMENT_ERROR') {
      status = 'FAILED';
    }

    // Get transaction details if available
    const paymentDetail = data.paymentDetails?.[0];
    
    return {
      success: true,
      status,
      transactionId: paymentDetail?.transactionId,
      paymentMode: paymentDetail?.paymentMode,
      data: data,
    };
  } catch (error) {
    console.error('PhonePe Status Check Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Webhook credentials - set these in your environment
const PHONEPE_WEBHOOK_USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME || 'pathakbhandar';
const PHONEPE_WEBHOOK_PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD || 'webhooksecret123';

// PhonePe webhook payload interfaces
export interface PhonePeWebhookPayload {
  event: 'checkout.order.completed' | 'checkout.order.failed' | 'pg.refund.completed' | 'pg.refund.failed';
  payload: {
    orderId?: string;
    merchantId?: string;
    merchantOrderId: string;
    state: 'COMPLETED' | 'FAILED' | 'PENDING';
    amount: number;
    expireAt?: number;
    metaInfo?: {
      udf1?: string;
      udf2?: string;
      udf3?: string;
      udf4?: string;
    };
    paymentDetails?: Array<{
      paymentMode?: string;
      transactionId?: string;
      timestamp?: number;
      amount?: number;
      state?: string;
      errorCode?: string;
      detailedErrorCode?: string;
    }>;
    // Refund specific fields
    originalMerchantOrderId?: string;
    merchantRefundId?: string;
    refundId?: string;
    errorCode?: string;
    detailedErrorCode?: string;
  };
}

// Verify webhook authorization header
export function verifyPhonePeWebhook(authorizationHeader: string | undefined): boolean {
  if (!authorizationHeader) {
    console.log('PhonePe Webhook: No authorization header provided');
    return false;
  }

  // PhonePe sends: Authorization: SHA256(username:password)
  const crypto = require('crypto');
  const expectedHash = crypto
    .createHash('sha256')
    .update(`${PHONEPE_WEBHOOK_USERNAME}:${PHONEPE_WEBHOOK_PASSWORD}`)
    .digest('hex');

  const receivedHash = authorizationHeader.replace('SHA256 ', '').replace('sha256 ', '').toLowerCase();
  const isValid = receivedHash.toLowerCase() === expectedHash.toLowerCase();
  
  console.log('PhonePe Webhook verification:', isValid ? 'VALID' : 'INVALID');
  console.log('Expected hash:', expectedHash);
  console.log('Received hash:', receivedHash);
  
  return isValid;
}

// Parse webhook and return order status update
export function parsePhonePeWebhook(webhookData: PhonePeWebhookPayload): {
  merchantOrderId: string;
  event: string;
  status: 'payment_success' | 'pending_payment' | 'payment_failed';
  transactionId?: string;
  paymentMode?: string;
  errorCode?: string;
  rawData: any;
} {
  const { event, payload } = webhookData;
  
  console.log('PhonePe Webhook Event:', event);
  console.log('PhonePe Webhook Payload State:', payload.state);
  console.log('PhonePe Webhook Merchant Order ID:', payload.merchantOrderId);

  let status: 'payment_success' | 'pending_payment' | 'payment_failed' = 'pending_payment';
  
  // According to docs: Use "payload.state" for payment status
  const isSuccess = payload.state === 'COMPLETED' || payload.state === 'SUCCESS';
  const isFailed = payload.state === 'FAILED' || payload.state === 'CANCELLED';

  switch (event) {
    case 'checkout.order.completed':
      status = isSuccess ? 'payment_success' : (isFailed ? 'payment_failed' : 'pending_payment');
      break;
    case 'checkout.order.failed':
      status = 'payment_failed';
      break;
    case 'pg.refund.completed':
    case 'pg.refund.failed':
      // Handle refund events separately if needed
      status = payload.state === 'COMPLETED' ? 'payment_success' : 'payment_failed';
      break;
    default:
      status = 'pending_payment';
  }

  const paymentDetail = payload.paymentDetails?.[0];

  return {
    merchantOrderId: payload.merchantOrderId || payload.originalMerchantOrderId || '',
    event,
    status,
    transactionId: paymentDetail?.transactionId,
    paymentMode: paymentDetail?.paymentMode,
    errorCode: paymentDetail?.errorCode || payload.errorCode,
    rawData: webhookData,
  };
}

// Get webhook credentials for dashboard configuration
export function getWebhookCredentials(): { username: string; password: string } {
  return {
    username: PHONEPE_WEBHOOK_USERNAME,
    password: PHONEPE_WEBHOOK_PASSWORD,
  };
}

export function isPhonePeConfigured(): boolean {
  return !!(PHONEPE_CLIENT_ID && PHONEPE_CLIENT_SECRET && PHONEPE_MERCHANT_ID);
}

export function getPhonePeConfig() {
  return {
    provider: 'phonepe',
    displayName: 'PhonePe',
    isTestMode: IS_TEST_MODE,
    isConfigured: isPhonePeConfigured(),
  };
}
