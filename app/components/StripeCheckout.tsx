"use client";

import { useState, useEffect } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";

/* ─────────────────────────────────────────────
   CHECKOUT FORM
───────────────────────────────────────────── */
interface CheckoutFormProps {
  onSuccess: () => void;
  amount?: number;
  driverName?: string;
  tripDistance?: string;
  tripDuration?: string;
  pickupAddress?: string;
  dropAddress?: string;
}

export default function CheckoutForm({
  onSuccess,
  amount = 248,
  driverName = "Rajveer Singh",
  tripDistance = "12.4 km",
  tripDuration = "28 min",
  pickupAddress = "Sector 17, Chandigarh",
  dropAddress = "Elante Mall, Industrial Area",
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Payment failed. Please try again.");
      setLoading(false);
      return;
    }

    onSuccess();
  };

  const tax = Math.round(amount * 0.05);
  const total = amount + tax;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --bg-base:     #08090c;
          --bg-card:     #0f1116;
          --bg-elevated: #161820;
          --border:      rgba(255,255,255,0.08);
          --border-glow: rgba(251,191,36,0.25);
          --accent:      #f59e0b;
          --accent-dim:  rgba(245,158,11,0.12);
          --accent-glow: rgba(245,158,11,0.35);
          --green:       #22c55e;
          --text-primary: #f1f2f4;
          --text-muted:   rgba(241,242,244,0.45);
          --text-faint:   rgba(241,242,244,0.25);
          --radius-lg:   20px;
          --radius-md:   14px;
          --radius-sm:   10px;
          --font:        'Plus Jakarta Sans', sans-serif;
          --shadow-card: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset;
        }

        .sc-overlay {
          position: fixed; inset: 0; z-index: 999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(4,5,8,0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-family: var(--font);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .sc-overlay.sc-visible { opacity: 1; }

        .sc-panel {
          width: min(480px, 95vw);
          max-height: 95vh;
          overflow-y: auto;
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-card);
          position: relative;
          transform: translateY(28px) scale(0.97);
          transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
          opacity: 0;
          scrollbar-width: none;
        }
        .sc-panel::-webkit-scrollbar { display: none; }
        .sc-overlay.sc-visible .sc-panel {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        /* Glow blob */
        .sc-glow {
          position: absolute; top: -80px; right: -60px;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── Header ── */
        .sc-header {
          padding: 24px 24px 0;
          display: flex; align-items: center; justify-content: space-between;
          animation: scFadeUp 0.4s ease 0.1s both;
        }
        .sc-logo {
          display: flex; align-items: center; gap: 10px;
        }
        .sc-logo-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #d97706, #f59e0b);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(245,158,11,0.3);
        }
        .sc-logo-text {
          font-size: 16px; font-weight: 800;
          color: var(--text-primary); letter-spacing: -0.02em;
        }
        .sc-secure {
          display: flex; align-items: center; gap: 5px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
          border-radius: 99px; padding: 4px 10px;
        }
        .sc-secure-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--green);
          animation: scPulse 2s ease infinite;
        }
        .sc-secure span { font-size: 11px; font-weight: 600; color: var(--green); letter-spacing: 0.03em; }

        /* ── Trip summary ── */
        .sc-trip {
          margin: 20px 24px 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          animation: scFadeUp 0.4s ease 0.18s both;
        }
        .sc-trip-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 14px;
        }
        .sc-trip-label {
          font-size: 11px; font-weight: 600; color: var(--text-muted);
          letter-spacing: 0.07em; text-transform: uppercase;
        }
        .sc-trip-pills {
          display: flex; gap: 6px;
        }
        .sc-pill {
          background: var(--accent-dim); border: 1px solid var(--border-glow);
          border-radius: 99px; padding: 3px 9px;
          font-size: 11px; font-weight: 600; color: var(--accent);
        }
        .sc-route {
          display: flex; flex-direction: column; gap: 0;
        }
        .sc-route-stop {
          display: flex; align-items: flex-start; gap: 10px;
        }
        .sc-route-icon-col {
          display: flex; flex-direction: column; align-items: center;
          padding-top: 2px; flex-shrink: 0;
        }
        .sc-dot-green {
          width: 10px; height: 10px; border-radius: 50%; background: var(--green);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
        }
        .sc-dot-red {
          width: 10px; height: 10px; border-radius: 50%; background: #f87171;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.15);
        }
        .sc-route-line {
          width: 1px; height: 22px; background: var(--border); margin: 4px 0;
        }
        .sc-route-text {
          font-size: 13px; font-weight: 500; color: var(--text-primary);
          padding-bottom: 18px; line-height: 1.35;
        }
        .sc-route-sub {
          font-size: 11px; color: var(--text-muted); margin-top: 2px;
        }
        .sc-driver-row {
          margin-top: 14px; padding-top: 14px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; gap: 10px;
        }
        .sc-avatar {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #92400e, #d97706);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #fff;
          box-shadow: 0 2px 8px rgba(217,119,6,0.3);
        }
        .sc-driver-info { flex: 1; }
        .sc-driver-name { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .sc-driver-sub  { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
        .sc-star { color: #fbbf24; font-size: 11px; }

        /* ── Amount breakdown ── */
        .sc-breakdown {
          margin: 16px 24px 0;
          animation: scFadeUp 0.4s ease 0.25s both;
        }
        .sc-breakdown-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 13px;
        }
        .sc-breakdown-row:last-child { border-bottom: none; }
        .sc-breakdown-label { color: var(--text-muted); font-weight: 500; }
        .sc-breakdown-val   { color: var(--text-primary); font-weight: 600; }
        .sc-breakdown-total {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px; margin-top: 10px;
          background: var(--accent-dim); border: 1px solid var(--border-glow);
          border-radius: var(--radius-sm);
        }
        .sc-total-label { font-size: 14px; font-weight: 700; color: var(--accent); }
        .sc-total-val   { font-size: 22px; font-weight: 800; color: var(--accent); letter-spacing: -0.02em; }

        /* ── Divider ── */
        .sc-divider {
          margin: 20px 24px;
          height: 1px; background: var(--border);
          display: flex; align-items: center; justify-content: center;
          animation: scFadeUp 0.4s ease 0.3s both;
        }
        .sc-divider-label {
          background: var(--bg-card); padding: 0 12px;
          font-size: 11px; font-weight: 600; color: var(--text-faint);
          letter-spacing: 0.07em; text-transform: uppercase; margin-top: -1px;
        }

        /* ── Payment methods strip ── */
        .sc-methods {
          margin: 0 24px;
          display: flex; gap: 8px; flex-wrap: wrap;
          animation: scFadeUp 0.4s ease 0.33s both;
        }
        .sc-method-chip {
          display: flex; align-items: center; gap: 5px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 8px; padding: 5px 10px;
          font-size: 11px; font-weight: 600; color: var(--text-muted);
        }
        .sc-method-chip span { font-size: 14px; }

        /* ── Stripe Element Wrapper ── */
        .sc-element-wrap {
          margin: 20px 24px 0;
          animation: scFadeUp 0.4s ease 0.38s both;
        }
        .sc-element-label {
          font-size: 12px; font-weight: 600; color: var(--text-muted);
          letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 10px;
        }
        .sc-stripe-box {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px 16px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .sc-stripe-box:focus-within {
          border-color: rgba(245,158,11,0.4);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
        }

        /* ── Error ── */
        .sc-error {
          margin: 12px 24px 0;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          border-radius: var(--radius-sm); padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: #fca5a5;
          display: flex; align-items: center; gap: 8px;
          animation: scShake 0.3s ease;
        }

        /* ── CTA Button ── */
        .sc-cta {
          margin: 20px 24px 24px;
          animation: scFadeUp 0.4s ease 0.45s both;
        }
        .sc-btn {
          width: 100%; height: 56px; border-radius: var(--radius-md);
          background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%);
          border: none; cursor: pointer;
          font-family: var(--font); font-size: 16px; font-weight: 800;
          color: #0a0a0a; letter-spacing: 0.01em;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 8px 28px rgba(245,158,11,0.35), 0 2px 6px rgba(245,158,11,0.2);
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          position: relative; overflow: hidden;
        }
        .sc-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .sc-btn:hover::before { transform: translateX(100%); }
        .sc-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 36px rgba(245,158,11,0.45);
        }
        .sc-btn:active:not(:disabled) { transform: scale(0.98); }
        .sc-btn:disabled {
          opacity: 0.55; cursor: not-allowed;
          box-shadow: none; transform: none;
        }
        .sc-btn-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid rgba(10,10,10,0.3);
          border-top-color: #0a0a0a;
          animation: scSpin 0.7s linear infinite;
        }

        /* ── Footer ── */
        .sc-footer {
          padding: 0 24px 24px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          animation: scFadeUp 0.4s ease 0.5s both;
        }
        .sc-footer-text { font-size: 11px; color: var(--text-faint); font-weight: 500; }
        .sc-stripe-badge {
          display: flex; align-items: center; gap: 4px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 6px; padding: 3px 8px;
          font-size: 11px; font-weight: 700; color: var(--text-faint);
        }

        /* ── Keyframes ── */
        @keyframes scFadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes scPulse {
          0%,100% { opacity:1; } 50% { opacity:0.45; }
        }
        @keyframes scSpin {
          from { transform:rotate(0deg); } to { transform:rotate(360deg); }
        }
        @keyframes scShake {
          0%,100% { transform:translateX(0);   }
          25%     { transform:translateX(-6px); }
          75%     { transform:translateX(6px);  }
        }
      `}</style>

      <div className={`sc-overlay${mounted ? " sc-visible" : ""}`}>
        <div className="sc-panel">
          <div className="sc-glow" />

          {/* Header */}
          <div className="sc-header">
            <div className="sc-logo">
              <div className="sc-logo-mark">🚕</div>
              <span className="sc-logo-text">RideX Pay</span>
            </div>
            <div className="sc-secure">
              <div className="sc-secure-dot" />
              <span>Secure Checkout</span>
            </div>
          </div>

          {/* Trip Summary */}
          <div className="sc-trip">
            <div className="sc-trip-header">
              <span className="sc-trip-label">Trip Summary</span>
              <div className="sc-trip-pills">
                <span className="sc-pill">📍 {tripDistance}</span>
                <span className="sc-pill">⏱ {tripDuration}</span>
              </div>
            </div>
            <div className="sc-route">
              <div className="sc-route-stop">
                <div className="sc-route-icon-col">
                  <div className="sc-dot-green" />
                  <div className="sc-route-line" />
                </div>
                <div className="sc-route-text">
                  {pickupAddress}
                  <div className="sc-route-sub">Pickup location</div>
                </div>
              </div>
              <div className="sc-route-stop">
                <div className="sc-route-icon-col">
                  <div className="sc-dot-red" />
                </div>
                <div className="sc-route-text">
                  {dropAddress}
                  <div className="sc-route-sub">Drop location</div>
                </div>
              </div>
            </div>
            <div className="sc-driver-row">
              <div className="sc-avatar">{driverName[0]}</div>
              <div className="sc-driver-info">
                <div className="sc-driver-name">{driverName}</div>
                <div className="sc-driver-sub">
                  <span className="sc-star">★★★★★</span> 4.9 · Verified Driver
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="sc-breakdown">
            <div className="sc-breakdown-row">
              <span className="sc-breakdown-label">Base Fare</span>
              <span className="sc-breakdown-val">₹{amount}</span>
            </div>
            <div className="sc-breakdown-row">
              <span className="sc-breakdown-label">GST (5%)</span>
              <span className="sc-breakdown-val">₹{tax}</span>
            </div>
          </div>
          <div style={{ margin: "12px 24px 0" }}>
            <div className="sc-breakdown-total">
              <span className="sc-total-label">Total Payable</span>
              <span className="sc-total-val">₹{total}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="sc-divider">
            <span className="sc-divider-label">Choose Payment Method</span>
          </div>

          {/* Payment Methods */}
          <div className="sc-methods">
            {[
              { icon: "💳", label: "Card" },
              { icon: "🇮🇳", label: "UPI" },
              { icon: "G", label: "GPay" },
              { icon: "🏦", label: "Netbanking" },
            ].map((m) => (
              <div key={m.label} className="sc-method-chip">
                <span>{m.icon}</span> {m.label}
              </div>
            ))}
          </div>

          {/* Stripe Element */}
          <div className="sc-element-wrap">
            <div className="sc-element-label">Payment Details</div>
            <div className="sc-stripe-box">
              <PaymentElement
                onReady={() => setPaymentReady(true)}
                options={{
                  layout: "tabs",
                  paymentMethodOrder: ["card", "upi", "google_pay"],
                }}
              />
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="sc-error">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          {/* CTA */}
          <div className="sc-cta">
            <form onSubmit={handleSubmit}>
              <button
                type="submit"
                className="sc-btn"
                disabled={!stripe || loading || !paymentReady}
              >
                {loading ? (
                  <>
                    <div className="sc-btn-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{total} Securely
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="sc-footer">
            <span className="sc-footer-text">Powered by</span>
            <div className="sc-stripe-badge">
              <span style={{ color: "#6772e5", fontWeight: 800 }}>stripe</span>
            </div>
            <span className="sc-footer-text">· 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </>
  );
}