"use client";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Instant Live Preview",
    desc: "See every change in real-time before downloading your final HD video.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
        <path d="M2.5 10h19" />
      </svg>
    ),
    title: "Edit First, Pay Later",
    desc: "Make unlimited edits. Pay only when you're 100% satisfied.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.5 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" />
      </svg>
    ),
    title: "Affordable Pricing",
    desc: "Premium-quality video invites at a fraction of traditional design costs.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M12 3v13M6.5 10.5 12 16l5.5-5.5M4 20.5h16" />
      </svg>
    ),
    title: "HD Download",
    desc: "Export crisp full-HD invites ready to share on Instagram & WhatsApp.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-7h3M4 13v4a2 2 0 0 0 2 2h1v-7H4" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Have questions? Our support team is always available to help.",
  },
];

const rotations = [-3, 2, -1.5, 2.5, -2];

export function WhyPixviteSection() {
  return (
    <section style={{ padding: "100px 24px 120px", background: "#FAF6F1", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, color: "#e85025", marginBottom: 8 }}>
            ~ five good reasons ~
          </div>
          <h2 style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 400,
            margin: 0,
            lineHeight: 1.05,
            color: "#2A1A14",
          }}>
            Why <em style={{ color: "#e85025", fontStyle: "italic", fontWeight: 500 }}>InvitesMagic</em>
          </h2>
        </div>

        {/* Tickets */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 18 }}>
          {features.map((f, i) => (
            <article
              key={f.title}
              className="im-ticket"
              style={{
                width: 230,
                background: "#FFFDF9",
                border: "1px solid rgba(42,26,20,0.12)",
                borderRadius: 12,
                padding: "26px 22px",
                boxShadow: "0 18px 40px -20px rgba(42,26,20,0.25)",
                position: "relative",
                transform: `rotate(${rotations[i]}deg)`,
                transition: "transform 280ms cubic-bezier(.2,.8,.2,1), box-shadow 280ms",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "rotate(0deg) translateY(-6px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 28px 56px -22px rgba(42,26,20,0.32)";
                (e.currentTarget as HTMLElement).style.zIndex = "2";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = `rotate(${rotations[i]}deg)`;
                (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 40px -20px rgba(42,26,20,0.25)";
                (e.currentTarget as HTMLElement).style.zIndex = "auto";
              }}
            >
              {/* Notches */}
              <span style={{ position: "absolute", top: 52, left: -8, width: 16, height: 16, borderRadius: "50%", background: "#FAF6F1" }} />
              <span style={{ position: "absolute", top: 52, right: -8, width: 16, height: 16, borderRadius: "50%", background: "#FAF6F1" }} />

              {/* Stub header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5A463D" }}>
                  Admit One
                </span>
                <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "#e85025", fontSize: 15 }}>
                  № {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Dashed perforation */}
              <div style={{ borderTop: "1.5px dashed #F4B89E", margin: "0 -22px 0 -22px" }} />

              {/* Body */}
              <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#e85025", color: "#fff",
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 22, margin: 0, lineHeight: 1.15, color: "#2A1A14" }}>
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#5A463D" }}>
                  {f.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
