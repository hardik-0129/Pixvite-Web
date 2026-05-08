"use client";

import { useEffect, useRef, useState } from "react";
import type { RazorpayPaymentFailedResponse, RazorpaySuccessResponse } from "@/types/razorpay-checkout";
import type { Template } from "@/lib/templates";
import { withBackendPrefix } from "@/lib/backend-url";

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  if (document.getElementById(RAZORPAY_SCRIPT_ID)) {
    return Promise.resolve(!!window.Razorpay);
  }
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  template: Template;
  /** Called after the server verifies the Razorpay signature (payment succeeded). */
  onPaymentSuccess?: (payload: { paymentId: string; orderId: string }) => void;
};

function formatRupee(n: number) {
  const v = Math.round(n * 100) / 100;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

type AppliedPricing = {
  coupon: string;
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
};

export function TemplateCheckoutModal({ open, onClose, template, onPaymentSuccess }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [pricing, setPricing] = useState<AppliedPricing | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponApplyMsg, setCouponApplyMsg] = useState<string | null>(null);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const mountedRef = useRef(false);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setCoupon("");
      setPricing(null);
      setCouponApplying(false);
      setCouponApplyMsg(null);
      setCheckoutInProgress(false);
      setPaymentError(null);
      setPaymentSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const display = (v: string) => (v.trim() ? v.trim() : "–");
  const lineTitle = `${template.id} | ${template.title}`;
  const subtotal = template.price;
  const total = pricing?.totalInr ?? subtotal;

  async function onApplyCoupon() {
    const c = coupon.trim();
    if (!c) return;
    setCouponApplyMsg(null);
    setPaymentError(null);
    setCouponApplying(true);
    try {
      const res = await fetch(withBackendPrefix("/api/coupons/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, code: c }),
      });
      const data: unknown = await res.json().catch(() => null);
      const errMsg =
        typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : !res.ok
            ? "Could not validate coupon"
            : null;
      if (!res.ok || errMsg) {
        setPricing(null);
        setCouponApplyMsg(errMsg ?? "Invalid coupon");
        return;
      }
      const ok = data as {
        subtotalInr?: number;
        discountInr?: number;
        totalInr?: number;
        coupon?: string | null;
      };
      const rowSubtotal =
        typeof ok.subtotalInr === "number" && Number.isFinite(ok.subtotalInr) ? ok.subtotalInr : subtotal;
      const discountInr =
        typeof ok.discountInr === "number" && Number.isFinite(ok.discountInr) ? ok.discountInr : 0;
      const totalInr =
        typeof ok.totalInr === "number" && Number.isFinite(ok.totalInr) ? ok.totalInr : subtotal;
      const appliedCode = typeof ok.coupon === "string" && ok.coupon ? ok.coupon : c.toUpperCase();
      setPricing({
        coupon: appliedCode,
        subtotalInr: rowSubtotal,
        discountInr,
        totalInr,
      });
      setCouponApplyMsg(
        discountInr > 0 ? `Coupon applied · You save ${formatRupee(discountInr)}` : "Coupon applied (no discount for this cart)."
      );
    } catch {
      setPricing(null);
      setCouponApplyMsg("Network error — try again.");
    } finally {
      setCouponApplying(false);
    }
  }

  async function handlePaySecurely() {
    setPaymentError(null);
    if (coupon.trim() && !pricing) {
      setPaymentError('Tap “Apply” to verify your coupon, or clear the coupon field to pay full price.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setPaymentError("Please fill in all fields.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setPaymentError("Please enter a valid email address.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPaymentError("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    let sessionClosed = false;
    const finishCheckout = () => {
      if (sessionClosed) return;
      sessionClosed = true;
      if (mountedRef.current) {
        setCheckoutInProgress(false);
      }
    };

    if (mountedRef.current) {
      setCheckoutInProgress(true);
    }
    try {
      const res = await fetch(withBackendPrefix("/api/payments/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: digits,
          coupon: pricing?.coupon ?? undefined,
        }),
      });
      if (!mountedRef.current || !openRef.current) {
        finishCheckout();
        return;
      }
      const data: unknown = await res.json().catch(() => (null));
      const errMsg =
        typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Could not start checkout";
      if (!res.ok) {
        throw new Error(errMsg);
      }

      const parsed = data as { keyId?: string; orderId?: string; currency?: string };
      if (!parsed.keyId || !parsed.orderId || !parsed.currency) {
        throw new Error("Invalid response from payment server");
      }

      const scriptOk = await loadRazorpayScript();
      if (!mountedRef.current || !openRef.current) {
        finishCheckout();
        return;
      }
      if (!scriptOk || !window.Razorpay) {
        throw new Error("Payment script could not be loaded. Check your connection.");
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const rzp = new window.Razorpay({
        key: parsed.keyId,
        currency: parsed.currency,
        name: "Pixvite",
        description: template.title,
        order_id: parsed.orderId,
        prefill: {
          name: fullName,
          email: email.trim(),
          contact: digits,
        },
        theme: { color: "#ff4081" },
        modal: {
          ondismiss: () => {
            finishCheckout();
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const v = await fetch(withBackendPrefix("/api/payments/verify"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!mountedRef.current) {
              finishCheckout();
              return;
            }
            const vd: unknown = await v.json().catch(() => (null));
            const verifyErr =
              typeof vd === "object" && vd !== null && "error" in vd && typeof (vd as { error: unknown }).error === "string"
                ? (vd as { error: string }).error
                : "Verification failed";
            if (!v.ok || (typeof vd === "object" && vd !== null && (vd as { verified?: boolean }).verified !== true)) {
              throw new Error(verifyErr);
            }
            if (!mountedRef.current) {
              finishCheckout();
              return;
            }
            setPaymentSuccess(true);
            onPaymentSuccess?.({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });
          } catch (e) {
            if (mountedRef.current) {
              setPaymentError(e instanceof Error ? e.message : "Verification failed");
            }
          } finally {
            finishCheckout();
          }
        },
      });

      rzp.on("payment.failed", (fail: RazorpayPaymentFailedResponse) => {
        const desc = fail.error?.description ?? "Payment failed";
        if (mountedRef.current) {
          setPaymentError(desc);
        }
        finishCheckout();
      });

      if (!mountedRef.current || !openRef.current) {
        finishCheckout();
        return;
      }
      rzp.open();
    } catch (e) {
      finishCheckout();
      if (mountedRef.current) {
        setPaymentError(e instanceof Error ? e.message : "Something went wrong");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[2000]" role="presentation">
      {/* Backdrop separate from modal so backdrop-filter never blurs the dialog (Chrome compositor bug) */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 py-2 xs:px-3 xs:py-3 sm:px-4 sm:py-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
          className="pointer-events-auto relative z-10 max-h-[95vh] w-full max-w-full overflow-hidden rounded-xl border-2 border-[var(--brand-end)] bg-white text-[var(--foreground)] shadow-2xl xs:max-w-lg xs:rounded-2xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl"
          style={{
            boxShadow: "0 20px 80px rgba(0,0,0,0.35)",
            isolation: "isolate",
          }}
        >
          <div className="flex h-full max-h-[95vh] flex-col bg-white p-0">
          <div className="flex max-h-[calc(95vh-80px)] flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 xs:max-h-[calc(95vh-90px)] xs:gap-5 xs:p-5 sm:max-h-[calc(95vh-100px)] sm:gap-6 sm:p-6 md:flex-row md:gap-7 md:p-7 lg:gap-8 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar]:w-1">
            <div className="flex min-w-0 flex-1 flex-col gap-2 xs:gap-2.5 sm:gap-3">
              <h3
                id="checkout-modal-title"
                className="mb-0.5 mt-0.5 text-base font-bold xs:mb-1 xs:mt-1 xs:text-lg sm:text-xl"
                style={{ fontFamily: "var(--font-header)" }}
              >
                {paymentSuccess ? "Payment successful" : "Complete Your Details"}
              </h3>
              {paymentError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  {paymentError}
                </p>
              ) : null}
              {paymentSuccess ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Thank you. Your payment was verified. You can close this window or continue editing your invite.
                </p>
              ) : null}
              <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className={paymentSuccess ? "pointer-events-none opacity-50" : ""}>
                <div className="flex flex-col gap-2 xs:gap-2.5">
                  <div className="grid grid-cols-2 gap-2 xs:gap-2.5">
                    <input
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      className="rounded-lg border border-[var(--border-card)] bg-white p-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-end)] xs:rounded-md xs:p-2.5 xs:text-base"
                      placeholder="First Name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <input
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      className="rounded-lg border border-[var(--border-card)] bg-white p-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-end)] xs:rounded-md xs:p-2.5 xs:text-base"
                      placeholder="Last Name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <input
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="rounded-lg border border-[var(--border-card)] bg-white p-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-end)] xs:rounded-md xs:p-2.5 xs:text-base"
                    placeholder="your@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="rounded-lg border border-[var(--border-card)] bg-white p-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-end)] xs:rounded-md xs:p-2.5 xs:text-base"
                    placeholder="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </form>
              <div className={`flex gap-2 xs:gap-2.5 ${paymentSuccess ? "pointer-events-none opacity-50" : ""}`}>
                <input
                  className="flex-1 rounded-lg border border-[var(--border-card)] bg-white p-2 text-sm uppercase text-[var(--text-primary)] placeholder:normal-case placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-end)] xs:rounded-md xs:p-2.5 xs:text-base"
                  placeholder="Coupon Code (optional)"
                  type="text"
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setPricing(null);
                    setCouponApplyMsg(null);
                  }}
                />
                <button
                  type="button"
                  disabled={!coupon.trim() || couponApplying}
                  className="rounded-lg bg-[var(--brand-end)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 xs:rounded-md xs:px-4 xs:py-2.5 xs:text-sm sm:px-5"
                  onClick={() => void onApplyCoupon()}
                >
                  {couponApplying ? "…" : "Apply"}
                </button>
              </div>
              {couponApplyMsg ? (
                <p
                  className={`text-xs xs:text-sm ${couponApplyMsg.startsWith("Coupon applied") ? "text-emerald-700" : "text-red-700"}`}
                  role={couponApplyMsg.startsWith("Coupon applied") ? "status" : "alert"}
                >
                  {couponApplyMsg}
                </p>
              ) : null}
            </div>

            <div
              className={`mt-2 w-full flex-shrink-0 xs:mt-2.5 sm:mt-3 md:mt-4 md:w-auto md:min-w-[280px] lg:mt-7 lg:min-w-[300px] xl:min-w-[320px] ${paymentSuccess ? "pointer-events-none opacity-50" : ""}`}
            >
              <div className="rounded-lg bg-[var(--muted)]/80 p-3 xs:rounded-xl xs:p-3.5 sm:p-4 md:p-5">
                <h4 className="mb-1.5 text-sm font-bold xs:mb-2 xs:text-base">Order Summary</h4>
                <div className="flex flex-col gap-1 text-xs xs:gap-1.5 xs:text-sm">
                  <div className="break-words">
                    <span className="font-semibold">Template:</span>{" "}
                    <span className="break-words">{lineTitle}</span>
                  </div>
                  <div className="break-words">
                    <span className="font-semibold">First Name:</span>{" "}
                    <span className="break-words">{display(firstName)}</span>
                  </div>
                  <div className="break-words">
                    <span className="font-semibold">Last Name:</span>{" "}
                    <span className="break-words">{display(lastName)}</span>
                  </div>
                  <div className="break-words">
                    <span className="font-semibold">Email:</span> <span className="break-words">{display(email)}</span>
                  </div>
                  <div className="break-words">
                    <span className="font-semibold">Phone:</span> <span className="break-words">{display(phone)}</span>
                  </div>
                  <div className="break-words">
                    <span className="font-semibold">Coupon:</span>{" "}
                    <span className="break-words">{pricing?.coupon ?? (coupon.trim() ? display(coupon) : "–")}</span>
                  </div>
                  <div className="border-border/50 mt-1 border-t pt-1.5 xs:mt-1.5 xs:pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Subtotal:</span>
                      <span>{formatRupee(subtotal)}</span>
                    </div>
                    {(pricing?.discountInr ?? 0) > 0 ? (
                      <div className="mt-0.5 flex justify-between text-emerald-700 xs:mt-1">
                        <span className="font-semibold">Discount:</span>
                        <span>-{formatRupee(pricing!.discountInr)}</span>
                      </div>
                    ) : null}
                    <div className="border-border/50 mt-1 flex justify-between border-t pt-1 text-sm font-bold xs:mt-1.5 xs:pt-1.5 xs:text-base">
                      <span>Total:</span>
                      <span>{formatRupee(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 left-0 right-0 z-10 mt-auto flex flex-col gap-2 border-t border-[var(--border-card)] bg-white px-4 py-2.5 xs:flex-row xs:gap-2.5 xs:px-5 xs:py-3 sm:px-6 sm:py-3.5">
            <button
              type="button"
              disabled={checkoutInProgress || paymentSuccess}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 xs:rounded-md xs:py-3 xs:text-base"
              style={{
                background: "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
              }}
              onClick={handlePaySecurely}
            >
              {checkoutInProgress ? "Please wait…" : paymentSuccess ? "Paid" : "Pay with Razorpay"}
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border-2 border-[var(--border-card)] bg-white py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]/60 xs:rounded-md xs:py-3 xs:text-base"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
