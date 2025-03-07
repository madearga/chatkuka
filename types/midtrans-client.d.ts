declare module 'midtrans-client' {
  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    createTransaction(parameter: {
      transaction_details: {
        order_id: string;
        gross_amount: number;
      };
      customer_details?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        customer_id?: string;
        billing_address?: any;
        shipping_address?: any;
      };
      item_details?: Array<{
        id?: string;
        price: number;
        quantity: number;
        name: string;
        category?: string;
        merchant_name?: string;
        url?: string;
      }>;
      credit_card?: {
        secure?: boolean;
        bank?: string;
        installment?: {
          required?: boolean;
          terms?: {
            bni?: number[];
            mandiri?: number[];
            cimb?: number[];
            bca?: number[];
            offline?: number[];
          };
        };
        whitelist_bins?: string[];
        channel?: string;
        type?: string;
        save_card?: boolean;
      };
      custom_field1?: string;
      custom_field2?: string;
      custom_field3?: string;
    }): Promise<{
      token: string;
      redirect_url: string;
    }>;
  }

  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    charge(parameter: any): Promise<any>;
    capture(parameter: any): Promise<any>;
    cardToken(parameter: any): Promise<any>;
    cardRegister(parameter: any): Promise<any>;
    cardPointInquiry(tokenId: string): Promise<any>;
  }

  export class Transaction {
    static status(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      }
    ): Promise<any>;

    static statusb2b(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      }
    ): Promise<any>;

    static approve(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      }
    ): Promise<any>;

    static deny(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      }
    ): Promise<any>;

    static cancel(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      }
    ): Promise<any>;

    static expire(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      }
    ): Promise<any>;

    static refund(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      },
      parameter?: any
    ): Promise<any>;

    static refundDirect(
      transactionId: string,
      options: {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
      },
      parameter?: any
    ): Promise<any>;
  }

  export default {
    Snap,
    CoreApi,
    Transaction,
  };
} 