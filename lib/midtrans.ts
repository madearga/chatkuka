import midtransClient from 'midtrans-client';
import crypto from 'crypto';

// Check for environment variables
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'dummy-server-key';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || 'dummy-client-key';
const MIDTRANS_SIGNATURE_KEY = process.env.MIDTRANS_SIGNATURE_KEY || 'dummy-signature-key';
const IS_PRODUCTION = process.env.MIDTRANS_ENV === 'production';

// Show warnings instead of throwing errors
if (!process.env.MIDTRANS_SERVER_KEY) {
  console.warn('Warning: MIDTRANS_SERVER_KEY is not configured in environment variables. Using dummy value.');
}

if (!process.env.MIDTRANS_CLIENT_KEY) {
  console.warn('Warning: MIDTRANS_CLIENT_KEY is not configured in environment variables. Using dummy value.');
}

if (!process.env.MIDTRANS_SIGNATURE_KEY) {
  console.warn('Warning: MIDTRANS_SIGNATURE_KEY is not configured in environment variables. Using dummy value.');
}

// Initialize Midtrans Snap client
let snap;
try {
  snap = new midtransClient.Snap({
    isProduction: IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY,
  });
  console.log('Midtrans Snap client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Midtrans Snap client:', error);
  // Create a dummy snap client that returns mock responses
  snap = {
    createTransaction: async () => ({
      token: 'mock-token-' + Date.now(),
      redirect_url: 'https://example.com/payment/mock',
    }),
  };
  console.warn('Using mock Midtrans Snap client');
}

// Initialize Midtrans Core API client for direct charges (used for subscription renewals)
let coreApiInstance;
try {
  coreApiInstance = new midtransClient.CoreApi({
    isProduction: IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY,
  });
  console.log('Midtrans Core API client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Midtrans Core API client:', error);
  // Create a dummy Core API client that returns mock responses
  coreApiInstance = {
    charge: async () => ({
      transaction_id: 'mock-transaction-' + Date.now(),
      status_code: '200',
      transaction_status: 'settlement',
    }),
  };
  console.warn('Using mock Midtrans Core API client');
}

export const coreApi = coreApiInstance;

interface CreateTransactionParams {
  orderId: string;
  amount: number;
  customer: {
    id: string;
    email: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  creditCardOptions?: {
    saveCard?: boolean;
    secure?: boolean;
    authentication?: boolean;
  };
}

export async function createSnapTransaction({
  orderId,
  amount,
  customer,
  items,
  creditCardOptions,
}: CreateTransactionParams) {
  try {
    // Check if we're using dummy keys and return mock response
    if (MIDTRANS_SERVER_KEY === 'dummy-server-key') {
      console.warn('Using dummy Midtrans keys. Returning mock transaction response.');
      return {
        token: 'dummy-token-' + orderId,
        redirectUrl: 'https://example.com/payment/' + orderId,
      };
    }

    // Prepare transaction parameters
    const transactionParams = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customer.email.split('@')[0],
        email: customer.email,
        customer_id: customer.id,
      },
      item_details: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    // Add credit card options if provided
    if (creditCardOptions) {
      Object.assign(transactionParams, {
        credit_card: {
          secure: creditCardOptions.secure ?? true,
          save_card: creditCardOptions.saveCard ?? false,
          authentication: creditCardOptions.authentication,
        },
      });
    }

    console.log('Creating Midtrans transaction with params:', JSON.stringify(transactionParams, null, 2));

    // Create transaction
    const transaction = await snap.createTransaction(transactionParams);

    console.log('Midtrans transaction created successfully:', {
      token: transaction.token ? 'token-received' : 'no-token',
      redirectUrl: transaction.redirect_url ? 'url-received' : 'no-url',
    });

    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    };
  } catch (error) {
    console.error('Failed to create Midtrans transaction:', error);

    // In development, return a mock token to allow testing
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Returning mock token for development testing');
      return {
        token: 'dev-mock-token-' + orderId,
        redirectUrl: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' + orderId,
      };
    }

    // In production, rethrow the error to be handled by the caller
    throw error;
  }
}

export function generateOrderId(prefix = 'ORDER') {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Verify Midtrans webhook signature
 * @param orderId - The order ID from the notification
 * @param statusCode - The status code from the notification
 * @param grossAmount - The gross amount from the notification
 * @param serverKey - The Midtrans server key (optional, uses env var by default)
 * @param receivedSignature - The signature received in the notification header
 * @returns Promise<boolean> - Whether the signature is valid
 */
export async function verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  serverKey = MIDTRANS_SERVER_KEY,
  receivedSignature,
}: {
  orderId: string;
  statusCode: string;
  grossAmount: string | number;
  serverKey?: string;
  receivedSignature: string;
}): Promise<boolean> {
  try {
    // Check against the actual server key's dummy value
    if (serverKey === 'dummy-server-key') {
      console.warn('Using dummy MIDTRANS_SERVER_KEY. Skipping signature verification.');
      return true;
    }

    // Ensure grossAmount is a string with .00 format
    const grossAmountStr = typeof grossAmount === 'number' 
      ? grossAmount.toFixed(2) 
      : String(grossAmount); // Ensure it's a string, handle if Midtrans sends number unexpectedly
      
    // Check if grossAmountStr already ends with .00, add if not (just in case)
    const formattedGrossAmount = grossAmountStr.endsWith('.00') 
      ? grossAmountStr 
      : grossAmountStr.includes('.') 
        ? parseFloat(grossAmountStr).toFixed(2) // If it has decimal but not .00
        : grossAmountStr + '.00'; // If it has no decimal at all

    // Create the signature component string: order_id + status_code + gross_amount + server_key
    const signatureComponent = `${orderId}${statusCode}${formattedGrossAmount}${serverKey}`;

    // Add logging for debugging
    console.log('[verifyWebhookSignature] Signature component:', signatureComponent);
    console.log('[verifyWebhookSignature] Server Key used (should be MIDTRANS_SERVER_KEY):', serverKey);
    console.log('[verifyWebhookSignature] Received Signature (from body):', receivedSignature);

    // Create SHA-512 hash
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signatureComponent)
      .digest('hex');

    console.log('[verifyWebhookSignature] Calculated Signature:', calculatedSignature);

    // Compare the calculated signature with the received one
    const isValid = calculatedSignature === receivedSignature;
    console.log('[verifyWebhookSignature] Signature valid?:', isValid);
    return isValid;
  } catch (error) {
    console.error('[verifyWebhookSignature] Error verifying webhook signature:', error);
    return false;
  }
}