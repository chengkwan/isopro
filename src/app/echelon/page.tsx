"use client";

import React, { useState, useEffect, useRef } from "react";

// ─── BIN DATABASE (simplified for demo — production would use a real BIN API) ───
const BIN_RANGES = {
  // Visa debit prefixes (common US issuers)
  debit: [
    "400337", "400610", "400837", "401757", "401758", "401795", "403471",
    "404616", "405572", "408980", "410039", "412285", "413051", "414720",
    "414740", "417500", "421741", "421742", "423223", "425765", "428600",
    "431940", "432917", "434769", "438857", "446290", "448590", "450875",
    "453211", "453998", "458000", "471500", "471600", "476134", "476173",
    "486694", "489580", "491870", "492130", "492181", "498409",
  ],
};

function detectCardBrand(number: string) {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return null;
}

function detectCardType(number: string) {
  const n = number.replace(/\s/g, "");
  if (n.length < 6) return null;
  const bin6 = n.substring(0, 6);
  if (BIN_RANGES.debit.includes(bin6)) return "debit";
  return "credit"; // default assumption for demo
}

function formatCardNumber(value: string) {
  const v = value.replace(/\D/g, "").substring(0, 16);
  const brand = detectCardBrand(v);
  if (brand === "amex") {
    return v.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  return v.replace(/(\d{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const v = value.replace(/\D/g, "").substring(0, 4);
  if (v.length >= 3) return v.substring(0, 2) + " / " + v.substring(2);
  return v;
}

// ─── CARD BRAND ICONS (SVG) ───
function CardBrandIcon({ brand, size = 32 }: { brand: string | null; size?: number }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    visa: { bg: "#1A1F71", text: "#FFFFFF", label: "VISA" },
    mastercard: { bg: "#EB001B", text: "#FFFFFF", label: "MC" },
    amex: { bg: "#2E77BB", text: "#FFFFFF", label: "AMEX" },
    discover: { bg: "#FF6600", text: "#FFFFFF", label: "DISC" },
  };
  const c = brand ? colors[brand] : undefined;
  if (!c) return null;

  if (brand === "mastercard") {
    return (
      <svg width={size} height={size * 0.625} viewBox="0 0 48 30">
        <rect width="48" height="30" rx="4" fill="#1A1F36" />
        <circle cx="19" cy="15" r="9" fill="#EB001B" />
        <circle cx="29" cy="15" r="9" fill="#F79E1B" />
        <path
          d="M24 8.5a9 9 0 010 13 9 9 0 010-13z"
          fill="#FF5F00"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size * 0.625} viewBox="0 0 48 30">
      <rect width="48" height="30" rx="4" fill={c.bg} />
      <text
        x="24" y="19"
        textAnchor="middle"
        fill={c.text}
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui"
      >
        {c.label}
      </text>
    </svg>
  );
}

// ─── LOCK ICON ───
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 7V5a4 4 0 118 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h1zm2-2a2 2 0 114 0v2H6V5z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── CHECKMARK ICON ───
function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#10B981" />
      <path
        d="M14 24l7 7 13-13"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── MAIN COMPONENT ───
export default function EchelonPayModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("form"); // form | processing | success
  const [amount, setAmount] = useState(225.0);

  // Form state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [zip, setZip] = useState("");
  const [email, setEmail] = useState("");

  // Derived state
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [cardType, setCardType] = useState<"debit" | "credit" | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const surchargeRate = 0.03;
  const surchargeAmount =
    cardType === "credit" ? +(amount * surchargeRate).toFixed(2) : 0;
  const totalAmount = +(amount + surchargeAmount).toFixed(2);

  const modalRef = useRef(null);

  useEffect(() => {
    const raw = cardNumber.replace(/\s/g, "");
    setCardBrand(detectCardBrand(raw));
    setCardType(raw.length >= 6 ? detectCardType(raw) : null);
  }, [cardNumber]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
    setErrors((prev) => ({ ...prev, cardNumber: null }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatExpiry(e.target.value));
    setErrors((prev) => ({ ...prev, expiry: null }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cardName.trim()) e.cardName = "Required";
    if (cardNumber.replace(/\s/g, "").length < 15) e.cardNumber = "Invalid card number";
    if (expiry.replace(/\D/g, "").length < 4) e.expiry = "Invalid";
    if (cvv.length < 3) e.cvv = "Invalid";
    if (zip.length < 5) e.zip = "Invalid";
    if (email && !/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setStep("processing");
    // Simulate tokenization + charge
    setTimeout(() => {
      setStep("success");
      // In production: call EPSG tokenize endpoint, return token to merchant
      console.log("EchelonPay: Payment token generated", {
        amount: totalAmount,
        surcharge: surchargeAmount,
        cardType,
        cardBrand,
        // token would come from EPSG's tokenization API
      });
    }, 2200);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep("form");
      setCardName("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setZip("");
      setEmail("");
      setErrors({});
      setCardType(null);
      setCardBrand(null);
    }, 300);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  // ─── STYLES ───
  const styles: { [key: string]: React.CSSProperties } = {
    // Demo page
    demoPage: {
      minHeight: "100vh",
      background: "#F8F9FB",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
    },
    demoBadge: {
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      color: "#8B5CF6",
      background: "#EDE9FE",
      padding: "6px 16px",
      borderRadius: "100px",
      marginBottom: "20px",
    },
    demoTitle: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#0F172A",
      marginBottom: "8px",
      textAlign: "center",
    },
    demoSubtitle: {
      fontSize: "15px",
      color: "#64748B",
      marginBottom: "40px",
      textAlign: "center",
      maxWidth: "420px",
      lineHeight: "1.5",
    },
    merchantCard: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
      padding: "32px",
      width: "100%",
      maxWidth: "420px",
      marginBottom: "32px",
    },
    merchantLabel: {
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      color: "#94A3B8",
      marginBottom: "4px",
    },
    merchantName: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#0F172A",
      marginBottom: "20px",
    },
    amountRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      paddingTop: "16px",
      borderTop: "1px solid #F1F5F9",
    },
    amountLabel: {
      fontSize: "14px",
      color: "#64748B",
    },
    amountValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#0F172A",
      letterSpacing: "-0.5px",
    },
    payButton: {
      width: "100%",
      maxWidth: "420px",
      padding: "16px",
      background: "linear-gradient(135deg, #6D28D9, #7C3AED)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 4px 14px rgba(109, 40, 217, 0.35)",
      transition: "all 0.2s ease",
    },
    codeBlock: {
      marginTop: "48px",
      width: "100%",
      maxWidth: "520px",
    },
    codeLabel: {
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      color: "#94A3B8",
      marginBottom: "12px",
    },
    codeBox: {
      background: "#1E293B",
      borderRadius: "12px",
      padding: "20px 24px",
      fontSize: "13px",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#E2E8F0",
      lineHeight: "1.7",
      overflowX: "auto",
    },

    // Modal overlay
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none",
      transition: "opacity 0.25s ease",
      padding: "20px",
    },

    // Modal card
    modal: {
      background: "white",
      borderRadius: "20px",
      width: "100%",
      maxWidth: "440px",
      boxShadow:
        "0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
      transform: isOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
      transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      overflow: "hidden",
    },

    // Modal header
    header: {
      padding: "24px 28px 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    headerTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#0F172A",
      letterSpacing: "-0.3px",
    },
    headerSubtitle: {
      fontSize: "13px",
      color: "#94A3B8",
      fontWeight: "500",
    },
    closeBtn: {
      background: "#F1F5F9",
      border: "none",
      borderRadius: "10px",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#64748B",
      fontSize: "18px",
      fontWeight: "400",
      transition: "all 0.15s ease",
      flexShrink: 0,
    },

    // Form body
    body: {
      padding: "20px 28px 28px",
    },

    // Input group
    inputGroup: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.8px",
      textTransform: "uppercase",
      color: "#64748B",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      border: "1.5px solid #E2E8F0",
      borderRadius: "10px",
      fontSize: "15px",
      fontFamily: "'DM Sans', sans-serif",
      color: "#0F172A",
      outline: "none",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      background: "#FAFBFC",
      boxSizing: "border-box",
    },
    inputFocus: {
      borderColor: "#7C3AED",
      boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.1)",
      background: "white",
    },
    inputError: {
      borderColor: "#EF4444",
      boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.08)",
    },
    errorText: {
      fontSize: "11px",
      color: "#EF4444",
      marginTop: "4px",
      fontWeight: "500",
    },
    row: {
      display: "flex",
      gap: "12px",
    },
    cardNumberWrapper: {
      position: "relative",
    },
    brandIcons: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      gap: "4px",
      alignItems: "center",
    },

    // Surcharge disclosure
    surchargeBox: {
      background: cardType === "debit" ? "#F0FDF4" : "#FFFBEB",
      border: `1px solid ${cardType === "debit" ? "#BBF7D0" : "#FDE68A"}`,
      borderRadius: "10px",
      padding: "14px 16px",
      marginBottom: "20px",
      transition: "all 0.3s ease",
    },
    surchargeText: {
      fontSize: "12.5px",
      lineHeight: "1.55",
      color: cardType === "debit" ? "#166534" : "#92400E",
    },

    // Amount breakdown
    breakdown: {
      borderTop: "1px solid #F1F5F9",
      padding: "16px 0",
      marginBottom: "20px",
    },
    breakdownRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
      fontSize: "14px",
      color: "#64748B",
    },
    breakdownTotal: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "18px",
      fontWeight: "700",
      color: "#0F172A",
      paddingTop: "10px",
      borderTop: "1px solid #F1F5F9",
    },

    // Submit button
    submitBtn: {
      width: "100%",
      padding: "15px",
      background: "linear-gradient(135deg, #6D28D9, #7C3AED)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      boxShadow: "0 4px 14px rgba(109, 40, 217, 0.35)",
      transition: "all 0.2s ease",
    },

    // Footer
    footer: {
      background: "#F8FAFC",
      borderTop: "1px solid #F1F5F9",
      padding: "14px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      fontSize: "12px",
      color: "#94A3B8",
      fontWeight: "500",
    },
    footerBrand: {
      fontWeight: "700",
      color: "#6D28D9",
    },

    // Processing state
    processingContainer: {
      padding: "60px 28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
    },
    spinner: {
      width: "40px",
      height: "40px",
      border: "3px solid #E2E8F0",
      borderTopColor: "#7C3AED",
      borderRadius: "50%",
      animation: "echelon-spin 0.8s linear infinite",
    },
    processingText: {
      fontSize: "15px",
      color: "#64748B",
      fontWeight: "500",
    },

    // Success state
    successContainer: {
      padding: "48px 28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
    },
    successTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#0F172A",
    },
    successAmount: {
      fontSize: "32px",
      fontWeight: "700",
      color: "#10B981",
      letterSpacing: "-0.5px",
    },
    successDetail: {
      fontSize: "13px",
      color: "#94A3B8",
      textAlign: "center",
      lineHeight: "1.5",
    },
    doneBtn: {
      marginTop: "8px",
      padding: "12px 40px",
      background: "#0F172A",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      fontFamily: "inherit",
    },
  };

  // Focus state tracking for inputs
  const [focused, setFocused] = useState<string | null>(null);

  const getInputStyle = (field: string) => ({
    ...styles.input,
    ...(focused === field ? styles.inputFocus : {}),
    ...(errors[field] ? styles.inputError : {}),
  });

  return (
    <>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Keyframe animation */}
      <style>{`
        @keyframes echelon-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes echelon-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .echelon-input::placeholder {
          color: #CBD5E1;
        }
        .echelon-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(109, 40, 217, 0.4) !important;
        }
        .echelon-close:hover {
          background: #E2E8F0 !important;
          color: #334155 !important;
        }
      `}</style>

      {/* ─── DEMO PAGE ─── */}
      <div style={styles.demoPage}>
        <div style={styles.demoBadge}>Prototype Demo</div>
        <h1 style={styles.demoTitle}>Echelon Payment Modal</h1>
        <p style={styles.demoSubtitle}>
          Drop-in payment overlay with automatic BIN detection,
          credit/debit surcharge logic, and card-brand-compliant disclosure.
        </p>

        {/* Simulated merchant checkout */}
        <div style={styles.merchantCard}>
          <div style={styles.merchantLabel}>Merchant</div>
          <div style={styles.merchantName}>Too Big For My Car</div>
          <div style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
            Order #10042 — Furniture Delivery + Assembly
          </div>
          <div style={styles.amountRow}>
            <span style={styles.amountLabel}>Amount Due</span>
            <span style={styles.amountValue}>${amount.toFixed(2)}</span>
          </div>
        </div>

        <button
          className="echelon-btn"
          style={styles.payButton}
          onClick={handleOpen}
        >
          Pay ${amount.toFixed(2)}
        </button>

        {/* Integration code snippet */}
        <div style={styles.codeBlock}>
          <div style={styles.codeLabel}>Merchant Integration</div>
          <div style={styles.codeBox}>
            <span style={{ color: "#93C5FD" }}>{'<'}</span>
            <span style={{ color: "#FDE68A" }}>script</span>
            <span style={{ color: "#93C5FD" }}>{' src='}</span>
            <span style={{ color: "#86EFAC" }}>"echelon-pay.js"</span>
            <span style={{ color: "#93C5FD" }}>{'></'}</span>
            <span style={{ color: "#FDE68A" }}>script</span>
            <span style={{ color: "#93C5FD" }}>{'>'}</span>
            <br /><br />
            <span style={{ color: "#C4B5FD" }}>EchelonPay</span>
            <span style={{ color: "#E2E8F0" }}>.open</span>
            <span style={{ color: "#FDE68A" }}>{"({"}</span>
            <br />
            <span style={{ color: "#94A3B8" }}>{"  "}amount</span>
            <span style={{ color: "#E2E8F0" }}>{": "}</span>
            <span style={{ color: "#86EFAC" }}>22500</span>
            <span style={{ color: "#94A3B8" }}>,</span>
            <span style={{ color: "#64748B" }}>{" // cents"}</span>
            <br />
            <span style={{ color: "#94A3B8" }}>{"  "}surchargeRate</span>
            <span style={{ color: "#E2E8F0" }}>{": "}</span>
            <span style={{ color: "#86EFAC" }}>0.03</span>
            <span style={{ color: "#94A3B8" }}>,</span>
            <br />
            <span style={{ color: "#94A3B8" }}>{"  "}tokenKey</span>
            <span style={{ color: "#E2E8F0" }}>{": "}</span>
            <span style={{ color: "#86EFAC" }}>"pk_lQsk5G..."</span>
            <span style={{ color: "#94A3B8" }}>,</span>
            <br />
            <span style={{ color: "#94A3B8" }}>{"  "}onSuccess</span>
            <span style={{ color: "#E2E8F0" }}>{": "}</span>
            <span style={{ color: "#93C5FD" }}>{"(token) => "}</span>
            <span style={{ color: "#FDE68A" }}>{"{ ... }"}</span>
            <br />
            <span style={{ color: "#FDE68A" }}>{"}"}</span>
            <span style={{ color: "#E2E8F0" }}>)</span>
          </div>
        </div>
      </div>

      {/* ─── MODAL OVERLAY ─── */}
      <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div ref={modalRef} style={styles.modal}>

          {/* ─── FORM STATE ─── */}
          {step === "form" && (
            <>
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  <div style={styles.headerTitle}>Payment Information</div>
                  <div style={styles.headerSubtitle}>Too Big For My Car</div>
                </div>
                <button
                  className="echelon-close"
                  style={styles.closeBtn}
                  onClick={handleClose}
                >
                  ✕
                </button>
              </div>

              <div style={styles.body}>
                {/* Name */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Name on Card</label>
                  <input
                    className="echelon-input"
                    style={getInputStyle("cardName")}
                    placeholder="John Smith"
                    value={cardName}
                    onChange={(e) => {
                      setCardName(e.target.value);
                      setErrors((p) => ({ ...p, cardName: null }));
                    }}
                    onFocus={() => setFocused("cardName")}
                    onBlur={() => setFocused(null)}
                  />
                  {errors.cardName && (
                    <div style={styles.errorText}>{errors.cardName}</div>
                  )}
                </div>

                {/* Card number */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Card Number</label>
                  <div style={styles.cardNumberWrapper}>
                    <input
                      className="echelon-input"
                      style={{
                        ...getInputStyle("cardNumber"),
                        paddingRight: cardBrand ? "56px" : "14px",
                      }}
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      onFocus={() => setFocused("cardNumber")}
                      onBlur={() => setFocused(null)}
                    />
                    {cardBrand && (
                      <div style={styles.brandIcons}>
                        <CardBrandIcon brand={cardBrand} size={36} />
                      </div>
                    )}
                  </div>
                  {errors.cardNumber && (
                    <div style={styles.errorText}>{errors.cardNumber}</div>
                  )}
                </div>

                {/* Expiry / CVV / Zip */}
                <div style={{ ...styles.row, marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Expiry</label>
                    <input
                      className="echelon-input"
                      style={getInputStyle("expiry")}
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      onFocus={() => setFocused("expiry")}
                      onBlur={() => setFocused(null)}
                    />
                    {errors.expiry && (
                      <div style={styles.errorText}>{errors.expiry}</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>CVV</label>
                    <input
                      className="echelon-input"
                      style={getInputStyle("cvv")}
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => {
                        setCvv(e.target.value.replace(/\D/g, "").substring(0, 4));
                        setErrors((p) => ({ ...p, cvv: null }));
                      }}
                      onFocus={() => setFocused("cvv")}
                      onBlur={() => setFocused(null)}
                    />
                    {errors.cvv && (
                      <div style={styles.errorText}>{errors.cvv}</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Zip</label>
                    <input
                      className="echelon-input"
                      style={getInputStyle("zip")}
                      placeholder="97217"
                      value={zip}
                      onChange={(e) => {
                        setZip(e.target.value.replace(/\D/g, "").substring(0, 5));
                        setErrors((p) => ({ ...p, zip: null }));
                      }}
                      onFocus={() => setFocused("zip")}
                      onBlur={() => setFocused(null)}
                    />
                    {errors.zip && (
                      <div style={styles.errorText}>{errors.zip}</div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email (optional)</label>
                  <input
                    className="echelon-input"
                    style={getInputStyle("email")}
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((p) => ({ ...p, email: null }));
                    }}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                  />
                  {errors.email && (
                    <div style={styles.errorText}>{errors.email}</div>
                  )}
                </div>

                {/* Surcharge disclosure — only shows once we detect card type */}
                {cardType && (
                  <div
                    style={{
                      ...styles.surchargeBox,
                      animation: "echelon-fade-up 0.3s ease",
                    }}
                  >
                    {cardType === "credit" ? (
                      <div style={styles.surchargeText}>
                        To cover the cost of credit card acceptance, a{" "}
                        <strong>{(surchargeRate * 100).toFixed(1)}%</strong>{" "}
                        credit card fee applies. This fee is not more than our
                        cost of accepting these cards.{" "}
                        <strong>There is no fee for debit cards.</strong>
                      </div>
                    ) : (
                      <div style={styles.surchargeText}>
                        ✓ <strong>Debit card detected</strong> — no surcharge
                        will be applied to your transaction.
                      </div>
                    )}
                  </div>
                )}

                {/* Amount breakdown */}
                <div style={styles.breakdown}>
                  <div style={styles.breakdownRow}>
                    <span>Subtotal</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                  <div style={styles.breakdownRow}>
                    <span>
                      Credit card fee
                      {cardType === "credit" && (
                        <span style={{ opacity: 0.6 }}>
                          {" "}
                          ({(surchargeRate * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                    <span>
                      {cardType === "credit"
                        ? `$${surchargeAmount.toFixed(2)}`
                        : cardType === "debit"
                        ? "$0.00"
                        : "$—"}
                    </span>
                  </div>
                  <div style={styles.breakdownTotal}>
                    <span>Total</span>
                    <span>
                      {cardType
                        ? `$${totalAmount.toFixed(2)}`
                        : `$${amount.toFixed(2)}+`}
                    </span>
                  </div>
                </div>

                {/* Pay button */}
                <button
                  className="echelon-btn"
                  style={styles.submitBtn}
                  onClick={handleSubmit}
                >
                  <LockIcon />
                  Pay{" "}
                  {cardType
                    ? `$${totalAmount.toFixed(2)}`
                    : `$${amount.toFixed(2)}`}
                </button>
              </div>

              {/* Footer */}
              <div style={styles.footer}>
                <LockIcon />
                <span>
                  Secure payment powered by{" "}
                  <span style={styles.footerBrand}>Echelon</span>
                </span>
              </div>
            </>
          )}

          {/* ─── PROCESSING STATE ─── */}
          {step === "processing" && (
            <div style={styles.processingContainer}>
              <div style={styles.spinner} />
              <div style={styles.processingText}>Processing your payment…</div>
            </div>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {step === "success" && (
            <>
              <div
                style={{
                  ...styles.successContainer,
                  animation: "echelon-fade-up 0.4s ease",
                }}
              >
                <CheckIcon />
                <div style={styles.successTitle}>Payment Successful</div>
                <div style={styles.successAmount}>
                  ${totalAmount.toFixed(2)}
                </div>
                <div style={styles.successDetail}>
                  {cardBrand && (
                    <>
                      {cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)}{" "}
                      {cardType} ending in{" "}
                      {cardNumber.replace(/\s/g, "").slice(-4)}
                      <br />
                    </>
                  )}
                  A receipt will be sent to {email || "your email on file"}.
                </div>
                <button
                  style={styles.doneBtn}
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
              <div style={styles.footer}>
                <LockIcon />
                <span>
                  Secure payment powered by{" "}
                  <span style={styles.footerBrand}>Echelon</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}