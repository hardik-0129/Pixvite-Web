"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "signup";

function tabButtonClass(active: boolean) {
  const base =
    "font-heading flex-1 touch-manipulation rounded-t-lg py-3 text-center text-sm font-semibold transition-[color,background-color,border-color,box-shadow] duration-200 ease-out sm:text-base";
  if (active) {
    return `${base} border-b-2 border-[var(--brand-end)] bg-[rgba(255,64,129,0.07)] text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-[rgba(255,64,129,0.1)]`;
  }
  return `${base} border-b-2 border-transparent text-[var(--muted-foreground)] hover:bg-[rgba(255,112,67,0.08)] hover:text-[var(--foreground)] active:bg-[rgba(255,112,67,0.12)]`;
}

const inputClass =
  [
    "font-body min-h-[2.75rem] w-full rounded-lg border border-[var(--border)] bg-[var(--input)]",
    "px-3 py-2.5 text-sm text-[var(--foreground)] sm:text-[15px] sm:py-3",
    "shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]",
    "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
    "placeholder:text-[var(--muted-foreground)]/70 placeholder:transition-colors",
    "hover:border-neutral-300/90 hover:bg-white hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]",
    "focus-visible:border-[var(--brand-end)] focus-visible:bg-white focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-[var(--brand-end)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]",
  ].join(" ");

const labelClass = "font-body mb-1.5 block text-sm font-medium text-[var(--foreground)]";

const submitClass =
  "font-body w-full rounded-lg bg-neutral-900 py-3 font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-neutral-800 hover:shadow-md motion-safe:active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-900 disabled:hover:shadow-sm disabled:motion-safe:active:scale-100";

export function LoginSignupClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [signupFirst, setSignupFirst] = useState("");
  const [signupLast, setSignupLast] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [message, setMessage] = useState("");
  async function sendOtp(email: string, flow: Mode) {
    if (!email) {
      setMessage("Please enter email first.");
      return;
    }
    setSendingOtp(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; devOtp?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to send OTP.");
        return;
      }
      if (flow === "login") {
        setLoginOtpSent(true);
      } else {
        setSignupOtpSent(true);
      }
      setMessage(`OTP sent. (Dev OTP: ${data.devOtp ?? ""})`);
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
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          role: "user",
          otp: loginOtp,
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
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: signupFirst,
          lastName: signupLast,
          email: signupEmail,
          phone: signupPhone,
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

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4 pb-10 pt-6 sm:py-10"
      style={{
        background: "linear-gradient(rgba(255, 153, 102, 0.15), rgba(255, 94, 98, 0.15), white)",
      }}
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl transition-shadow duration-300 ease-out hover:shadow-2xl sm:p-8">
        <div className="mb-8 flex gap-0.5 border-b border-[var(--border)] sm:gap-1">
          <button type="button" className={tabButtonClass(mode === "login")} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={tabButtonClass(mode === "signup")} onClick={() => setMode("signup")}>
            Signup
          </button>
        </div>

        <div className="transition-all duration-300">
          {mode === "login" ? (
            <form className="space-y-6" onSubmit={handleSignIn}>
              <div>
                <label htmlFor="login-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginOtpSent(false);
                    setLoginOtp("");
                  }}
                  required
                />
              </div>
              {!loginOtpSent ? (
                <button type="button" onClick={() => sendOtp(loginEmail, "login")} className={submitClass}>
                  {sendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <div>
                    <label htmlFor="login-otp" className={labelClass}>
                      Enter OTP
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="login-otp"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter OTP"
                        className={inputClass}
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className={submitClass}>
                    {loading ? "Verifying..." : "Submit OTP"}
                  </button>
                </>
              )}
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="signup-first" className={labelClass}>
                    First Name
                  </label>
                  <input
                    id="signup-first"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Enter first name"
                    className={inputClass}
                    value={signupFirst}
                    onChange={(e) => setSignupFirst(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="signup-last" className={labelClass}>
                    Last Name
                  </label>
                  <input
                    id="signup-last"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Enter last name"
                    className={inputClass}
                    value={signupLast}
                    onChange={(e) => setSignupLast(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                  value={signupEmail}
                  onChange={(e) => {
                    setSignupEmail(e.target.value);
                    setSignupOtpSent(false);
                    setSignupOtp("");
                  }}
                  required
                />
              </div>
              <div>
                <label htmlFor="signup-phone" className={labelClass}>
                  Phone Number
                </label>
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  className={inputClass}
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  required
                />
              </div>
              {!signupOtpSent ? (
                <button type="button" onClick={() => sendOtp(signupEmail, "signup")} className={submitClass}>
                  {sendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <div>
                    <label htmlFor="signup-otp" className={labelClass}>
                      Enter OTP
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="signup-otp"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter OTP"
                        className={inputClass}
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className={submitClass}>
                    {loading ? "Creating..." : "Submit OTP"}
                  </button>
                </>
              )}
            </form>
          )}
          {message ? <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
