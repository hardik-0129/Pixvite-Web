import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — InvitesMagic",
  description:
    "Learn how InvitesMagic collects, uses, and protects your personal information.",
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3
        className="mb-3 text-base font-semibold sm:text-lg"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-header)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5 pl-1">
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

const mailHref =
  "https://mail.google.com/mail/?view=cm&fs=1&to=support@invitesmagic.com";


export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-white py-14 text-center sm:py-16">
        <h1
          className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
          style={{ fontFamily: "var(--font-header)" }}
        >
          <span style={{ color: "var(--text-primary)" }}>Privacy</span>
          <span style={{ color: "#e85025" }}>Policy</span>
        </h1>
      </div>

      {/* Content */}
      <div className="bg-white">
      <div className="w-[80%] max-sm:w-[90%] mx-auto pb-20">
        {/* Intro */}
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Welcome to InvitesMagic (
          <a
            href="https://invitesmagic.com"
            className="font-semibold"
            style={{ color: "var(--accent)" }}
          >
            invitesmagic.com
          </a>
          ), your website-only platform for creating and downloading professional invitation videos.
          All services on InvitesMagic are paid, and we are committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, store, and share your information when
          you use our website and services, ensuring transparency and trust.
        </p>

        {/* Divider */}
        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Our Privacy Commitment */}
        <Section title="Our Privacy Commitment">
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            We collect only what we need to provide our invitation video services, keep the website
            secure, improve performance, and support your account. We do not sell your personal
            information to third parties for their own marketing.
          </p>

          <SubSection title="Information We Collect">
            <BulletList
              items={[
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Personal Information:</strong>{" "}
                  Name, email address, phone number and payment details when you register, place an
                  order, make a payment, or contact us for support.
                </>,
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>User-Generated Content:</strong>{" "}
                  The details you submit to generate your invitation video, such as names, event
                  date/time, venue, messages, and any photos, logos, or media you upload.
                </>,
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Usage Data:</strong>{" "}
                  Technical and usage information collected automatically, such as IP address,
                  browser type, device details, pages visited, and time spent on our website.
                </>,
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Cookies and Trackers:</strong>{" "}
                  We use cookies and similar technologies to enable core website functionality,
                  remember preferences, analyze traffic, and (if applicable) support
                  marketing/advertising measurement.
                </>,
              ]}
            />
          </SubSection>

          <SubSection title="How We Share Your Information">
            <BulletList
              items={[
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Service Delivery:</strong>{" "}
                  We share information with trusted third-party vendors who help us operate
                  InvitesMagic (such as payment processors, cloud hosting/storage providers, video
                  processing/rendering infrastructure, analytics, and customer support tools). These
                  providers are permitted to use your information only to deliver services to us and
                  must follow appropriate security and confidentiality requirements.
                </>,
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Legal Requirements:</strong>{" "}
                  We may disclose information if required to comply with applicable laws or legal
                  processes, or if needed to protect our rights, enforce our terms, investigate
                  fraud, or protect users and the public.
                </>,
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Business Transfers:</strong>{" "}
                  If InvitesMagic is involved in a merger, acquisition, restructuring, or sale of
                  assets, your information may be transferred as part of that transaction, subject
                  to continued privacy protections.
                </>,
                <>
                  <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>No Sale of Personal Data:</strong>{" "}
                  We do not sell your personal information to third parties for their own marketing
                  purposes.
                </>,
              ]}
            />
          </SubSection>
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Data Security */}
        <Section title="Data Security">
          <BulletList
            items={[
              "We use industry-standard safeguards — such as HTTPS encryption, secure servers, and access controls — to help protect your information from unauthorized access, loss, misuse, or alteration.",
              "Your user-generated content (such as invitation details and any media you upload) is stored securely. If you choose to share your invitation video using a share link or make it publicly accessible (where available), it may be viewable by anyone who has access to that link.",
              "Although we take reasonable steps to protect your data, no online service is completely secure, and we cannot guarantee absolute security.",
            ]}
          />
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Your Rights */}
        <Section title="Your Rights and Choices">
          <BulletList
            items={[
              <>
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Access and Update:</strong>{" "}
                You can access or update your personal information through your account settings (if
                available) or by contacting us at{" "}
                <a href={mailHref} target="_blank" rel="nofollow" style={{ color: "var(--accent)" }}>
                  support@invitesmagic.com
                </a>
                .
              </>,
              <>
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Opt-Out:</strong>{" "}
                You may opt out of promotional emails at any time by clicking the "unsubscribe" link
                in our emails or by contacting us. We may still send essential service-related
                messages (such as payment confirmations or important account notices).
              </>,
              <>
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Cookies:</strong>{" "}
                You can manage cookie preferences through your browser settings, though disabling
                cookies may limit site functionality.
              </>,
              <>
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Data Deletion:</strong>{" "}
                You can request deletion of your account and data, subject to legal retention
                requirements, by contacting us.
              </>,
            ]}
          />
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Cookies */}
        <Section title="Cookies">
          <BulletList
            items={[
              "We use cookies and similar technologies to remember your preferences, keep the website functioning properly, and analyze website usage to improve performance and user experience. If we run marketing campaigns, cookies may also be used to measure campaign effectiveness and (where applicable) show relevant ads.",
              "Third-party providers (such as analytics services like Google Analytics and advertising partners, if used) may also place cookies or use similar tracking technologies, and their use is governed by their own privacy policies.",
              "If we publish a separate Cookie Policy, you can review additional details there (linked on our website, if applicable).",
            ]}
          />
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Third-Party Links */}
        <Section title="Third-Party Links and Services">
          <BulletList
            items={[
              "Our website may contain links to third-party websites or services (for example, payment gateways or social media platforms). We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any third-party services you access through InvitesMagic.",
            ]}
          />
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Children */}
        <Section title="Children's Privacy">
          <BulletList
            items={[
              "InvitesMagic is not intended for children under 13 years of age, and we do not knowingly collect personal information from children. If we learn that we have collected a child's data, we will take reasonable steps to delete it promptly.",
            ]}
          />
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* International */}
        <Section title="International Data Transfers">
          <BulletList
            items={[
              "Your information may be stored or processed on servers located outside your country (including the United States or other locations where our service providers operate). Where required, we use appropriate safeguards (such as standard contractual clauses) to protect your data during international transfers.",
            ]}
          />
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Updates */}
        <Section title="Updates to This Policy">
          <BulletList
            items={[
              <>
                We may update this Privacy Policy to reflect changes in our services, technology, or
                legal requirements. Updates will be posted on this page (
                <a href="https://invitesmagic.com" style={{ color: "var(--accent)" }}>
                  invitesmagic.com
                </a>
                ), and material changes may be communicated via email or a notice on our website.
              </>,
              "Last updated: February 2, 2026",
            ]}
          />
        </Section>

        <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

        {/* Contact */}
        <Section title="Contact Us">
          <p className="mb-4 text-[15px]" style={{ color: "var(--text-secondary)" }}>
            For questions, requests, or concerns about your privacy, please contact us at:
          </p>
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
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              We will respond to your inquiries within 30 days.
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
