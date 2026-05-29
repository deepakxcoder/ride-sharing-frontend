"use client";

import { X, Star, Zap, User, ShieldCheck } from "lucide-react";

interface RideRequestCardProps {
  ride: any;
  onAccept?: () => void;
  onDecline?: () => void;
}


export default function RideRequestCard({ onAccept, onDecline,ride }: RideRequestCardProps) {
    if (!ride) return null;

  return (
    <div className="bg-white w-[360px] rounded-3xl shadow-2xl p-5 border border-gray-100 font-sans relative animate-in slide-in-from-bottom-5 duration-300">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {/* Ride Type Badge */}
          <div className="bg-black text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm">
            <User size={12} fill="white" /> {ride.rideType}

          </div>
          {/* Promo Badge */}
          <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
            Exclusive
          </div>
        </div>
        
        {/* Close Button */}
        <button 
          onClick={onDecline}
          className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"
        >
          <X size={18} className="text-gray-600" />
        </button>
      </div>

      {/* --- PRICE --- */}
      <div className="flex items-center gap-2 mb-3">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">₹{ride.price}
</h1>
        <Zap size={24} className="text-slate-900 fill-slate-900" />
      </div>

      {/* --- RIDER INFO --- */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold text-slate-700">
          <Star size={10} fill="currentColor" /> 4.95
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold text-blue-700">
          <ShieldCheck size={12} /> Verified
        </div>
      </div>

      {/* --- TIMELINE / ROUTE --- */}
      <div className="relative pl-4 space-y-6 mb-6">
        {/* Vertical Line Connector */}
        <div className="absolute left-[5px] top-2 bottom-8 w-0.5 bg-black rounded-full"></div>

        {/* Pickup */}
        <div className="relative z-10">
          <div className="absolute -left-[15px] top-1.5 w-2.5 h-2.5 bg-black rounded-full border-2 border-white shadow-sm"></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">{ride.pickup.etaMinutes} min ({ride.pickup.distanceKm} km) away
</h3>
            <p className="text-gray-500 text-sm font-medium mt-1 truncate">{ride.pickup.address}
</p>
          </div>
        </div>

        {/* Dropoff */}
        <div className="relative z-10">
          <div className="absolute -left-[15px] top-1.5 w-2.5 h-2.5 bg-black border-2 border-white shadow-sm"></div> {/* Square for dropoff */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">{ride.trip.durationMinutes} min ({ride.trip.distanceKm} km) trip
</h3>
            <p className="text-gray-500 text-sm font-medium mt-1 truncate">{ride.dropoff?.address}</p>
          </div>
        </div>
      </div>

      {/* --- ACCEPT BUTTON --- */}
      <button 
        onClick={onAccept}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-blue-200 transition-transform active:scale-[0.98]"
      >
        Accept
      </button>

    </div>
  );
}