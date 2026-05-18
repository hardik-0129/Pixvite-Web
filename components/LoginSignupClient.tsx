"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { withBackendPrefix } from "@/lib/backend-url";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (credential: { credential: string }) => void }) => void;
          renderButton: (
            element: HTMLElement,
            options: { type: string; theme: string; size: string; text?: string; width?: number }
          ) => void;
        };
      };
    };
  }
}

type Mode = "login" | "signup" | "forgot-email" | "forgot-reset";

function EyeToggleIcon({ open }: { open: boolean }) {
  if (!open) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path
          fill="currentColor"
          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3"
        />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="currentColor"
        d="M11.83 9L15 12.17V12a3 3 0 00-3-3h-.17M9.83 9H9a3 3 0 000 6h.17M2.46 14.93L4.93 12.46A11.93 11.93 0 0112 9c4.73 0 8.93 3.41 11 8.46l-.77 1.16A22 22 0 0112 19c-4.73 0-8.93-3.41-11-8.54M4.07 7.93L19.93 21.93l-.7.71L3.37 8.63l.7-.7"
      />
    </svg>
  );
}


const primaryActionClass =
  "bg_linear inline-flex w-full cursor-pointer items-center justify-center rounded-[10px] border-0 px-3 py-2.5 text-center text-[14px] font-semibold leading-tight !text-white shadow-sm transition-[filter,box-shadow] disabled:cursor-not-allowed [--tw-text-opacity:1]";

function FloatingInput({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  required,
  rightElement,
  inputMode,
  preventAutofill,
}: {
  id: string;
  name?: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  rightElement?: ReactNode;
  inputMode?: "text" | "numeric" | "email" | "search" | "tel" | "url" | "decimal" | "none";
  preventAutofill?: boolean;
}) {
  const [readOnly, setReadOnly] = useState(!!preventAutofill);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-[#1c3048]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete ?? "off"}
          required={required}
          readOnly={readOnly}
          onFocus={() => { if (readOnly) setReadOnly(false); }}
          value={value}
          onChange={onChange}
          inputMode={inputMode}
          className={`w-full h-[46px] rounded-[10px] border border-[#b8c5d8] bg-[#f0f5fb] px-[14px] text-[14px] text-[#1c3048] outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_1px_3px_rgba(15,23,42,0.08)] focus:border-[#5961F8] focus:bg-white focus:shadow-[0_0_0_3px_rgba(89,97,248,0.2),0_2px_8px_rgba(15,23,42,0.08)]${rightElement ? " pr-[47px]" : ""}`}
        />
        {rightElement && (
          <div className="absolute bottom-0 right-2 top-0 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginSignupClient() {
  const router = useRouter();
  const loginFormRef = useRef<HTMLFormElement>(null);

  const [mode, setMode] = useState<Mode>("login");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleBtnVisible, setGoogleBtnVisible] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Redirect already-logged-in users away from the login page
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("pixvite_token")) {
      router.replace("/");
    }
  }, [router]);

  // If the Google script was already loaded by a previous render (client-side nav),
  // window.google is already available — set ready immediately without waiting for onLoad.
  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      setGoogleReady(true);
    }
  }, []);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [signupOtpSent, setSignupOtpSent] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState("");

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const handleGoogleCredential = useCallback(async (payload: { credential: string }) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(withBackendPrefix("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: payload.credential }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; token?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.message ?? "Google sign-in failed.");
        return;
      }
      if (data.token) {
        localStorage.setItem("pixvite_token", data.token);
        window.dispatchEvent(new Event("pixvite-auth-change"));
      }
      redirectAfterAuth();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const googleInitialized = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleReady || !clientId || !googleBtnRef.current || typeof window === "undefined" || !window.google) return;

    if (!googleInitialized.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
      googleInitialized.current = true;
    }

    googleBtnRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 240,
      text: "signin_with",
    });
    setGoogleBtnVisible(true);
  }, [googleReady, mode, handleGoogleCredential]);

  async function sendOtp(email: string) {
    if (!email) {
      setMessage("Please enter email first.");
      return;
    }
    setSendingOtp(true);
    setMessage("");
    try {
      const res = await fetch(withBackendPrefix("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; devOtp?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to send OTP.");
        return;
      }
      setSignupOtpSent(true);
      setMessage(data.devOtp ? `OTP sent. (Dev OTP: ${data.devOtp})` : "OTP sent. Check your email.");
    } catch {
      setMessage("Network error while sending OTP.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleForgotSendOtp() {
    const email = forgotEmail.trim();
    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }
    setSendingOtp(true);
    setMessage("");
    try {
      const res = await fetch(withBackendPrefix("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; devOtp?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to send OTP.");
        return;
      }
      setResendTimer(30);
      setMode("forgot-reset");
      setMessage(data.devOtp ? `OTP sent. (Dev OTP: ${data.devOtp})` : "");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleForgotResendOtp() {
    if (resendTimer > 0) return;
    setSendingOtp(true);
    setMessage("");
    try {
      const res = await fetch(withBackendPrefix("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; devOtp?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to resend OTP.");
        return;
      }
      setResendTimer(30);
      setMessage(data.devOtp ? `OTP resent. (Dev OTP: ${data.devOtp})` : "OTP resent. Check your email.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResetPassword(e: { preventDefault(): void }) {
    e.preventDefault();
    if (forgotNewPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(withBackendPrefix("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.message ?? "Failed to reset password.");
        return;
      }
      // Success — go back to login
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setMode("login");
      setMessage("Password reset successfully. Please log in.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function redirectAfterAuth() {
    router.push("/");
  }

  async function handleSignIn(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(withBackendPrefix("/api/auth/signin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          role: "user",
          password: loginPassword,
        }),
      });
      const data = (await res.json()) as { message?: string; token?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Sign in failed.");
        return;
      }
      if (data.token) {
        localStorage.setItem("pixvite_token", data.token);
        window.dispatchEvent(new Event("pixvite-auth-change"));
      }
      setMessage("Signed in successfully.");
      redirectAfterAuth();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!signupOtpSent) return;

    if (!agreeTerms) {
      setMessage("Please accept Terms of Service and Privacy Policy.");
      return;
    }
    if (signupPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setMessage("Password and confirm password do not match.");
      return;
    }

    const [firstName, ...rest] = signupName.trim().split(/\s+/);
    const lastName = rest.join(" ") || "-";

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(withBackendPrefix("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: signupEmail,
          password: signupPassword,
          role: "user",
          otp: signupOtp,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Sign up failed.");
        return;
      }
      setMessage("Account created successfully.");
      redirectAfterAuth();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "login" ? "Welcome Back to  InvitesMagic !" :
    mode === "signup" ? "Create an Account" :
    mode === "forgot-email" ? "Forgot your password?" :
    "Reset Your Password";

  const subtitle =
    mode === "login" ? "It sure is great to see you again." :
    mode === "signup" ? "Create a free account and start making beautiful invites!" :
    mode === "forgot-email" ? "Enter the email you used to create your account and we'll send you a reset OTP." :
    null;

  const showGoogleSection = mode === "login" || mode === "signup";

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
      <div
        className="fixed inset-0 z-[999] overflow-y-auto"
        style={{ backgroundColor: "rgba(28, 39, 48, 0.5)", backdropFilter: "blur(4px)" }}
      >
        <div className="flex min-h-full items-center justify-center px-4 pb-4 pt-24 sm:p-6">
          <div className="relative w-full max-w-[480px]">
            <div className="relative rounded-2xl bg-white px-5 pb-7 pt-11 shadow-2xl sm:px-8 sm:pb-8 sm:pt-12">
              <button
                type="button"
                aria-label="Close"
                className="absolute right-4 top-4 z-[100] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#5961F8] focus-visible:ring-offset-2"
                onClick={() => router.back()}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="m4 4 8 8m-8 0 8-8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
                </svg>
              </button>

              <div className="mb-2 text-center">
                <h2 className="text-[18px] font-semibold leading-tight text-black sm:text-[22px]">{title}</h2>
              </div>

              {subtitle && (
                <p className="mb-5 text-center text-[13px] leading-snug sm:text-[15px]" style={{ color: "rgb(28, 48, 72)" }}>
                  {subtitle}
                </p>
              )}

              {showGoogleSection && (
                <>
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-[44px] items-center justify-center">
                      <div ref={googleBtnRef} className="flex items-center justify-center [&>div]:justify-center" />
                    </div>
                  </div>
                  {googleBtnVisible && (
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#ABB2C7]" />
                      <p className="text-[14px] text-black sm:text-[16px]">or</p>
                      <div className="h-px flex-1 bg-[#ABB2C7]" />
                    </div>
                  )}
                </>
              )}

              {/* ── LOGIN ── */}
              {mode === "login" && (
                <>
                  <form ref={loginFormRef} onSubmit={handleSignIn} className="flex flex-col gap-3" autoComplete="off">
                    {/* Hidden dummy inputs absorb browser autofill before the real fields */}
                    <input type="text" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
                    <input type="password" style={{ display: "none" }} aria-hidden="true" readOnly tabIndex={-1} />
                    <FloatingInput
                      id="login-email"
                      name="login-email-field"
                      label="Email"
                      type="email"
                      autoComplete="off"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      preventAutofill
                    />
                    <FloatingInput
                      id="login-password"
                      name="login-password-field"
                      label="Password"
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="off"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      preventAutofill
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          <EyeToggleIcon open={showLoginPassword} />
                        </button>
                      }
                    />
                    <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>Submit</button>
                  </form>

                  <button
                    type="button"
                    onClick={() => { setMode("forgot-email"); setMessage(""); }}
                    className="mb-3 mt-2 cursor-pointer text-left text-[13px] text-[#5961F8] sm:text-[14px]"
                  >
                    Forgot your Password?
                  </button>

                  <button
                    type="button"
                    onClick={() => loginFormRef.current?.requestSubmit()}
                    className={`${primaryActionClass} min-h-[44px]`}
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Log in"}
                  </button>

                  <p className="mt-3 text-center text-[13px] text-black">
                    New to  InvitesMagic?{" "}
                    <button type="button" onClick={() => { setMode("signup"); setMessage(""); }} className="cursor-pointer text-[#5961F8]">
                      Create an account
                    </button>
                  </p>
                </>
              )}

              {/* ── SIGNUP ── */}
              {mode === "signup" && (
                <form onSubmit={handleSignUp} className="flex flex-col gap-2.5">
                  <FloatingInput
                    id="signup-name"
                    name="name"
                    label="Name"
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                  <FloatingInput
                    id="signup-email"
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      setSignupOtpSent(false);
                      setSignupOtp("");
                    }}
                    required
                  />
                  <FloatingInput
                    id="signup-password"
                    name="signup-password"
                    label="Password"
                    type={showSignupPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    rightElement={
                      <button
                        type="button"
                        className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      >
                        <EyeToggleIcon open={showSignupPassword} />
                      </button>
                    }
                  />
                  <FloatingInput
                    id="signup-confirm-password"
                    name="signup-confirm-password"
                    label="Confirm Password"
                    type={showSignupConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    rightElement={
                      <button
                        type="button"
                        className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                        onClick={() => setShowSignupConfirmPassword((v) => !v)}
                        aria-label={showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        <EyeToggleIcon open={showSignupConfirmPassword} />
                      </button>
                    }
                  />

                  {signupOtpSent ? (
                    <FloatingInput
                      id="signup-otp"
                      name="otp"
                      label="Enter OTP"
                      inputMode="numeric"
                      value={signupOtp}
                      onChange={(e) => setSignupOtp(e.target.value)}
                      required
                    />
                  ) : null}

                  <div className="flex items-start gap-2">
                    <input
                      id="signup-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border border-gray-300 bg-gray-50"
                    />
                    <label htmlFor="signup-terms" className="text-[12px] leading-snug text-gray-500 sm:text-[13px]">
                      I agree to InvitesMagic {" "}
                      <Link href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-[#5961F8]">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#5961F8]">Privacy Policy</Link>
                    </label>
                  </div>

                  {!signupOtpSent ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void sendOtp(signupEmail)}
                        disabled={sendingOtp}
                        className={`${primaryActionClass} min-h-[44px]`}
                        style={{ textTransform: "unset" }}
                      >
                        {sendingOtp ? "Sending OTP..." : "Send Otp"}
                      </button>
                    </div>
                  ) : (
                    <button type="submit" disabled={loading} className={`${primaryActionClass} mb-1 min-h-[44px]`}>
                      {loading ? "Creating account..." : "Create Account"}
                    </button>
                  )}

                  <p className="mt-1 pb-1 text-center text-[13px] text-black">
                    Already have an account?{" "}
                    <button type="button" className="cursor-pointer text-[#5961F8]" onClick={() => { setMode("login"); setMessage(""); }}>
                      Log in
                    </button>
                  </p>
                </form>
              )}

              {/* ── FORGOT PASSWORD — STEP 1: Email ── */}
              {mode === "forgot-email" && (
                <div className="flex flex-col gap-3">
                  <FloatingInput
                    id="forgot-email"
                    label="Email"
                    type="email"
                    autoComplete="off"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => void handleForgotSendOtp()}
                    disabled={sendingOtp}
                    className={`${primaryActionClass} min-h-[44px]`}
                  >
                    {sendingOtp ? "Sending OTP..." : "Send Otp"}
                  </button>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-[13px] text-gray-600 transition hover:bg-gray-100"
                      onClick={() => { setMode("signup"); setMessage(""); setForgotEmail(""); }}
                    >
                      Don&apos;t have an account?{" "}
                      <span className="font-medium" style={{ color: "var(--brand-end)" }}>Create one free</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── FORGOT PASSWORD — STEP 2: OTP + New Password ── */}
              {mode === "forgot-reset" && (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                  <div className="mb-1 rounded-xl bg-[#f8f9fc] px-4 py-3 text-center text-[13px] leading-snug text-[#1c3048]">
                    A verification code (OTP) has been sent to your email:
                    <div className="mt-0.5 font-semibold" style={{ color: "var(--brand-end)" }}>
                      {forgotEmail}
                    </div>
                    <div className="mt-1 text-[12px] text-gray-500">
                      Please check your inbox and use the OTP to create a new password, then log in again.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <FloatingInput
                        id="forgot-otp"
                        label="Enter OTP"
                        inputMode="numeric"
                        autoComplete="off"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleForgotResendOtp()}
                      disabled={resendTimer > 0 || sendingOtp}
                      className="shrink-0 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                    </button>
                  </div>

                  <FloatingInput
                    id="forgot-new-password"
                    label="Enter New Password"
                    type={showForgotNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword((v) => !v)}
                        className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                        aria-label={showForgotNewPassword ? "Hide password" : "Show password"}
                      >
                        <EyeToggleIcon open={showForgotNewPassword} />
                      </button>
                    }
                  />
                  <FloatingInput
                    id="forgot-confirm-password"
                    label="Enter Confirm Password"
                    type={showForgotConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    required
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword((v) => !v)}
                        className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                        aria-label={showForgotConfirmPassword ? "Hide password" : "Show password"}
                      >
                        <EyeToggleIcon open={showForgotConfirmPassword} />
                      </button>
                    }
                  />

                  <button type="submit" disabled={loading} className={`${primaryActionClass} min-h-[44px]`}>
                    {loading ? "Updating..." : "Update Password"}
                  </button>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-[13px] text-gray-600 transition hover:bg-gray-100"
                      onClick={() => { setMode("signup"); setMessage(""); }}
                    >
                      Don&apos;t have an account?{" "}
                      <span className="font-medium" style={{ color: "var(--brand-end)" }}>Create one free</span>
                      <span>→</span>
                    </button>
                  </div>
                </form>
              )}

              {message ? (
                <p className="mt-2 text-center text-[12px] leading-snug text-[#475569] sm:text-[13px]">{message}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
