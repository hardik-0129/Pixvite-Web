"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

type Mode = "login" | "signup";

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

function GoogleFallbackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center gap-3 rounded-md border border-gray-300 bg-white px-4 text-[14px] font-medium text-[#1f2937] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-gray-50"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.962 3.046l5.682-5.682C34.068 6.068 29.379 4 24 4 16.047 4 9.074 10.074 9.074 18S16.047 32 24 32c11.05 0 18.074-10.074 18.074-18 0-1.14-.098-2.274-.463-3.917z"
        />
        <path
          fill="#FF3D00"
          d="m6.306 14.691 6.571 4.819C14.463 17.074 18.961 13 24 13c3.059 0 5.842 1.155 7.962 3.046l5.682-5.682C34.069 6.068 29.379 4 24 4 16.34 4 10.067 9.114 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.074 0 9.849-2.004 13.478-5.591l-6.069-5.092C29.834 34.959 26.957 37 23.95 37c-4.11 0-7.6-2.702-8.849-6.459L6.089 34.957C10.069 41.086 15.956 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083 42 20H24v8h11.303a12.072 12.072 0 01-5.069 8.086l-.003-.002 6.07 5.086C41.086 43.068 43.611 20.083 43.611 20.083"
        />
      </svg>
      Sign in with Google
    </button>
  );
}

const authFieldStyles =
  "w-full rounded-[10px] h-[42px] border border-[#b8c5d8] bg-[#f0f5fb] px-[14px] text-[14px] text-[#1c3048] shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_1px_3px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-[#A5AAB5]/80 focus:border-[#5961F8] focus:bg-white focus:shadow-[0_0_0_3px_rgba(89,97,248,0.2),0_2px_8px_rgba(15,23,42,0.08)] sm:h-[44px] sm:text-[15px]";

const fieldGapClass = "flex flex-col gap-2";
const labelMbClass = "mb-1 block text-[13px] font-medium sm:text-[14px]";

const primaryActionClass =
  "bg_linear inline-flex w-full cursor-pointer items-center justify-center rounded-[10px] border-0 px-3 py-2.5 text-center text-[14px] font-semibold leading-tight !text-white shadow-sm transition-[filter,box-shadow] disabled:cursor-not-allowed [--tw-text-opacity:1]";

export function LoginSignupClient() {
  const router = useRouter();
  const loginFormRef = useRef<HTMLFormElement>(null);

  const [mode, setMode] = useState<Mode>("login");
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [signupOtpSent, setSignupOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState("");

  const handleGoogleCredential = useCallback((_payload: { credential: string }) => {
    setMessage("Google account connected. Server-side Google verification can be added next.");
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

  function redirectAfterAuth() {
    router.push("/");
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
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
      }
      setMessage("Signed in successfully.");
      redirectAfterAuth();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
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
    mode === "login"
      ? "Welcome Back to Myvideoinvites!"
      : "Create an Account";
  const subtitle =
    mode === "login"
      ? "It sure is great to see you again."
      : "Sign up now and start your journey with Myvideoinvites (it's free)!";

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto"
        style={{ backgroundColor: "rgba(28, 39, 48, 0.5)", backdropFilter: "blur(4px)" }}
      >
        <div
          className="box-border flex w-full max-w-[min(100%,32rem)] flex-col items-stretch justify-center max-sm:fixed max-sm:bottom-0 max-sm:max-w-none max-sm:rounded-t-xl max-sm:bg-transparent sm:mx-auto sm:rounded-xl"
          style={{ transition: "transform 0.2s ease-in-out", margin: "auto 0", willChange: "transform" }}
        >
          <div className="relative m-2 w-full max-w-[min(100%,28rem)] rounded-2xl bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] max-sm:mx-auto max-sm:w-[calc(100%-1rem)] max-sm:rounded-t-xl sm:max-w-[28rem] md:max-w-[30rem] sm:rounded-xl">
              <button
                type="button"
                aria-label="Close"
                className="absolute right-3 top-3 z-[100] flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-[#1c3048] transition hover:bg-gray-100 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#5961F8] focus-visible:ring-offset-2"
                onClick={() => router.back()}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#1c3048]"
                  aria-hidden
                >
                  <path
                    d="m4 4 8 8m-8 0 8-8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2.25"
                  />
                </svg>
              </button>

              <div className="flex flex-row items-center justify-center px-6 pb-0.5 pt-11 sm:px-8 sm:pt-12">
                <h2 className="text-center text-[21px] font-semibold leading-tight text-black sm:text-[28px]">{title}</h2>
              </div>

              <div className="px-6 pb-4 pt-1 sm:px-8 sm:pb-4">
                <p
                  className="mx-auto max-w-[40ch] text-center text-[13px] leading-snug sm:text-[15px]"
                  style={{ color: "rgb(28, 48, 72)" }}
                >
                  {subtitle}
                </p>

                <div className="mt-2 flex flex-col gap-2 sm:mt-2.5">
                  <div className="flex w-full justify-center pt-0.5">
                    <div className="flex h-9 shrink-0 items-center justify-center sm:h-[38px]">
                      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                        <div ref={googleBtnRef} className="flex items-center justify-center [&>div]:justify-center" />
                      ) : (
                        <GoogleFallbackButton onClick={() => setMessage("Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google.")} />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="h-px w-[45%] bg-[#ABB2C7]" />
                    <p className="text-[14px] text-black sm:text-[16px]">or</p>
                    <div className="h-px w-[45%] bg-[#ABB2C7]" />
                  </div>

                  {mode === "login" ? (
                    <>
                      <form ref={loginFormRef} onSubmit={handleSignIn}>
                        <div className={fieldGapClass}>
                          <div>
                            <label htmlFor="login-email" className={labelMbClass} style={{ color: "rgb(165, 170, 181)" }}>
                              Email
                            </label>
                            <input
                              id="login-email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              required
                              placeholder=" "
                              className={authFieldStyles}
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                            />
                          </div>

                          <div className="w-full">
                            <label htmlFor="login-password" className={labelMbClass} style={{ color: "rgb(165, 170, 181)" }}>
                              Password
                            </label>
                            <div className="relative">
                              <input
                                id="login-password"
                                name="password"
                                type={showLoginPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                placeholder=" "
                                className={`${authFieldStyles} pl-[14px] pr-[47px]`}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                              />
                              <div className="absolute bottom-0 right-2 top-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setShowLoginPassword((v) => !v)}
                                  className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                >
                                  <EyeToggleIcon open={showLoginPassword} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
                            Submit
                          </button>
                        </div>
                      </form>

                      <button
                        type="button"
                        onClick={() => setMessage("Forgot password reset can be wired next.")}
                        className="mt-1 mb-2 cursor-pointer text-left text-[13px] text-[#5961F8] sm:text-[14px]"
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

                      <p className="mt-2 text-center text-[13px] text-black">
                        New to Myvideoinvites?
                        <button
                          type="button"
                          onClick={() => {
                            setMode("signup");
                            setMessage("");
                          }}
                          className="text-[#5961F8]"
                        >
                          <span className="cursor-pointer"> Create an account</span>
                        </button>
                      </p>
                    </>
                  ) : (
                    <form onSubmit={handleSignUp}>
                      <div className={fieldGapClass}>
                        <div>
                          <label htmlFor="signup-name" className={`${labelMbClass} text-[#A5AAB5]`}>
                            Name
                          </label>
                          <input
                            id="signup-name"
                            name="name"
                            autoComplete="name"
                            required
                            placeholder=" "
                            className={authFieldStyles}
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="signup-email" className={`${labelMbClass} text-[#A5AAB5]`}>
                            Email
                          </label>
                          <input
                            id="signup-email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            required
                            placeholder=" "
                            className={authFieldStyles}
                            value={signupEmail}
                            onChange={(e) => {
                              setSignupEmail(e.target.value);
                              setSignupOtpSent(false);
                              setSignupOtp("");
                            }}
                          />
                        </div>

                        <div className="w-full">
                          <label htmlFor="signup-password" className={`${labelMbClass} text-[#A5AAB5]`}>
                            Password
                          </label>
                          <div className="relative">
                            <input
                              id="signup-password"
                              type={showSignupPassword ? "text" : "password"}
                              name="signup-password"
                              autoComplete="new-password"
                              required
                              placeholder=" "
                              className={`${authFieldStyles} pl-[14px] pr-[47px]`}
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                            />
                            <div className="absolute bottom-0 right-2 top-0 flex items-center">
                              <button
                                type="button"
                                className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                                onClick={() => setShowSignupPassword((v) => !v)}
                                aria-label={showSignupPassword ? "Hide password" : "Show password"}
                              >
                                <EyeToggleIcon open={showSignupPassword} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="w-full">
                          <label htmlFor="signup-confirm-password" className={`${labelMbClass} text-[#A5AAB5]`}>
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              id="signup-confirm-password"
                              type={showSignupConfirmPassword ? "text" : "password"}
                              name="signup-confirm-password"
                              autoComplete="new-password"
                              required
                              placeholder=" "
                              className={`${authFieldStyles} pl-[14px] pr-[47px]`}
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            />
                            <div className="absolute bottom-0 right-2 top-0 flex items-center">
                              <button
                                type="button"
                                className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded transition-colors duration-100 hover:bg-gray-200"
                                onClick={() => setShowSignupConfirmPassword((v) => !v)}
                                aria-label={
                                  showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"
                                }
                              >
                                <EyeToggleIcon open={showSignupConfirmPassword} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {signupOtpSent ? (
                          <div>
                            <label htmlFor="signup-otp" className={`${labelMbClass} text-[#A5AAB5]`}>
                              Enter OTP
                            </label>
                            <input
                              id="signup-otp"
                              name="otp"
                              inputMode="numeric"
                              placeholder=" "
                              className={authFieldStyles}
                              value={signupOtp}
                              onChange={(e) => setSignupOtp(e.target.value)}
                              required
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="mb-2 flex items-start pt-0.5 sm:mb-3">
                        <div className="flex h-5 items-center">
                          <input
                            id="signup-terms"
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="h-4 w-4 rounded border border-gray-300 bg-gray-50"
                          />
                        </div>
                        <label
                          htmlFor="signup-terms"
                          className="ml-2 text-[12px] font-medium leading-snug sm:text-[14px]"
                          style={{ color: "rgb(165, 170, 181)" }}
                        >
                          I agree to Myvideoinvites
                          <span className="text-[#5961F8]">
                            {" "}
                            <Link href="/terms-conditions" target="_blank" rel="noopener noreferrer">
                              Terms of Service
                            </Link>{" "}
                          </span>
                          and
                          <span className="text-[#5961F8]">
                            {" "}
                            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                              Privacy policy
                            </Link>
                          </span>
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
                        <button
                          type="submit"
                          disabled={loading}
                          className={`${primaryActionClass} mb-1 min-h-[44px]`}
                        >
                          {loading ? "Creating account..." : "Create Account"}
                        </button>
                      )}

                      <p className="mt-1.5 text-center text-[13px] text-black pb-1">
                        Already have an account?
                        <button
                          type="button"
                          className="text-[#5961F8]"
                          onClick={() => {
                            setMode("login");
                            setMessage("");
                          }}
                        >
                          <span className="cursor-pointer"> Log in</span>
                        </button>
                      </p>
                    </form>
                  )}
                </div>

                {message ? <p className="mt-1.5 text-center text-[12px] leading-snug text-[#475569] sm:text-[13px]">{message}</p> : null}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}
