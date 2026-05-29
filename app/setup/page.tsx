"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { User, Mail, CreditCard, ChevronRight } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    paymentMethod: "cash",
  });

  // 🔐 Email OTP states
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailStatus, setEmailStatus] = useState<null | "success" | "error">(null);
  const [emailMessage, setEmailMessage] = useState("");

  /* ==========================
     EMAIL OTP ACTIONS
  ========================== */

  const sendEmailOtp = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/email/send-otp`, {
        email: form.email,
      });

      setEmailOtpSent(true);
      setEmailMessage("OTP sent to your email");
      setEmailStatus(null);
    } catch (error) {
      setEmailMessage("Failed to send OTP");
      setEmailStatus("error");
    }
  };

  const verifyEmailOtp = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/email/verify-otp`, {
        email: form.email,
        otp: emailOtp,
      });

      setEmailVerified(true);
      setEmailStatus("success");
      setEmailMessage("Email verified successfully");
    } catch (error) {
      setEmailStatus("error");
      setEmailMessage("Invalid or expired OTP");
    }
  };

  /* ==========================
     FINAL SUBMIT
  ========================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailVerified) {
      alert("Please verify your email before continuing.");
      return;
    }

    setLoading(true);

    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("Error: No user ID found. Please login again.");
      router.push("/");
      return;
    }

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
     UI
  ========================== */

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 text-3xl text-gray-900 font-bold tracking-tight">
        Uber
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-[450px]">
        <h1 className="text-gray-900 text-2xl font-extrabold mb-2">
          Finish signing up
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          We need a few more details to get you moving.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                First Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  required
                  placeholder="John"
                  className="w-full pl-10 p-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Last Name
              </label>
              <input
                required
                placeholder="Doe"
                className="w-full p-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* EMAIL + OTP */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Email Address
            </label>

            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                required
                type="email"
                placeholder="john@example.com"
                className="w-full pl-10 p-2.5 bg-gray-50 border text-gray-900 border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                value={form.email}
                disabled={emailVerified}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setEmailVerified(false);
                  setEmailOtpSent(false);
                  setEmailOtp("");
                }}
              />
            </div>

            {!emailVerified && (
              <button
                type="button"
                onClick={sendEmailOtp}
                className="text-sm underline font-medium text-black"
              >
                Send verification code
              </button>
            )}

            {emailOtpSent && !emailVerified && (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full p-2.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                />

                <button
                  type="button"
                  onClick={verifyEmailOtp}
                  className="text-sm underline font-medium text-black"
                >
                  Verify email
                </button>
              </div>
            )}

            {emailMessage && (
              <p
                className={`text-xs ${
                  emailStatus === "success"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {emailMessage}
              </p>
            )}

            {emailVerified && (
              <p className="text-xs text-green-600 font-medium">
                ✅ Email verified
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, paymentMethod: "card" })
                }
                className={`p-3 border rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${
                  form.paymentMethod === "card"
                    ? "border-black bg-black text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CreditCard size={16} /> Card
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, paymentMethod: "cash" })
                }
                className={`p-3 border rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${
                  form.paymentMethod === "cash"
                    ? "border-black bg-black text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                💵 Cash
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            By clicking "Complete Setup", you agree to Uber's Terms.
          </p>

          <button
            disabled={loading}
            className="w-full bg-black text-white p-4 rounded-lg font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            {loading ? "Saving..." : "Complete Setup"}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
