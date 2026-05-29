"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Car, Truck, Bike, ShieldCheck, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

export default function DrivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<"IDLE" | "SUCCESS">("IDLE");

  // Form State
  const [form, setForm] = useState({
    vehicleModel: "",
    vehicleNumber: "",
    vehicleType: "UberX", // Default
  });

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const roles = localStorage.getItem('roles') || [''];
    if(roles.includes('driver')) router.push('/dashboard/driver');

    if (!id) {
      router.push("/"); 
    } else {
      setUserId(id);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connecting to your DriverService logic
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/driver/apply`, {
        userId: userId,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
        vehicleModel: form.vehicleModel
      });

      // Show Success UI instead of redirecting immediately
      localStorage.setItem("driverId", res.data.driverProfileId);
      router.push('/driver/documents');
      
    } catch (error: any) {
      console.error(error);
      if(error.response?.data?.message === 'Already applied as driver') {
         alert("You have already applied! Please wait for admin approval.");
      } else {
         alert("Application failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };


  // FORM VIEW
  return (
    <div className="flex min-h-screen bg-white">
      
      {/* LEFT PANEL: Branding & Value Prop */}
      <div className="hidden lg:flex w-5/12 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
           <div className="absolute right-[-100px] top-[100px] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Uber</h1>
            <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Driver Partner</span>
        </div>

        <div className="relative z-10">
           <h2 className="text-5xl font-bold mb-6 leading-[1.1]">Opportunity is <br/> everywhere.</h2>
           <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle2 className="text-white" /> <span>Set your own hours</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle2 className="text-white" /> <span>Get paid instantly</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle2 className="text-white" /> <span>24/7 Driver Support</span>
              </div>
           </div>
        </div>

        <p className="text-xs text-gray-500 relative z-10">© 2024 Uber Technologies Inc.</p>
      </div>

      {/* RIGHT PANEL: The Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 overflow-y-auto">
        <div className="max-w-[550px] w-full">
            
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-black mb-3">Add your vehicle</h1>
                <p className="text-gray-500 text-lg">Enter your vehicle details to start earning.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Vehicle Type Selector (Cards) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase mb-3">Select Category</label>
                    {/* CHANGED TO GRID-COLS-3 to fit Bike */}
                    <div className="grid grid-cols-3 gap-3">
                        <div 
                            onClick={() => setForm({...form, vehicleType: 'UberX'})}
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-all ${form.vehicleType === 'UberX' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <Car className={form.vehicleType === 'UberX' ? 'text-black' : 'text-gray-400'} size={28} />
                            <div>
                                <p className="font-bold text-black">UberX</p>
                                <p className="text-xs text-gray-500">Sedan</p>
                            </div>
                        </div>

                        <div 
                            onClick={() => setForm({...form, vehicleType: 'UberXL'})}
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-all ${form.vehicleType === 'UberXL' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <Truck className={form.vehicleType === 'UberXL' ? 'text-black' : 'text-gray-400'} size={28} />
                            <div>
                                <p className="font-bold text-black">UberXL</p>
                                <p className="text-xs text-gray-500">SUV/Van</p>
                            </div>
                        </div>

                         {/* ADDED BIKE CATEGORY */}
                         <div 
                            onClick={() => setForm({...form, vehicleType: 'Moto'})}
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-all ${form.vehicleType === 'Moto' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <Bike className={form.vehicleType === 'Moto' ? 'text-black' : 'text-gray-400'} size={28} />
                            <div>
                                <p className="font-bold text-black">Moto</p>
                                <p className="text-xs text-gray-500">Bike</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Inputs */}
                <div className="space-y-5">
                    <div className="group">
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 group-focus-within:text-black">Vehicle Model</label>
                        <input 
                            required
                            placeholder="e.g. Toyota Camry 2023"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-black transition placeholder:text-gray-400 text-lg"
                            value={form.vehicleModel}
                            onChange={e => setForm({...form, vehicleModel: e.target.value})}
                        />
                    </div>

                    <div className="group">
                        <label className="block text-sm font-bold text-gray-700 uppercase mb-2 group-focus-within:text-black">License Plate Number</label>
                        <input 
                            required
                            placeholder="e.g. ABC - 8899"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-black transition placeholder:text-gray-400 text-lg uppercase tracking-widest"
                            value={form.vehicleNumber}
                            onChange={e => setForm({...form, vehicleNumber: e.target.value})}
                        />
                    </div>
                </div>

                {/* 3. Privacy Notice */}
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                    <ShieldCheck className="text-blue-600 shrink-0" />
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Your vehicle details will be reviewed. By continuing, you agree to background checks required by your local regulations.
                    </p>
                </div>

                {/* 4. Action Button */}
                <button 
                    disabled={loading}
                    className="w-full bg-black text-white p-5 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-xl active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                           <Loader2 className="animate-spin" /> Processing Application...
                        </>
                    ) : (
                        <>
                           Submit Application <ChevronRight />
                        </>
                    )}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
}