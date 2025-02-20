import midtransClient from 'midtrans-client';

// Validate required environment variables
if (!process.env.MIDTRANS_SERVER_KEY) {
  throw new Error('MIDTRANS_SERVER_KEY is not configured in environment variables');
}

if (!process.env.MIDTRANS_CLIENT_KEY) {
  throw new Error('MIDTRANS_CLIENT_KEY is not configured in environment variables');
}

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
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
    throw error;
  }
}

export function generateOrderId(prefix = 'ORDER') {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
} 