import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   SHARED UTILITIES
───────────────────────────────────────────── */
function useCountUp(target, duration = 1200, delay = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setValue(Math.floor(ease * target));
        if (p < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

function Confetti({ count = 22, colors }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 6 + Math.random() * 7,
      delay: Math.random() * 0.8,
      duration: 1.8 + Math.random() * 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? "50%" : "2px",
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(380px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            background: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RIDER PAYMENT SUCCESS
───────────────────────────────────────────── */
export function RiderPaymentSuccess({
  amount = 248,
  driverRating = 4.9,
  tripDistance = "12.4 km",
  tripDuration = "28 min",
  paymentMethod = "UPI · GPay",
  transactionId = "TXN8824561K",
  onDone,
}) {
  const [visible, setVisible] = useState(false);
  const [ringFill, setRingFill] = useState(0);
  const displayAmount = useCountUp(amount, 900, 700);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setRingFill(100), 400);
    return () => clearTimeout(t);
  }, []);

  const ringCircumference = 2 * Math.PI * 44;
  const ringOffset = ringCircumference - (ringFill / 100) * ringCircumference;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(10,10,20,0.72)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      transition: "opacity 0.4s",
      opacity: visible ? 1 : 0,
      fontFamily: "'Sora', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp   { from { opacity:0; transform:translateY(40px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes popIn     { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse     { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 50%{box-shadow:0 0 0 14px rgba(99,102,241,0)} }
        .rider-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.07); }
        .rider-row:last-child { border-bottom:none; }
        .rider-tag { font-size:12px; font-weight:500; color:rgba(255,255,255,0.45); letter-spacing:0.04em; text-transform:uppercase; }
        .rider-val { font-size:14px; font-weight:600; color:rgba(255,255,255,0.92); }
      `}</style>

      <div style={{
        width: "min(420px, 92vw)",
        borderRadius: 28,
        background: "linear-gradient(160deg, #0f0f23 0%, #16162e 60%, #0d0d1f 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15) inset",
        overflow: "hidden",
        position: "relative",
        animation: "slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <Confetti count={24} colors={["#818cf8","#a78bfa","#67e8f9","#f472b6","#fde68a"]} />

        <div style={{
          position:"absolute", top:-60, left:"50%", transform:"translateX(-50%)",
          width:240, height:240, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
          pointerEvents:"none",
        }} />

        <div style={{ padding: "36px 28px 28px", position:"relative", zIndex:1 }}>
          {/* Ring + Check */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
            <div style={{ position:"relative", width:100, height:100 }}>
              <svg width="100" height="100" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke="url(#riderGrad)" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
                />
                <defs>
                  <linearGradient id="riderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position:"absolute", inset:0, display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:34, animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.9s both",
              }}>✓</div>
            </div>

            <div style={{ marginTop:20, animation:"fadeSlide 0.5s ease 0.5s both", textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.4)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>
                Payment Successful
              </div>
              <div style={{ fontSize:48, fontWeight:800, color:"#fff", lineHeight:1, letterSpacing:"-0.02em" }}>
                ₹{displayAmount}
                <span style={{ fontSize:20, fontWeight:500, color:"rgba(255,255,255,0.35)", marginLeft:4 }}>.00</span>
              </div>
              <div style={{
                marginTop:10, display:"inline-flex", alignItems:"center", gap:6,
                background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)",
                borderRadius:999, padding:"4px 14px",
              }}>
                <span style={{ fontSize:12, color:"#818cf8", fontWeight:600 }}>{paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Driver card */}
          <div style={{
            background:"rgba(255,255,255,0.04)", borderRadius:16,
            border:"1px solid rgba(255,255,255,0.08)", padding:"14px 16px",
            marginBottom:16, animation:"fadeSlide 0.5s ease 0.7s both",
            display:"flex", alignItems:"center", gap:14,
          }}>
          
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:2 }}>Your Driver</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#fbbf24" }}>★ {driverRating}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1 }}>Rating</div>
            </div>
          </div>

          {/* Trip details */}
          <div style={{
            background:"rgba(255,255,255,0.03)", borderRadius:16,
            border:"1px solid rgba(255,255,255,0.07)", padding:"4px 16px",
            marginBottom:24, animation:"fadeSlide 0.5s ease 0.85s both",
          }}>
            <div className="rider-row"><span className="rider-tag">Distance</span><span className="rider-val">📍 {tripDistance}</span></div>
            <div className="rider-row"><span className="rider-tag">Duration</span><span className="rider-val">⏱ {tripDuration}</span></div>
            <div className="rider-row">
              <span className="rider-tag">Transaction ID</span>
              <span className="rider-val" style={{ fontSize:12, fontFamily:"monospace", color:"rgba(255,255,255,0.5)" }}>{transactionId}</span>
            </div>
          </div>

          <button
            onClick={onDone}
            style={{
              width:"100%", height:54, borderRadius:14,
              background:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
              border:"none", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer",
              letterSpacing:"0.02em",
              boxShadow:"0 8px 24px rgba(79,70,229,0.4)",
              animation:"fadeSlide 0.5s ease 1s both, pulse 2s ease 1.5s infinite",
              transition:"transform 0.15s, box-shadow 0.15s",
            }}
            onMouseDown={e => e.currentTarget.style.transform="scale(0.97)"}
            onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DRIVER EARNINGS SUCCESS
───────────────────────────────────────────── */
export function DriverPaymentSuccess({
  earned = 210,
  riderName = "Priya Mehta",
  riderRating = 4.8,
  tripDistance = "12.4 km",
  tripDuration = "28 min",
  platformFee = 38,
  transactionId = "TXN8824561K",
  onDone,
}) {
  const [visible, setVisible] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const displayEarned = useCountUp(earned, 1000, 700);
  const total = earned + platformFee;
  const earningsPercent = Math.round((earned / total) * 100);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setBarWidth(earningsPercent), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(5,15,5,0.78)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      transition:"opacity 0.4s",
      opacity: visible ? 1 : 0,
      fontFamily:"'Sora', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp   { from{opacity:0;transform:translateY(40px) scale(0.96);}to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes popIn     { from{opacity:0;transform:scale(0.3) rotate(-20deg);}to{opacity:1;transform:scale(1) rotate(0deg);} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        @keyframes glow      { 0%,100%{box-shadow:0 0 0 6px rgba(34,197,94,0.15),0 8px 32px rgba(34,197,94,0.35)}50%{box-shadow:0 0 0 10px rgba(34,197,94,0.25),0 8px 40px rgba(34,197,94,0.5)} }
        .drv-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
        .drv-row:last-child { border-bottom:none; }
        .drv-tag { font-size:12px; font-weight:500; color:rgba(255,255,255,0.38); letter-spacing:0.04em; text-transform:uppercase; }
        .drv-val { font-size:14px; font-weight:600; color:rgba(255,255,255,0.9); }
      `}</style>

      <div style={{
        width:"min(420px,92vw)",
        borderRadius:28,
        background:"linear-gradient(160deg, #071208 0%, #0a1a0c 55%, #060f07 100%)",
        border:"1px solid rgba(255,255,255,0.09)",
        boxShadow:"0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,197,94,0.12) inset",
        overflow:"hidden",
        position:"relative",
        animation:"slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <Confetti count={20} colors={["#4ade80","#86efac","#bbf7d0","#fde68a","#34d399"]} />

        <div style={{
          position:"absolute", top:-80, left:"50%", transform:"translateX(-50%)",
          width:280, height:280, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(34,197,94,0.28) 0%, transparent 70%)",
          pointerEvents:"none",
        }} />

        <div style={{ padding:"36px 28px 28px", position:"relative", zIndex:1 }}>
          {/* Coin icon + amount */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{
              width:88, height:88, borderRadius:"50%", margin:"0 auto 20px",
              background:"linear-gradient(135deg,#15803d 0%,#22c55e 50%,#4ade80 100%)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:40,
              animation:"popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.4s both, glow 2.5s ease 1.5s infinite",
            }}>
              💰
            </div>

            <div style={{ animation:"fadeSlide 0.5s ease 0.5s both" }}>
              <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.38)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>
                You Earned
              </div>
              <div style={{ fontSize:52, fontWeight:800, color:"#4ade80", lineHeight:1, letterSpacing:"-0.02em" }}>
                ₹{displayEarned}
                <span style={{ fontSize:20, fontWeight:500, color:"rgba(74,222,128,0.4)", marginLeft:3 }}>.00</span>
              </div>
              <div style={{ marginTop:8, fontSize:13, color:"rgba(255,255,255,0.35)", fontWeight:500 }}>
                Trip fare received · {transactionId}
              </div>
            </div>
          </div>

          {/* Earnings breakdown bar */}
          <div style={{
            marginBottom:18, animation:"fadeSlide 0.5s ease 0.65s both",
            background:"rgba(255,255,255,0.04)", borderRadius:16,
            border:"1px solid rgba(255,255,255,0.07)", padding:"16px 16px 14px",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.38)", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                Fare Breakdown
              </span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.38)", fontWeight:500 }}>₹{total} total</span>
            </div>
            <div style={{ height:10, borderRadius:99, background:"rgba(255,255,255,0.08)", overflow:"hidden", marginBottom:10 }}>
              <div style={{
                height:"100%", borderRadius:99,
                background:"linear-gradient(90deg,#15803d,#4ade80)",
                width:`${barWidth}%`,
                transition:"width 1s cubic-bezier(0.4,0,0.2,1)",
                boxShadow:"0 0 8px rgba(74,222,128,0.5)",
              }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:"#4ade80" }} />
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)", fontWeight:500 }}>Your {earningsPercent}% · ₹{earned}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:"rgba(255,255,255,0.2)" }} />
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontWeight:500 }}>Platform ₹{platformFee}</span>
              </div>
            </div>
          </div>

          {/* Rider card */}
          <div style={{
            background:"rgba(255,255,255,0.04)", borderRadius:16,
            border:"1px solid rgba(255,255,255,0.07)", padding:"14px 16px",
            marginBottom:16, animation:"fadeSlide 0.5s ease 0.8s both",
            display:"flex", alignItems:"center", gap:14,
          }}>
            <div style={{
              width:48, height:48, borderRadius:"50%", flexShrink:0,
              background:"linear-gradient(135deg,#166534,#22c55e)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, fontWeight:700, color:"#fff",
              boxShadow:"0 4px 12px rgba(34,197,94,0.3)",
            }}>
              {riderName[0]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{riderName}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.38)", marginTop:2 }}>Rider</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#fbbf24" }}>★ {riderRating}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>Their rating</div>
            </div>
          </div>

          {/* Trip stats */}
          <div style={{
            background:"rgba(255,255,255,0.03)", borderRadius:16,
            border:"1px solid rgba(255,255,255,0.06)", padding:"4px 16px",
            marginBottom:24, animation:"fadeSlide 0.5s ease 0.92s both",
          }}>
            <div className="drv-row"><span className="drv-tag">Distance</span><span className="drv-val">📍 {tripDistance}</span></div>
            <div className="drv-row"><span className="drv-tag">Duration</span><span className="drv-val">⏱ {tripDuration}</span></div>
          </div>

          <button
            onClick={onDone}
            style={{
              width:"100%", height:54, borderRadius:14,
              background:"linear-gradient(135deg,#15803d 0%,#22c55e 100%)",
              border:"none", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer",
              letterSpacing:"0.02em",
              boxShadow:"0 8px 24px rgba(34,197,94,0.35)",
              animation:"fadeSlide 0.5s ease 1.05s both",
              transition:"transform 0.15s, box-shadow 0.15s",
            }}
            onMouseDown={e => e.currentTarget.style.transform="scale(0.97)"}
            onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
          >
            Find Next Ride 🚗
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DEMO / PREVIEW
───────────────────────────────────────────── */
export default function Demo() {
  const [view, setView] = useState("menu");

  if (view === "rider") return (
    <RiderPaymentSuccess
      amount={248}
      driverName="Rajveer Singh"
      driverRating={4.9}
      tripDistance="12.4 km"
      tripDuration="28 min"
      paymentMethod="UPI · GPay"
      transactionId="TXN8824561K"
      onDone={() => setView("menu")}
    />
  );

  if (view === "driver") return (
    <DriverPaymentSuccess
      earned={210}
      riderName="Priya Mehta"
      riderRating={4.8}
      tripDistance="12.4 km"
      tripDuration="28 min"
      platformFee={38}
      transactionId="TXN8824561K"
      onDone={() => setView("menu")}
    />
  );

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"#0a0a14", gap:16,
      fontFamily:"'Sora', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&display=swap');`}</style>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" }}>
        Preview Mode
      </p>
      {[
        { label:"🧑‍💼  Rider Payment Success", key:"rider", from:"#4f46e5", to:"#7c3aed" },
        { label:"🚗  Driver Earnings Success", key:"driver", from:"#15803d", to:"#22c55e" },
      ].map(btn => (
        <button
          key={btn.key}
          onClick={() => setView(btn.key)}
          style={{
            width:260, height:52, borderRadius:14,
            background:`linear-gradient(135deg,${btn.from},${btn.to})`,
            border:"none", color:"#fff",
            fontSize:15, fontWeight:700, cursor:"pointer",
            boxShadow:`0 6px 20px ${btn.from}55`,
            letterSpacing:"0.01em",
            transition:"transform 0.15s",
          }}
          onMouseDown={e => e.currentTarget.style.transform="scale(0.97)"}
          onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
