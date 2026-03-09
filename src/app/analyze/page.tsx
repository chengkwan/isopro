import MerchantAnalyzer from "@/components/MerchantAnalyzer";
import Link from "next/link";

export default function AnalyzePage() {
  return (
    <div>
      {/* Back nav */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1a1a1a",
          padding: "8px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "12px",
            color: "#555",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← <span style={{ color: "#ef4444", fontWeight: 700 }}>UN</span>FUCKED
        </Link>
        <div style={{ fontSize: "10px", color: "#333", letterSpacing: "1px" }}>
          DEMO — OSRX DEC 2025
        </div>
      </div>

      <MerchantAnalyzer />
    </div>
  );
}