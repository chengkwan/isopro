"use client";

import { useState, useMemo } from "react";

// Real data extracted from the Wells Fargo statement
const STATEMENT_DATA = {
  merchant: "OSRX",
  owner: "Tony",
  location: "Missoula, MT",
  processor: "Wells Fargo Merchant Services",
  period: "December 2025",
  merchantNumber: "225126139990",
  totalSubmitted: 3355894.08,
  chargebacks: -676.00,
  adjustments: -3.02,
  totalFees: -113913.06,
  totalTransactions: 43562,
  grossSales: 3365389.58,
  refunds: -9495.50,
  ytdGross: 33033526.55,
};

// Card type breakdown
const CARD_MIX = [
  { card: "Visa", items: 28354, gross: 2014420.81, refunds: -5700.00, net: 2008720.81, avgTicket: 70.84, interchangeTotal: 46585.29, pctSales: 59.9 },
  { card: "Mastercard", items: 10444, gross: 843499.27, refunds: -2128.00, net: 841371.27, avgTicket: 80.56, interchangeTotal: 21234.76, pctSales: 25.1 },
  { card: "Amex", items: 3180, gross: 425949.75, refunds: -801.50, net: 425148.25, avgTicket: 133.69, interchangeTotal: 9321.83, pctSales: 12.7 },
  { card: "Discover", items: 1584, gross: 81519.75, refunds: -866.00, net: 80653.75, avgTicket: 50.92, interchangeTotal: 1905.60, pctSales: 2.4 },
];

// Fee anatomy - the REAL breakdown
const FEE_ANATOMY = {
  interchange: { label: "Interchange / Program Fees", amount: 83967.58, description: "Card networks (Visa, MC, etc.) charge these. Non-negotiable. Every processor pays the same rates.", color: "#2563eb" },
  service: { label: "Processor Markup (Service Charges)", amount: 23640.87, description: "This is where Wells Fargo makes their money. This is the negotiable part. This is where you look.", color: "#dc2626" },
  fees: { label: "Network & Account Fees", amount: 6304.61, description: "Auth fees, PCI compliance, chargeback fees, statement fees. Some negotiable, some not.", color: "#d97706" },
};

// The "where you're getting screwed" analysis
const MARKUP_ANALYSIS = [
  { name: "Visa Sales Discount", amount: 14100.95, basis: "0.70% on $2.01M", type: "markup", note: "Wells Fargo's cut on every Visa dollar. Competitive range: 0.15-0.40%" },
  { name: "MC Sales Discount", amount: 5904.49, basis: "0.70% on $843K", type: "markup", note: "Same 0.70% markup on Mastercard. This is the processor's margin." },
  { name: "Amex Sales Discount", amount: 2981.65, basis: "0.70% on $426K", type: "markup", note: "Amex markup. Note: Amex interchange is already higher, so this stacks." },
  { name: "Discover Sales Discount", amount: 570.64, basis: "0.70% on $81.5K", type: "markup", note: "Same flat 0.70% across all networks. Consistent but not competitive." },
  { name: "AVS Auth Fee", amount: 2878.65, basis: "$0.05 × 57,573 auths", type: "per-txn", note: "Address verification on every auth attempt. Market rate: $0.01-0.03" },
  { name: "Visa Network Fee CNP 2-08", amount: 450.00, basis: "Flat monthly", type: "fixed", note: "Card-not-present network fee. Fixed cost, but verify this is standard." },
  { name: "MC Auth Digital Enablement", amount: 342.20, basis: "$0.02 × 17,110", type: "per-txn", note: "Digital enablement fee. Passed through at cost or marked up?" },
  { name: "VI Ntwk Acq Proc Fee US CR", amount: 533.48, basis: "$0.0195 × 27,358", type: "per-txn", note: "Visa acquirer processing. This is a pass-through but verify rate." },
  { name: "MC Network Access Auth", amount: 278.69, basis: "$0.0195 × 14,292", type: "per-txn", note: "MC network access. Standard pass-through." },
  { name: "VI Ntwk Acq Proc Fee US DB/PP", amount: 287.29, basis: "$0.0155 × 18,535", type: "per-txn", note: "Debit/prepaid processing fee. Pass-through." },
  { name: "AXP Program Continuation", amount: 122.42, basis: "Monthly", type: "fixed", note: "Amex program fee. Standard but verify." },
  { name: "Chargeback Fees (11 incidents)", amount: 275.00, basis: "$25 each", type: "per-event", note: "$25/chargeback is standard. Some processors charge $15." },
  { name: "PCI Compliance Fee", amount: 10.00, basis: "Monthly", type: "fixed", note: "Standard PCI compliance program fee." },
  { name: "PCI Non-Validation Fee", amount: 25.00, basis: "Monthly penalty", type: "fixed", note: "Penalty for not completing PCI validation. Fix this — it's avoidable." },
  { name: "Paper Statement Fee", amount: 10.00, basis: "Monthly", type: "fixed", note: "Paying for paper. Switch to electronic." },
  { name: "Monthly Service Charge", amount: 35.00, basis: "Monthly", type: "fixed", note: "Account maintenance fee." },
  { name: "VI Digital Commerce Svc Fee", amount: 334.37, basis: "$0.0075 × 44,583", type: "per-txn", note: "Visa digital commerce fee. Network pass-through." },
  { name: "No Acceptance Visa DMS", amount: 49.00, basis: "$7 × 7 disputes", type: "per-event", note: "Dispute management fee for not responding to Visa disputes." },
];

// Top interchange categories by cost
const TOP_INTERCHANGE = [
  { name: "VI Sign Preferred (ECOMM)", wfName: "VI-ECOMM BSC P1 SIGN PREFERRED", volume: 543079.98, rate: "2.50% + $0.10", cost: 14616.70, pctOfTotal: 27 },
  { name: "VI Business Tier 5", wfName: "VI-US BUS TR5 PRD 1", volume: 343892.33, rate: "3.00% + $0.10", cost: 10370.17, pctOfTotal: 17 },
  { name: "MC World Elite", wfName: "MC-WORLD ELITE MERIT I", volume: 199524.00, rate: "2.60% + $0.10", cost: 5554.92, pctOfTotal: 24 },
  { name: "AXP B2B Wholesale T2", wfName: "AXP B2BWHOLESALE NONSWIPE T2", volume: 257516.75, rate: "2.20% + $0.10", cost: 5680.07, pctOfTotal: 60 },
  { name: "MC Business Level 5", wfName: "MC-BUS LEVEL 5 DATA RATE I", volume: 150869.50, rate: "3.00% + $0.10", cost: 4549.59, pctOfTotal: 18 },
  { name: "AXP B2B Wholesale T1", wfName: "AXP B2BWHOLESALE NONSWIPE T1", volume: 160322.00, rate: "1.95% + $0.10", cost: 3426.69, pctOfTotal: 38 },
  { name: "VI Business Tier 4", wfName: "VI-US BUS TR4 PRD 1", volume: 111627.50, rate: "2.95% + $0.10", cost: 3329.41, pctOfTotal: 6 },
  { name: "VI Purchasing Credit", wfName: "VI-PURCHASING CREDIT PRODUCT 1", volume: 100232.50, rate: "2.70% + $0.10", cost: 2716.18, pctOfTotal: 5 },
  { name: "VI Signature (ECOMM)", wfName: "VI-ECOMM BSC P1 SIGNATURE", volume: 129265.50, rate: "2.05% + $0.10", cost: 2902.05, pctOfTotal: 6 },
  { name: "VI Prepaid/Ecomm Basic", wfName: "VI-CPS/ECOMM-BASIC (PP)", volume: 108603.00, rate: "1.75% + $0.20", cost: 2368.36, pctOfTotal: 5 },
];

const CHARGEBACKS = [
  { date: "12/02", type: "Fraud", amount: 95.00 },
  { date: "12/04", type: "Fraud", amount: 66.50 },
  { date: "12/05", type: "Fraud", amount: 45.00 },
  { date: "12/08", type: "Fraud", amount: 47.50 },
  { date: "12/09", type: "Fraud", amount: 35.00 },
  { date: "12/10", type: "Fraud", amount: 92.50 },
  { date: "12/12", type: "Fraud", amount: 60.00 },
  { date: "12/13", type: "Dispute", amount: 70.00 },
  { date: "12/21", type: "Fraud", amount: 117.00 },
  { date: "12/25", type: "Dispute", amount: 52.50 },
  { date: "12/26", type: "Reversal", amount: -50.00 },
  { date: "12/27", type: "Fraud", amount: 45.00 },
];

function fmt(n: number): string { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtK(n: number): string { return n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${fmt(n)}`; }
function pct(n: number, d: number): string { return ((n / d) * 100).toFixed(2); }

const TABS = ["Overview", "Fee Anatomy", "Where The Money Goes", "Interchange Deep Dive", "Comparison Engine"];

export default function MerchantAnalyzer() {
  const [tab, setTab] = useState(0);
  const [compareMargin, setCompareMargin] = useState(0.25);
  const [compareAuthFee, setCompareAuthFee] = useState(0.02);

  const effectiveRate = useMemo(() => (Math.abs(STATEMENT_DATA.totalFees) / STATEMENT_DATA.totalSubmitted * 100), []);
  const interchangeRate = useMemo(() => (FEE_ANATOMY.interchange.amount / STATEMENT_DATA.totalSubmitted * 100), []);
  const markupRate = useMemo(() => (FEE_ANATOMY.service.amount / STATEMENT_DATA.totalSubmitted * 100), []);

  // Comparison engine calculations
  const compareData = useMemo(() => {
    const currentMarkup = FEE_ANATOMY.service.amount;
    const currentAuthFees = 2878.65; // AVS auth fees
    const newMarkup = STATEMENT_DATA.totalSubmitted * (compareMargin / 100);
    const newAuthFees = 57573 * compareAuthFee;
    const savings = (currentMarkup - newMarkup) + (currentAuthFees - newAuthFees);
    const competitorProfit = newMarkup;
    const newEffective = ((FEE_ANATOMY.interchange.amount + newMarkup + FEE_ANATOMY.fees.amount - currentAuthFees + newAuthFees) / STATEMENT_DATA.totalSubmitted * 100);
    return { currentMarkup, newMarkup, savings, competitorProfit, newEffective, newAuthFees, currentAuthFees };
  }, [compareMargin, compareAuthFee]);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", background: "#0a0a0a", color: "#e0e0e0", minHeight: "100vh", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)", borderBottom: "1px solid #222", padding: "24px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Merchant Statement Analysis</div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>
              <span style={{ color: "#22c55e" }}>ISO</span>PRO Demo
            </h1>
            <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>Clarity from chaos. Truth in data.</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "12px" }}>
            <div style={{ color: "#888" }}>{STATEMENT_DATA.merchant} — {STATEMENT_DATA.owner}</div>
            <div style={{ color: "#666" }}>{STATEMENT_DATA.location} · {STATEMENT_DATA.period}</div>
            <div style={{ color: "#444", fontSize: "10px" }}>Processor: {STATEMENT_DATA.processor}</div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #222", overflowX: "auto" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: "12px 20px", fontSize: "11px", letterSpacing: "0.5px", background: tab === i ? "#1a1a1a" : "transparent",
            color: tab === i ? "#fff" : "#555", border: "none", borderBottom: tab === i ? "2px solid #ef4444" : "2px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
            fontFamily: "inherit",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: "1200px" }}>

        {/* ===== OVERVIEW ===== */}
        {tab === 0 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Gross Volume", value: `$${fmt(STATEMENT_DATA.totalSubmitted)}`, sub: `${STATEMENT_DATA.totalTransactions.toLocaleString()} transactions` },
                { label: "Total Fees Paid", value: `$${fmt(Math.abs(STATEMENT_DATA.totalFees))}`, sub: `${effectiveRate.toFixed(2)}% effective rate`, alert: true },
                { label: "Interchange (Non-Negotiable)", value: `$${fmt(FEE_ANATOMY.interchange.amount)}`, sub: `${interchangeRate.toFixed(2)}% of volume` },
                { label: "Processor Markup (Negotiable)", value: `$${fmt(FEE_ANATOMY.service.amount)}`, sub: `${markupRate.toFixed(2)}% of volume`, alert: true },
                { label: "Avg Ticket", value: `$${(STATEMENT_DATA.totalSubmitted / STATEMENT_DATA.totalTransactions).toFixed(2)}`, sub: "across all card types" },
                { label: "YTD Volume", value: `$${fmt(STATEMENT_DATA.ytdGross)}`, sub: "~$33M annualized" },
              ].map((card, i) => (
                <div key={i} style={{ background: "#111", border: `1px solid ${card.alert ? "#331111" : "#1a1a1a"}`, borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{card.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: card.alert ? "#ef4444" : "#fff" }}>{card.value}</div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>{card.sub}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "13px", color: "#888", marginBottom: "12px", letterSpacing: "1px" }}>CARD MIX</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #222" }}>
                    {["Network", "Transactions", "Volume", "% of Sales", "Avg Ticket", "Interchange", "Eff. IC Rate"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CARD_MIX.map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#fff" }}>{c.card}</td>
                      <td style={{ padding: "10px 12px" }}>{c.items.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>${fmt(c.net)}</td>
                      <td style={{ padding: "10px 12px" }}>{c.pctSales}%</td>
                      <td style={{ padding: "10px 12px" }}>${c.avgTicket}</td>
                      <td style={{ padding: "10px 12px", color: "#ef4444" }}>${fmt(c.interchangeTotal)}</td>
                      <td style={{ padding: "10px 12px", color: c.card === "Amex" ? "#f59e0b" : "#888" }}>{pct(c.interchangeTotal, c.net)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "24px", background: "#111", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>CHARGEBACKS — {CHARGEBACKS.length} incidents · $676 net</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {CHARGEBACKS.map((cb, i) => (
                  <div key={i} style={{ 
                    background: cb.amount < 0 ? "#0a1a0a" : cb.type === "Fraud" ? "#1a0a0a" : "#1a1a0a",
                    border: `1px solid ${cb.amount < 0 ? "#1a331a" : cb.type === "Fraud" ? "#331a1a" : "#33331a"}`,
                    borderRadius: "4px", padding: "6px 10px", fontSize: "11px"
                  }}>
                    <span style={{ color: "#666" }}>{cb.date}</span>{" "}
                    <span style={{ color: cb.amount < 0 ? "#22c55e" : "#888" }}>{cb.type}</span>{" "}
                    <span style={{ color: cb.amount < 0 ? "#22c55e" : "#ef4444" }}>{cb.amount < 0 ? "+" : "-"}${fmt(Math.abs(cb.amount))}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "8px" }}>
                Fraud rate: 0.02% of volume. Healthy. But each chargeback costs $25 in dispute fees + the transaction amount.
              </div>
            </div>
          </div>
        )}

        {/* ===== FEE ANATOMY ===== */}
        {tab === 1 && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>
                Every dollar in fees falls into one of three buckets. Understanding which bucket is which is the entire game.
              </div>

              {/* Visual bar */}
              <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", height: "40px", marginBottom: "24px" }}>
                {Object.entries(FEE_ANATOMY).map(([key, val]) => (
                  <div key={key} style={{ 
                    width: `${(val.amount / Math.abs(STATEMENT_DATA.totalFees)) * 100}%`,
                    background: val.color, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px",
                    opacity: key === "service" ? 1 : 0.7,
                  }}>
                    {((val.amount / Math.abs(STATEMENT_DATA.totalFees)) * 100).toFixed(0)}%
                  </div>
                ))}
              </div>

              {Object.entries(FEE_ANATOMY).map(([key, val]) => (
                <div key={key} style={{ 
                  background: "#111", border: `1px solid ${key === "service" ? "#331111" : "#1a1a1a"}`,
                  borderLeft: `3px solid ${val.color}`, borderRadius: "8px", padding: "16px", marginBottom: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{val.label}</div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{val.description}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: key === "service" ? "#ef4444" : "#fff" }}>${fmt(val.amount)}</div>
                      <div style={{ fontSize: "11px", color: "#555" }}>{pct(val.amount, STATEMENT_DATA.totalSubmitted)}% of volume</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#0a0f0a", border: "1px solid #1a331a", borderRadius: "8px", padding: "20px", marginTop: "24px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#22c55e", marginBottom: "8px" }}>THE TRUTH</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.8 }}>
                Interchange is interchange. Visa charges what Visa charges. Mastercard charges what Mastercard charges. Every processor on Earth pays the same interchange rates. That $83,967.58 is fixed.
                <br/><br/>
                The <span style={{ color: "#ef4444", fontWeight: 600 }}>$23,640.87 in service charges</span> is where Wells Fargo makes their profit. That's 0.70% flat across all networks. That's the number a competing processor would attack.
                <br/><br/>
                At $3.36M/month (~$40M annualized), this merchant has significant leverage. The processor markup alone is ~$283K/year. A competitive bid at 0.25% markup would save roughly <span style={{ color: "#22c55e", fontWeight: 600 }}>${fmt((0.70 - 0.25) / 100 * STATEMENT_DATA.totalSubmitted * 12)}/year</span>.
              </div>
            </div>
          </div>
        )}

        {/* ===== WHERE THE MONEY GOES ===== */}
        {tab === 2 && (
          <div>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>
              Every fee on this statement, categorized. <span style={{ color: "#ef4444" }}>Red = negotiable markup.</span> <span style={{ color: "#d97706" }}>Amber = avoidable or reducible.</span> <span style={{ color: "#555" }}>Gray = pass-through.</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MARKUP_ANALYSIS.sort((a, b) => b.amount - a.amount).map((fee, i) => (
                <div key={i} style={{ 
                  background: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "12px 16px",
                  borderLeft: `3px solid ${fee.type === "markup" ? "#ef4444" : fee.type === "per-event" || fee.name.includes("PCI Non") || fee.name.includes("Paper") ? "#d97706" : "#333"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: fee.type === "markup" ? "#ef4444" : "#ddd" }}>{fee.name}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: fee.type === "markup" ? "#ef4444" : "#fff" }}>${fmt(fee.amount)}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                    <span style={{ color: "#666" }}>{fee.basis}</span>
                    <span style={{ 
                      color: fee.type === "markup" ? "#ef4444" : fee.type === "per-event" ? "#d97706" : "#444",
                      fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600
                    }}>{fee.type}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "6px", fontStyle: "italic" }}>{fee.note}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#111", border: "1px solid #331111", borderRadius: "8px", padding: "16px", marginTop: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#ef4444", marginBottom: "8px" }}>TOTAL NEGOTIABLE MARKUP (Sales Discount Only)</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444" }}>
                ${fmt(14100.95 + 5904.49 + 2981.65 + 570.64)}/month
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                ${fmt((14100.95 + 5904.49 + 2981.65 + 570.64) * 12)}/year at current volume
              </div>
            </div>
          </div>
        )}

        {/* ===== INTERCHANGE DEEP DIVE ===== */}
        {tab === 3 && (
          <div>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>
              The top 10 interchange categories account for the majority of non-negotiable fees. This is the "forest" — each card type, each tier, each rate. Wells Fargo calls them one thing. Chase calls them another. The rates underneath are identical.
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #333" }}>
                    {["Universal Name", "WF Statement Name", "Volume", "Rate", "Cost", "% of Net"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "#555", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOP_INTERCHANGE.map((ic, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "10px", fontWeight: 600, color: "#fff" }}>{ic.name}</td>
                      <td style={{ padding: "10px", color: "#666", fontSize: "10px" }}>{ic.wfName}</td>
                      <td style={{ padding: "10px" }}>${fmt(ic.volume)}</td>
                      <td style={{ padding: "10px", color: "#2563eb" }}>{ic.rate}</td>
                      <td style={{ padding: "10px", color: "#ef4444" }}>${fmt(ic.cost)}</td>
                      <td style={{ padding: "10px" }}>{ic.pctOfTotal}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: "#0a0a1a", border: "1px solid #1a1a33", borderRadius: "8px", padding: "20px", marginTop: "24px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#60a5fa", marginBottom: "12px" }}>BRYAN'S ROSETTA STONE PROBLEM</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.8 }}>
                Wells Fargo calls it <span style={{ color: "#fff" }}>VI-ECOMM BSC P1 SIGN PREFERRED</span>.
                <br/>Chase might call it <span style={{ color: "#fff" }}>VS ECOM SIG PREF</span>.
                <br/>First Data might call it <span style={{ color: "#fff" }}>VISA SIGNATURE PREFERRED ECOMMERCE</span>.
                <br/>Worldpay might call it <span style={{ color: "#fff" }}>V-SIGPREF-EC</span>.
                <br/><br/>
                Same interchange category. Same rate (2.50% + $0.10). Four different names.
                <br/><br/>
                The tool needs a <span style={{ color: "#60a5fa", fontWeight: 600 }}>universal taxonomy</span> — a mapping layer that normalizes 50 processors' naming conventions into one canonical set. Then comparison becomes trivial. Upload Statement A, upload Statement B, see the truth.
                <br/><br/>
                This is a classification problem. AI eats classification problems for breakfast.
              </div>
            </div>
          </div>
        )}

        {/* ===== COMPARISON ENGINE ===== */}
        {tab === 4 && (
          <div>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>
              Adjust the sliders to model a competing offer. See the merchant's savings and your profit simultaneously.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px" }}>
                <label style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Your Markup (Sales Discount %)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <input type="range" min="0.10" max="0.70" step="0.05" value={compareMargin}
                    onChange={e => setCompareMargin(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: "#22c55e" }} />
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#22c55e", minWidth: "60px" }}>{compareMargin.toFixed(2)}%</span>
                </div>
                <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Wells Fargo charges 0.70%. Drag left to undercut.</div>
              </div>

              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px" }}>
                <label style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Your Per-Auth Fee
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <input type="range" min="0.01" max="0.05" step="0.005" value={compareAuthFee}
                    onChange={e => setCompareAuthFee(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: "#22c55e" }} />
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#22c55e", minWidth: "60px" }}>${compareAuthFee.toFixed(3)}</span>
                </div>
                <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Wells Fargo charges $0.050/auth. Market range: $0.01-0.03</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#0a1a0a", border: "1px solid #1a331a", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Merchant Saves (Monthly)</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#22c55e" }}>${fmt(Math.max(0, compareData.savings))}</div>
                <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "4px" }}>${fmt(Math.max(0, compareData.savings) * 12)}/year</div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Your Revenue (Monthly)</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>${fmt(compareData.newMarkup + compareData.newAuthFees)}</div>
                <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>${fmt((compareData.newMarkup + compareData.newAuthFees) * 12)}/year</div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>New Effective Rate</div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: compareData.newEffective < effectiveRate ? "#22c55e" : "#ef4444" }}>
                  {compareData.newEffective.toFixed(2)}%
                </div>
                <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>vs current {effectiveRate.toFixed(2)}%</div>
              </div>
            </div>

            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px" }}>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px", fontWeight: 600 }}>THE PITCH (auto-generated)</div>
              <div style={{ fontSize: "13px", color: "#ddd", lineHeight: 1.8, fontFamily: "'Georgia', serif" }}>
                "Based on your December volume of ${fmt(STATEMENT_DATA.totalSubmitted)}, your current effective rate is {effectiveRate.toFixed(2)}%. 
                Of that, ${fmt(FEE_ANATOMY.interchange.amount)} is interchange — identical regardless of processor. 
                Your processor markup is currently {(FEE_ANATOMY.service.amount / STATEMENT_DATA.totalSubmitted * 100).toFixed(2)}%.
                {compareData.savings > 0 && (
                  <> At our rate of {compareMargin.toFixed(2)}% with ${compareAuthFee.toFixed(3)}/auth, your effective rate drops to {compareData.newEffective.toFixed(2)}%, 
                  saving you <span style={{ color: "#22c55e", fontWeight: 700 }}>${fmt(compareData.savings)}/month</span> — that's <span style={{ color: "#22c55e", fontWeight: 700 }}>${fmt(compareData.savings * 12)}/year</span> back in your business."</>
                )}
              </div>
            </div>

            <div style={{ background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "20px", marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}/>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#f59e0b" }}>BRYAN'S TAKE (Processor's Eye)</div>
              </div>
              <div style={{ fontSize: "13px", color: "#ddd", lineHeight: 1.8, fontFamily: "'Georgia', serif" }}>
                "Simple math shows about 3.39% in fees. A flat rate program would save them about 0.6% — ~$20K — and I don't know what I'd save them with my buy rates matching all the different card types."
              </div>
              <div style={{ marginTop: "16px", background: "#0a0a0a", borderRadius: "6px", padding: "16px", fontSize: "12px", color: "#888", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600, color: "#aaa", marginBottom: "8px" }}>Two levels of savings:</div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1", minWidth: "200px", background: "#111", borderRadius: "6px", padding: "12px", border: "1px solid #1a1a1a" }}>
                    <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Level 1: Flat Rate Switch</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#22c55e" }}>~$20K/mo</div>
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>Known. Simple. 0.6% reduction.</div>
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>The easy pitch. Provable on a napkin.</div>
                  </div>
                  <div style={{ flex: "1", minWidth: "200px", background: "#111", borderRadius: "6px", padding: "12px", border: "1px solid #333" }}>
                    <div style={{ fontSize: "10px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Level 2: Interchange-Plus w/ Buy Rates</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#f59e0b" }}>? ? ?</div>
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>Unknown until buy rates are mapped per category.</div>
                    <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "2px" }}>This is exactly why the tool needs to exist.</div>
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "11px", color: "#666", borderTop: "1px solid #1a1a1a", paddingTop: "12px" }}>
                  The ??? is the product. When Bryan can input his buy rates against each of those 80+ interchange categories and instantly show both levels of savings side by side — flat rate vs. interchange-plus — the prospect sees the full picture and Bryan closes the deal with math, not salesmanship.
                </div>
              </div>
            </div>

            <div style={{ background: "#0a0a1a", border: "1px solid #1a1a33", borderRadius: "8px", padding: "20px", marginTop: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#60a5fa", marginBottom: "8px" }}>NOTE: What this doesn't do (yet)</div>
              <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.7 }}>
                This demo uses one statement from one processor. Bryan's full vision needs a Rosetta Stone — a mapping table of fee names across 50+ processors 
                so any statement from any processor gets normalized into the same taxonomy. Then comparison becomes automatic. 
                Upload the prospect's statement → AI parses it → maps to universal categories → shows the truth → generates the pitch.
                <br/><br/>
                The dataset Bryan needs to build: processor name → fee name → canonical category. That's the moat.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}