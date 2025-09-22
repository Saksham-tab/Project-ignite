import fetchApi from './apiConfig';
import { convertToINR } from '../utils/currency';

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  data: PaymentIntent;
}

export interface RazorpayOrder {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  data: RazorpayOrder;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export interface QRCodePayment {
  qr_code_url: string;
  payment_url: string;
  amount: number;
  currency: string;
  expires_at: string;
}

export interface QRCodeResponse {
  success: boolean;
  data: QRCodePayment;
}

/**
 * Stripe
 */
export const createPaymentIntent = async (amountUSD: number): Promise<PaymentIntentResponse> => {
  const amountINR = convertToINR(amountUSD);
  return fetchApi<PaymentIntentResponse>('payments/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountINR,
      currency: 'inr'
    })
  });
};

/**
 * Razorpay
 */
export const createRazorpayOrder = async (amountUSD: number, orderData?: any): Promise<RazorpayOrderResponse> => {
  const amountINR = convertToINR(amountUSD);
  return fetchApi<RazorpayOrderResponse>('api/payment/razorpay/create', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountINR,
      currency: 'INR',
      orderData,
      redirect: true,
      callback_url: `${window.location.origin}/payment-success`
    })
  });
};

export const verifyRazorpayPayment = async (paymentData: PaymentVerification): Promise<{ success: boolean }> => {
  return fetchApi<{ success: boolean }>('api/payment/razorpay/confirm', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

/**
 * QR Code
 */
export const createQRPayment = async (amountUSD: number, orderId?: string): Promise<QRCodeResponse> => {
  const amountINR = convertToINR(amountUSD);
  return fetchApi<QRCodeResponse>('payments/qr/create', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountINR,
      currency: 'INR',
      orderId
    })
  });
};

/**
 * Card Redirect
 */
export const redirectToCardPayment = async (amountUSD: number, orderId?: string): Promise<{ redirect_url: string }> => {
  const amountINR = convertToINR(amountUSD);
  return fetchApi<{ redirect_url: string }>('payments/card/redirect', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountINR,
      currency: 'INR',
      orderId,
      success_url: `${window.location.origin}/payment-success`,
      cancel_url: `${window.location.origin}/payment-cancel`
    })
  });
};

/**
 * PayU – New
 */
export const createPayURequest = async (amountUSD: number, orderId?: string): Promise<{ redirect_url: string }> => {
  const amountINR = convertToINR(amountUSD);
  return fetchApi<{ redirect_url: string }>('api/payment/payu/create', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountINR,
      currency: 'INR',
      orderId,
      success_url: `${window.location.origin}/payment-success`,
      failure_url: `${window.location.origin}/payment-cancel`
    })
  });
};

/**
 * Confirm Stripe (if needed)
 */
export const confirmPayment = async (paymentIntentId: string): Promise<{ success: boolean }> => {
  return fetchApi<{ success: boolean }>('payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ payment_intent_id: paymentIntentId })
  });
};

/**
 * COD
 */
export const createCODOrder = async (orderData: any): Promise<{ success: boolean; data: any }> => {
  return fetchApi<{ success: boolean; data: any }>('api/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...orderData,
      method: 'COD',
      status: 'Pending'
    })
  });
};

/**
 * Available Methods
 */
export const getPaymentMethods = async (): Promise<{ success: boolean; data: { methods: string[] } }> => {
  return fetchApi<{ success: boolean; data: { methods: string[] } }>('payments/methods');
};

export const confirmRazorpayPayment = async (paymentData: {
  payment_id: string;
  order_id: string;
  signature?: string;
}): Promise<{ success: boolean; data: any }> => {
  return fetchApi<{ success: boolean; data: any }>('api/payment/razorpay/confirm', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

export default {
  createPaymentIntent,
  createRazorpayOrder,
  createQRPayment,
  redirectToCardPayment,
  verifyRazorpayPayment,
  confirmPayment,
  getPaymentMethods,
  createCODOrder,
  confirmRazorpayPayment,
  createPayURequest
};
