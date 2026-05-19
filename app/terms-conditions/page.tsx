import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — InvitesMagic",
  description:
    "Read the Terms & Conditions governing your use of InvitesMagic services.",
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

function Para({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`mb-3 text-[15px] leading-relaxed ${className ?? ""}`}
      style={{ color: "var(--text-secondary)" }}
    >
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

export default function TermsConditionsPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-white py-14 text-center sm:py-16">
        <h1
          className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
          style={{ color: "#e85025", fontFamily: "var(--font-header)" }}
        >
          Terms &amp; Conditions
        </h1>
      </div>

      {/* Content */}
      <div className="bg-white">
        <div className="w-[80%] max-sm:w-[90%] mx-auto pb-20">

          {/* Intro */}
          <Para>
            Welcome to InvitesMagic. These Terms &amp; Conditions govern your access to and use of
            the InvitesMagic website and services. By accessing or using our website, you agree to
            be legally bound by these Terms. If you do not agree with any part of these Terms, you
            must not use our services.
          </Para>
          <Para>
            InvitesMagic is an online platform that provides professionally designed invitation
            videos for personal and event use. Our services are accessible through our website and
            any related web-based services provided by InvitesMagic.
          </Para>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Overview */}
          <Section title="Overview">
            <Para>
              InvitesMagic provides invitation video templates and custom invitation video services
              for events such as weddings, birthdays, engagements, baby showers, corporate events,
              and other occasions. Users may browse templates, purchase invitation videos, customize
              content, and download or share the final video.
            </Para>
            <Para>
              All services are provided exclusively through the InvitesMagic website. InvitesMagic
              does not provide any mobile or desktop applications.
            </Para>
            <Para>By using InvitesMagic, you confirm that:</Para>
            <BulletList
              items={[
                "You are legally capable of entering into a binding agreement",
                "You are at least 13 years old or using the service under the supervision of a parent or legal guardian",
                "You have the authority to provide content and information for invitation videos",
              ]}
            />
            <Para>
              If you use InvitesMagic on behalf of an organization or another person, you confirm
              that you have permission to act on their behalf.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Use of the Service */}
          <Section title="Use of the Service">
            <Para>
              You may use InvitesMagic as a guest or by creating an account. You are responsible
              for maintaining the confidentiality of your account information and for all activities
              under your account.
            </Para>
            <Para>
              InvitesMagic grants you a limited, non-exclusive, non-transferable right to use the
              service for personal or business purposes related to invitation video creation.
            </Para>
            <Para>
              InvitesMagic reserves the right to restrict, suspend, or terminate access if misuse
              is detected.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Acceptable Use */}
          <Section title="Acceptable Use">
            <Para>You agree not to use InvitesMagic:</Para>
            <BulletList
              items={[
                "For unlawful, fraudulent, or harmful purposes",
                "To upload content that violates intellectual property rights",
                "To upload offensive, abusive, hateful, or illegal content",
                "To impersonate another person or entity",
                "To attempt to damage, disrupt, or interfere with the website",
              ]}
            />
            <Para>
              InvitesMagic reserves the right to remove content that violates these Terms.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* User Content */}
          <Section title="User Content">
            <Para>
              You may provide text, names, dates, images, audio, or other content for use in
              invitation videos.
            </Para>
            <Para>You confirm that:</Para>
            <BulletList
              items={[
                "You own or have permission to use all provided content",
                "Your content does not violate any laws or third-party rights",
              ]}
            />
            <Para>
              You retain ownership of your content. However, you grant InvitesMagic permission to
              use your content solely to create and deliver your invitation video.
            </Para>
            <Para>InvitesMagic does not claim ownership of your personal content.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Templates */}
          <Section title="Invitation Video Templates and Services">
            <Para>InvitesMagic provides:</Para>
            <BulletList
              items={[
                "Pre-designed invitation video templates",
                "Customized invitation video creation services",
                "Digital delivery of completed invitation videos",
              ]}
            />
            <Para>
              All purchases grant you the right to use the invitation video for personal or event
              purposes.
            </Para>
            <Para>
              You may share the invitation video with your guests via messaging platforms, email, or
              social media.
            </Para>
            <Para>
              You may not resell, redistribute, or commercially license InvitesMagic templates or
              videos without written permission.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Orders */}
          <Section title="Orders, Pricing, and Payments">
            <Para>All prices are listed on the InvitesMagic website.</Para>
            <Para>
              Payment must be made in full before delivery of the final invitation video unless
              otherwise stated.
            </Para>
            <Para>Once an order is placed:</Para>
            <BulletList
              items={[
                "Processing begins based on the selected template or service",
                "Delivery timelines may vary depending on customization",
              ]}
            />
            <Para>InvitesMagic reserves the right to change pricing at any time.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Delivery */}
          <Section title="Delivery of Invitation Videos">
            <Para>Invitation videos are delivered digitally via:</Para>
            <BulletList
              items={[
                "Website download link",
                "Email delivery",
                "User account download section",
              ]}
            />
            <Para>
              Delivery timelines provided are estimates and may vary depending on workload,
              customization complexity, and user response time.
            </Para>
            <Para>
              InvitesMagic is not responsible for delays caused by incomplete or incorrect
              information provided by the user.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Refund */}
          <Section title="Refund and Cancellation Policy">
            <Para>Due to the digital and customized nature of invitation videos:</Para>
            <BulletList
              items={[
                "Orders cannot be refunded once video creation has begun",
                "Refunds are not available after delivery of the video",
                "Minor revisions may be offered based on the service purchased",
              ]}
            />
            <Para>
              If an order has not yet been processed, cancellation may be requested.
            </Para>
            <Para>Refund decisions are at InvitesMagic&apos;s sole discretion.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Intellectual Property */}
          <Section title="Intellectual Property">
            <Para>
              All templates, designs, animations, graphics, branding, and website content belong
              exclusively to InvitesMagic.
            </Para>
            <Para>
              You are granted a limited license to use the invitation video for personal purposes.
            </Para>
            <Para>You may not:</Para>
            <BulletList
              items={[
                "Copy or reuse InvitesMagic templates",
                "Sell or redistribute InvitesMagic designs",
                "Claim InvitesMagic designs as your own",
              ]}
            />
            <Para>All InvitesMagic intellectual property remains protected.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Privacy */}
          <Section title="Privacy and Data Protection">
            <Para>
              InvitesMagic respects your privacy. Personal information is collected only to provide
              services and improve user experience.
            </Para>
            <Para>Information may include:</Para>
            <BulletList items={["Name", "Email address", "Event details", "Uploaded content"]} />
            <Para>InvitesMagic does not sell personal data to third parties.</Para>
            <Para>
              For more details, refer to our{" "}
              <Link href="/privacy-policy" style={{ color: "var(--accent)" }} className="font-semibold">
                Privacy Policy
              </Link>
              .
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Service Availability */}
          <Section title="Service Availability">
            <Para>
              InvitesMagic provides services on an &quot;as-is&quot; and &quot;as-available&quot; basis.
            </Para>
            <Para>We do not guarantee that:</Para>
            <BulletList
              items={[
                "The website will always be available without interruption",
                "The service will be error-free",
              ]}
            />
            <Para>We may update, modify, or discontinue services at any time.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Limitation */}
          <Section title="Limitation of Liability">
            <Para>InvitesMagic shall not be liable for:</Para>
            <BulletList
              items={[
                "Any indirect or incidental damages",
                "Loss of data or content",
                "Loss caused by incorrect information provided by users",
              ]}
            />
            <Para>
              Our total liability shall not exceed the amount paid by you for the service.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Termination */}
          <Section title="Termination">
            <Para>InvitesMagic may suspend or terminate access if:</Para>
            <BulletList
              items={["Terms are violated", "Illegal or harmful use is detected"]}
            />
            <Para>Users may stop using the service at any time.</Para>
            <Para>Termination does not affect completed purchases.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Governing Law */}
          <Section title="Governing Law">
            <Para>
              These Terms shall be governed by and interpreted according to the laws of India.
            </Para>
            <Para>Any disputes shall be handled exclusively in the courts of India.</Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Changes */}
          <Section title="Changes to Terms">
            <Para>InvitesMagic may update these Terms at any time.</Para>
            <Para>Updated Terms will be posted on the website.</Para>
            <Para>
              Continued use of the service indicates acceptance of updated Terms.
            </Para>
          </Section>

          <hr className="my-8" style={{ borderColor: "var(--border-light)" }} />

          {/* Contact */}
          <Section title="Contact Information">
            <Para>For questions, support, or legal inquiries, contact:</Para>
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
