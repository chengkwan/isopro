import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        background: "#0a0a0a",
        color: "#e0e0e0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 32px",
          textAlign: "center",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 60%), #0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "4px",
            color: "#444",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Merchant Statement Analysis
        </div>

        <h1
          style={{
            fontSize: "clamp(48px, 10vw, 96px)",
            fontWeight: 800,
            margin: 0,
            lineHeight: 1,
            letterSpacing: "-2px",
          }}
        >
          <span style={{ color: "#22c55e" }}>ISO</span>
          <span style={{ color: "#fff" }}>PRO</span>
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "#555",
            marginTop: "24px",
            maxWidth: "520px",
            lineHeight: 1.7,
          }}
        >
          Your credit card processing statement is 30 pages of deliberately
          confusing garbage. We turn it into the truth.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "48px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/analyze"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "#22c55e",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "1px",
              textDecoration: "none",
              borderRadius: "6px",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            SEE THE DEMO →
          </Link>

          <Link
            href="#how"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "transparent",
              color: "#666",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "1px",
              textDecoration: "none",
              borderRadius: "6px",
              border: "1px solid #222",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            HOW IT WORKS
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "48px",
          padding: "32px",
          borderTop: "1px solid #151515",
          borderBottom: "1px solid #151515",
          flexWrap: "wrap",
        }}
      >
        {[
          { value: "3.39%", label: "Effective rate (ouch)", color: "#ef4444" },
          { value: "$23.6K", label: "Negotiable fees / month", color: "#22c55e" },
          { value: "$283K", label: "Left on the table / year", color: "#22c55e" },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "28px", fontWeight: 700, color: stat.color }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginTop: "4px",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div
        id="how"
        style={{ padding: "80px 32px", maxWidth: "800px", margin: "0 auto" }}
      >
        <h2
          style={{
            fontSize: "10px",
            letterSpacing: "3px",
            color: "#444",
            textTransform: "uppercase",
            marginBottom: "48px",
            textAlign: "center",
          }}
        >
          How It Works
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >
          {[
            {
              step: "01",
              title: "Upload the statement",
              desc: "PDF from any processor. Wells Fargo, Chase, First Data, Worldpay, Fiserv — doesn't matter. We speak all of them.",
            },
            {
              step: "02",
              title: "We parse the chaos",
              desc: "AI extracts every fee, every interchange category, every markup — and maps it to a universal taxonomy. No more processor-specific naming games.",
            },
            {
              step: "03",
              title: "See what's negotiable",
              desc: "Interchange is interchange. Everyone pays the same. The processor's markup? That's where the money is. We show you exactly how much.",
            },
            {
              step: "04",
              title: "Model the switch",
              desc: "Input your buy rates. See the merchant's savings and your revenue side by side. Generate the pitch. Close with math.",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                  minWidth: "60px",
                  lineHeight: 1,
                }}
              >
                {item.step}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "6px",
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.7 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The problem */}
      <div
        style={{
          padding: "60px 32px",
          background: "#0d0d0d",
          borderTop: "1px solid #151515",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "#22c55e",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            The Problem
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              lineHeight: 1.9,
              margin: 0,
            }}
          >
            Credit card processing statements are intentionally opaque. Every
            processor uses different names for the same fees. Interchange
            categories are buried in jargon. Markup is hidden between
            pass-throughs. A merchant doing $3M/month is paying $114K in fees
            and has no idea which part is negotiable and which part is fixed.
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#888",
              lineHeight: 1.9,
              marginTop: "16px",
            }}
          >
            We fix that.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: "32px",
          borderTop: "1px solid #151515",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "11px", color: "#333" }}>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>ISO</span>PRO ·
          Clarity from chaos
        </div>
      </footer>
    </div>
  );
}