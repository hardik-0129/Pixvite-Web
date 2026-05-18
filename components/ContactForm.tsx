"use client";

import { useState } from "react";

type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

const fieldClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--input)] p-3 text-[var(--foreground)] transition placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/35";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate() {
    const e: Errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!subject.trim()) e.subject = "Subject is required";
    if (!message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: { preventDefault(): void }) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setServerError(data.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p className="font-heading text-lg font-semibold text-green-800">Message sent!</p>
        <p className="mt-2 text-sm text-green-700">
          We&apos;ve also sent a confirmation to <strong>{email}</strong>. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            required
            type="text"
            className={fieldClass}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            required
            type="email"
            className={fieldClass}
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          type="text"
          className={fieldClass}
          placeholder="What is this regarding?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className={`${fieldClass} resize-none`}
          placeholder="Tell us how we can help you..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "#e85025" }}
      >
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
