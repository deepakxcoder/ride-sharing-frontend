"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ShieldAlert,
  Car,
  Check,
  X,
  Loader2,
  ChevronRight,
  ArrowLeft,
  FileText,
  Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";

// ---------- TYPES ----------
// Matching the "Robust" schema we built earlier
export interface DriverRequest {
  _id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel: string;
  createdAt: string;

  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };

  documents: {
    license?: { url: string };
    rc?: { url: string };
    insurance?: { url: string };
  };
}


// ---------- MAIN COMPONENT ----------
export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "drivers">("dashboard");
  
  // State for the "Detail View" (Document Review)
  const [selectedDriver, setSelectedDriver] = useState<DriverRequest | null>(null);

  useEffect(() => {
    // Basic Role Guard
    const userId = localStorage.getItem("userId");
    if (!userId) router.replace("/");
    // In real app, verify token/role here
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-800 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-black text-white flex flex-col fixed h-full z-10">
        <div className="p-8 flex gap-3 items-center border-b border-gray-900">
          <div className="bg-white text-black p-1 rounded">
             <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wider">UBER</h1>
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Admin Portal</span>
          </div>
        </div>

        <nav className="px-4 space-y-2 mt-6">
          <button
            onClick={() => { setActiveTab("dashboard"); setSelectedDriver(null); }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${
              activeTab === "dashboard" && !selectedDriver
                ? "bg-gray-800 text-white shadow-lg border-l-4 border-blue-500"
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
          >
            <LayoutDashboard size={20} /> <span className="font-medium">Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab("drivers"); setSelectedDriver(null); }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${
              activeTab === "drivers" || selectedDriver
                ? "bg-gray-800 text-white shadow-lg border-l-4 border-blue-500"
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            }`}
          >
            <Users size={20} /> <span className="font-medium">Driver Requests</span>
          </button>
        </nav>

        <button
          onClick={() => router.push("/")}
          className="mt-auto m-6 p-4 flex gap-3 text-red-400 hover:bg-red-900/20 rounded-xl transition"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 ml-72 p-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">
                    {selectedDriver ? "Application Review" : activeTab === 'dashboard' ? "System Overview" : "Driver Requests"}
                </h2>
                <p className="text-slate-500 mt-1">
                    {selectedDriver ? `Reviewing documents for ${selectedDriver.userId.firstName}` : "Welcome back, Admin."}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">A</div>
            </div>
        </header>

        {/* View Switcher */}
        {selectedDriver ? (
            <DriverDetailView 
                driver={selectedDriver} 
                onBack={() => setSelectedDriver(null)} 
            />
        ) : activeTab === "dashboard" ? (
            <DashboardView onRequestClick={() => setActiveTab("drivers")} />
        ) : (
            <DriversListView onSelectDriver={setSelectedDriver} />
        )}

      </main>
    </div>
  );
}

// ---------- 1. DASHBOARD STATS VIEW ----------
function DashboardView({ onRequestClick }: { onRequestClick: () => void }) {
  const [stats, setStats] = useState({ totalUsers: 0, activeDrivers: 0, pendingApprovals: 0 });

  useEffect(() => {
    // Fetch Real Stats
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`)
         .then(res => setStats(res.data))
         .catch(err => console.error(err));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
         <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">+12%</span>
         </div>
         <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Users</div>
         <div className="text-4xl font-bold text-slate-900 mt-2">{stats.totalUsers}</div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
         <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Car size={24} /></div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online</span>
         </div>
         <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Drivers</div>
         <div className="text-4xl font-bold text-slate-900 mt-2">{stats.activeDrivers}</div>
      </div>

      <div 
        onClick={onRequestClick}
        className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition group"
      >
         <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition"><ShieldAlert size={24} /></div>
            <ChevronRight className="text-gray-300 group-hover:text-blue-500" />
         </div>
         <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">Pending Approvals</div>
         <div className="text-4xl font-bold text-slate-900 mt-2">{stats.pendingApprovals}</div>
         <div className="mt-4 text-xs font-bold text-blue-600">Review Now &rarr;</div>
      </div>
    </div>
  );
}


// ---------- 2. DRIVER LIST VIEW ----------
function DriversListView({ onSelectDriver }: { onSelectDriver: (d: DriverRequest) => void }) {
  const [drivers, setDrivers] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const buildImageUrl = (path: string) => {
    console.log(`${process.env.NEXT_PUBLIC_API_URL}/${path}`);
  return `${process.env.NEXT_PUBLIC_API_URL}/${path}`;
};

  useEffect(() => {
    axios
    .get(`${process.env.NEXT_PUBLIC_API_URL}/admin/drivers?status=pending`)
    .then((res) => {
      const mapped = res.data.map((d: any) => ({
        _id: d._id,
        status: d.status,
        vehicleType: d.vehicleType,
        vehicleNumber: d.vehicleNumber,
        vehicleModel: d.vehicleModel,
        createdAt: d.createdAt,

        userId: d.userId,

        documents: {
          license: d.licenseUrl ? { url: buildImageUrl(d.licenseUrl) } : undefined,
          rc: d.rcUrl ? { url: buildImageUrl(d.rcUrl) } : undefined,
          insurance: d.insuranceUrl ? { url: buildImageUrl(d.insuranceUrl) } : undefined,
        },
      }));

      setDrivers(mapped);
      console.log(drivers)
    })
    .finally(() => setLoading(false));

  }, []);
  useEffect(() => {
  console.log("Drivers updated:", drivers);
}, [drivers]);


  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" size={40} /></div>;

  if (drivers.length === 0) {
    return (
        <div className="text-center p-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Check className="mx-auto text-green-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-800">All caught up!</h3>
            <p className="text-slate-500">No pending requests to review.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4">
      {drivers.map((driver) => (
        <div
          key={driver._id}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex justify-between items-center group"
        >
          {/* USER INFO */}
          <div className="flex gap-5 items-center">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">
              {driver.userId.firstName[0] || 'P'}
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">
                {driver.userId.firstName} {driver.userId.lastName}
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-2">
                {driver.userId.phoneNumber}
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Pending</span>
              </div>
            </div>
          </div>

          {/* VEHICLE INFO */}
          <div className="hidden md:block text-right mr-10">
            <div className="font-bold text-slate-800">{driver.vehicleModel}</div>
            <div className="text-sm text-slate-500 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
              {driver.vehicleNumber}
            </div>
          </div>

          {/* ACTION */}
          <button 
            onClick={() => onSelectDriver(driver)}
            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-gray-200"
          >
            Review Application <ChevronRight size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------- 3. DRIVER DETAIL VIEW (DOCUMENT REVIEW) ----------
function DriverDetailView({ driver, onBack }: { driver: DriverRequest, onBack: () => void }) {
    const handleAction = async (action: 'approve' | 'reject') => {
        console.log('ACTION CLICKED:', action);
  if (!confirm(`Are you sure you want to ${action} this driver?`)) return;

  try {
    if (action === 'approve') {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/driver/${driver._id}/approve`
      );

      alert('Driver approved successfully');
      onBack();
      return;
    }

    // 🔴 REJECT FLOW
    const reason = prompt('Enter rejection reason');
    if (!reason) {
      alert('Rejection reason is required');
      return;
    }

    const rejectedDocs: ('license' | 'rc' | 'insurance')[] = [];

    if (confirm('Reject LICENSE document?')) rejectedDocs.push('license');
    if (confirm('Reject RC document?')) rejectedDocs.push('rc');
    if (confirm('Reject INSURANCE document?')) rejectedDocs.push('insurance');

    if (rejectedDocs.length === 0) {
      alert('Please select at least one rejected document');
      return;
    }

    await axios.patch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/driver/${driver._id}/reject`,
      {
        reason,
        documents: rejectedDocs,
      }
    );

    alert('Driver rejected with reason');
    onBack();
  } catch (error) {
    console.error(error);
    alert('Action failed');
  }
};

    

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300">
            {/* Back Button */}
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-black mb-6 font-medium transition">
                <ArrowLeft size={20} /> Back to list
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Info Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center font-bold text-3xl mb-4">
                            {driver.userId.firstName[0] || 'P'}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{driver.userId.firstName} {driver.userId.lastName}</h2>
                        <p className="text-slate-500">{driver.userId.phoneNumber}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Vehicle</p>
                            <p className="font-bold text-slate-900">{driver.vehicleModel}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Plate Number</p>
                            <p className="font-bold text-slate-900">{driver.vehicleNumber}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Applied On</p>
                            <div className="flex items-center gap-2 font-medium">
                                <Calendar size={16} /> {new Date(driver.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 space-y-3">
                        <button 
                            onClick={() => handleAction('approve')}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                        >
                            <Check /> Approve Driver
                        </button>
                        <button 
                            onClick={() => handleAction('reject')}
                            className="w-full bg-white border border-red-200 text-red-600 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
                        >
                            <X /> Reject Application
                        </button>
                    </div>
                </div>

                {/* RIGHT: Documents Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <FileText /> Submitted Documents
                    </h3>

                    <div className="grid gap-6">
                        {['license', 'rc', 'insurance'].map(docKey => {
                             // @ts-ignore
                             const doc = driver.documents?.[docKey];
                             return (
                                <div key={docKey} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-bold capitalize text-lg text-slate-700">{docKey}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${doc?.url ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                            {doc?.url ? 'Uploaded' : 'Missing'}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-100 min-h-[300px] flex items-center justify-center relative">
                                        {doc?.url ? (
                                            <img 
                                                src={doc.url} 
                                                alt={docKey} 
                                                className="w-full h-full object-contain" // object-contain to see full doc
                                            />
                                        ) : (
                                            <div className="text-gray-400 flex flex-col items-center">
                                                <FileText size={40} className="mb-2 opacity-20" />
                                                <span>No document uploaded</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}