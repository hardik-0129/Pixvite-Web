/** Minimal typings for https://checkout.razorpay.com/v1/checkout.js */

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayPaymentFailedResponse = {
  error: {
    code: string;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
};

export type RazorpayCheckoutOptions = {
  key: string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  /** Amount in paise (recommended when using order flow for display consistency). */
  amount?: number;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
};

export type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", fn: (response: RazorpayPaymentFailedResponse) => void) => void;
};

export type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export {};
