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
const snap = new midtransClient.Snap({
  isProduction: IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

// Initialize Midtrans Core API client for direct charges (used for subscription renewals)
export const coreApi = new midtransClient.CoreApi({
  isProduction: IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

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

    const transaction = await snap.createTransaction({
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
      credit_card: {
        secure: creditCardOptions?.secure ?? true,
        save_card: creditCardOptions?.saveCard ?? false,
        authentication: creditCardOptions?.authentication,
      },
    });

    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    };
  } catch (error) {
    console.error('Failed to create Midtrans transaction:', error);

    // Return mock response in case of error
    return {
      token: 'error-token-' + orderId,
      redirectUrl: 'https://example.com/payment/error/' + orderId,
    };
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
 * @returns boolean - Whether the signature is valid
 */
export function verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  serverKey = MIDTRANS_SIGNATURE_KEY,
  receivedSignature,
}: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey?: string;
  receivedSignature: string;
}): boolean {
  // Create the signature component string: order_id + status_code + gross_amount + server_key
  const signatureComponent = `${orderId}${statusCode}${grossAmount}${serverKey}`;

  // Create SHA-512 hash
  const calculatedSignature = crypto
    .createHash('sha512')
    .update(signatureComponent)
    .digest('hex');

  // Compare the calculated signature with the received one
  return calculatedSignature === receivedSignature;
}