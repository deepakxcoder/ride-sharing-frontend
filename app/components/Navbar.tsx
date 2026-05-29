"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Car, Shield, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
 const [driverId, setDriverId] = useState<string | null>(null);
 const [mounted, setMounted] = useState(false);


  // ✅ Show navbar ONLY on dashboard pages
  if (!pathname.startsWith("/dashboard")) return null;

  useEffect(() => {
  const storedRoles = JSON.parse(localStorage.getItem("roles") || "[]");
  setRoles(storedRoles);
  setMounted(true);
}, []);
if (!mounted) return null;


  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <nav className="w-full h-16 border-b bg-white flex items-center justify-between px-8">
      
      {/* LEFT: Logo + Navigation */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-2xl text-gray-900 font-bold">
          Uber
        </Link>

        <Link
          href="/dashboard"
          className={`font-medium ${
            pathname === "/dashboard" ? "text-black" : "text-gray-900"
          }`}
        >
          Ride
        </Link>

        <Link
          href="/driver"
          className="font-medium text-black hover:text-gray-900"
        >
          Drive
        </Link>
      </div>

      {/* RIGHT: Role based actions */}
      <div className="flex items-center gap-6">

        {roles.includes("admin") && (
  <>
    <Link href="/dashboard/admin" className="flex gap-1 text-red-600">
      <Shield size={16} /> Admin Panel
    </Link>

    <Link href="/dashboard" className="text-sm text-gray-900 underline">
      Go to User Dashboard
    </Link>
  </>
)}


        {/* DRIVER */}
        {roles.includes("driver") && (
          <Link
            href="/dashboard/driver"
            className="flex items-center gap-1 text-gray-900 font-medium hover:text-xl"
          >
            <Car size={16} />
            Driver Mode
          </Link>
        )}

        {/* PROFILE */}
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1 text-sm text-black font-medium hover:text-xl"
        >
          <UserCircle size={18} />
          Account
        </Link>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-900 hover:text-xl hover:text-black"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
