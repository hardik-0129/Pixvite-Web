const stats = [
  { value: "500+", label: "Ready-to-edit templates" },
  { value: "2M+", label: "Happy users worldwide" },
  { value: "150+", label: "Countries served" },
  { value: "98%", label: "Would recommend us" },
];

export function TrustStatsSection() {
  return (
    <section
      style={{
        background: "#1a1a1a",
        padding: "72px 6%",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          color: "#f5f0e8",
          fontFamily: "var(--serif)",
          fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
          fontWeight: 600,
          lineHeight: 1.4,
          maxWidth: "680px",
          margin: "0 auto",
        }}
      >
        Trusted by invitation designers across{" "}
        <strong style={{ color: "#e85025", fontWeight: 700 }}>150+ countries</strong>
        {" "}— we know what makes an invitation truly{" "}
        <em style={{ color: "#e85025" }}>unforgettable</em>
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0",
          marginTop: "52px",
          maxWidth: "900px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
        className="max-[640px]:grid-cols-2 max-[640px]:gap-y-8"
      >
        {stats.map(({ value, label }) => (
          <div
            key={label}
            style={{ textAlign: "center" }}
          >
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                color: "#e85025",
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "0.78rem",
                color: "#9e9e9e",
                letterSpacing: "0.01em",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
