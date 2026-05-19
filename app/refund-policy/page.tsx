import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — InvitesMagic",
  description:
    "Read the Refund & Cancellation Policy for InvitesMagic digital invitation video services.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2
        className="mb-4 text-xl font-bold sm:text-2xl"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-header)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mb-3 space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <span
            className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const mailHref = "https://mail.google.com/mail/?view=cm&fs=1&to=support@invitesmagic.com";

export default function RefundPolicyPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-white py-14 text-center sm:py-16">
        <h1
          className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
          style={{ color: "#e85025", fontFamily: "var(--font-header)" }}
        >
          Refund &amp; Cancellation Policy
        </h1>
      </div>

      {/* Content */}
      <div className="bg-white">
        <div className="w-[80%] max-sm:w-[90%] mx-auto pb-20">

          {/* Intro bold statement */}
          <p
            className="text-[15px] font-bold leading-relaxed sm:text-base"
            style={{ color: "var(--text-primary)" }}
          >
            At InvitesMagic, we provide customized digital invitation video services. This policy
            is designed in accordance with applicable Indian consumer protection and digital service
            regulations.
          </p>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Cancellation Policy */}
          <Section title="Cancellation Policy">
            <Para>
              Orders can be cancelled only before the video production or customization process has
              started. Once the production work has begun, cancellations will not be accepted, as
              the service involves personalized digital content created specifically for the
              customer.
            </Para>
            <Para>
              To request a cancellation, please contact us at{" "}
              <a href={mailHref} target="_blank" rel="nofollow" style={{ color: "var(--accent)" }}>
                support@invitesmagic.com
              </a>{" "}
              with your order details.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Refund Policy */}
          <Section title="Refund Policy">
            <Para>
              Due to the digital and customized nature of our services, refunds are generally not
              applicable once production has started or the video has been delivered.
            </Para>
            <Para>Refunds may be considered only in the following cases:</Para>
            <BulletList
              items={[
                "If cancellation is requested before production begins",
                "If InvitesMagic is unable to deliver the service",
                "If there is a verified technical error from our side that cannot be corrected",
              ]}
            />
            <Para>Refund requests must be made within 7 days of purchase.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Refund Processing */}
          <Section title="Refund Processing">
            <Para>
              If approved, refunds will be processed to the original payment method within 5 to 7
              working days. Processing time may vary depending on your bank or payment provider.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Non-Refundable Cases */}
          <Section title="Non-Refundable Cases">
            <Para>Refunds will not be provided if:</Para>
            <BulletList
              items={[
                "The video has already been delivered as per the submitted details",
                "Incorrect or incomplete information was provided by the customer",
                "Dissatisfaction is based on personal preference after delivery",
              ]}
            />
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Compliance */}
          <Section title="Compliance with Indian Law">
            <Para>
              This policy is governed by the Consumer Protection Act, 2019 and applicable Indian
              laws related to digital services.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Contact */}
          <Section title="Contact Us">
            <Para>For any refund or cancellation requests, please contact:</Para>
            <div
              className="rounded-xl border p-5 text-[15px] leading-loose"
              style={{
                borderColor: "var(--border-card)",
                background: "rgba(232,80,37,0.04)",
                color: "var(--text-secondary)",
              }}
            >
              <p>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Email: </span>
                <a href={mailHref} target="_blank" rel="nofollow" style={{ color: "var(--accent)" }}>
                  support@invitesmagic.com
                </a>
              </p>
              <p>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Address: </span>
                Infiapp Solution, Surat, Gujarat, India
              </p>
            </div>
          </Section>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              style={{ background: "var(--accent)" }}
            >
              ← Back to Home
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
