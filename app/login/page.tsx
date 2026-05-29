"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight, RefreshCcw } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  /* ---------------- COOLDOWN TIMER ---------------- */
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  /* ---------------- REQUEST OTP ---------------- */
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login-signup`,
        { phoneNumber: phone }
      );

      setCooldown(res.data.cooldown || 30);
      setStep("OTP");
      setAttemptsLeft(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
        { phoneNumber: phone, otp }
      );

      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("roles", JSON.stringify(res.data.roles));
     

      const roles = res.data.roles;
      console.log(roles);

if (roles.includes("admin")) {
  router.push("/dashboard/admin");
} else if (res.data.isNewUser) {
  router.push("/setup");
} else {
  router.push("/dashboard");
}


    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid OTP";
      setError(msg);

      // Extract attempts left if present
      const match = msg.match(/Attempts left: (\d+)/);
      if (match) {
        setAttemptsLeft(Number(match[1]));
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* LEFT PANEL */}
      <div className="w-full md:w-1/3 px-10 py-12 flex flex-col justify-center bg-white shadow-xl z-10">
        <h1 className="text-4xl font-bold mb-2">Uber</h1>
        <p className="text-gray-500 mb-10 text-xl">
          Get moving with Uber Web
        </p>

        {step === "PHONE" ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition text-sm"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold
              hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Continue"}
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enter OTP sent to {phone}
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition text-sm"
                placeholder="000000"
                autoFocus
              />
            </div>

            {attemptsLeft !== null && (
              <p className="text-sm text-orange-600">
                Attempts left: {attemptsLeft}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              className="w-full bg-black text-white py-3 rounded-lg font-semibold
              hover:bg-gray-800 transition"
            >
              Verify Login
            </button>

            {/* RESEND OTP */}
            <button
              type="button"
              disabled={cooldown > 0}
              onClick={handleRequestOtp}
              className={`w-full flex items-center justify-center gap-2 text-sm
              ${cooldown > 0 ? "text-gray-400" : "text-black underline"}`}
            >
              <RefreshCcw size={14} />
              {cooldown > 0
                ? `Resend OTP in ${cooldown}s`
                : "Resend OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="w-full text-sm text-gray-500 underline"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>

      {/* RIGHT IMAGE PANEL */}
      <div className="hidden md:block w-2/3 relative">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d"
          className="w-full h-full object-cover"
          alt="Map"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-white text-7xl font-bold opacity-20">
            MAP VIEW
          </h1>
        </div>
      </div>
    </div>
  );
}
