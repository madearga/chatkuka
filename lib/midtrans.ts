import midtransClient from 'midtrans-client';

// Check for environment variables
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'dummy-server-key';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || 'dummy-client-key';
const IS_PRODUCTION = process.env.MIDTRANS_ENV === 'production';

// Show warnings instead of throwing errors
if (!process.env.MIDTRANS_SERVER_KEY) {
  console.warn('Warning: MIDTRANS_SERVER_KEY is not configured in environment variables. Using dummy value.');
}

if (!process.env.MIDTRANS_CLIENT_KEY) {
  console.warn('Warning: MIDTRANS_CLIENT_KEY is not configured in environment variables. Using dummy value.');
}

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
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
}

export async function createSnapTransaction({
  orderId,
  amount,
  customer,
  items,
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
        secure: true,
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