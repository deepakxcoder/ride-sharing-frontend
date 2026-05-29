"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  ChevronLeft, 
  AlertCircle,
  Loader2
} from "lucide-react";

// Types of documents required
const REQUIRED_DOCS = [
  { id: "license", label: "Driving License", desc: "Front side of your ID" },
  { id: "rc", label: "Vehicle Registration (RC)", desc: "Vehicle ownership proof" },
  { id: "insurance", label: "Vehicle Insurance", desc: "Valid insurance policy" },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userId,setUserId] = useState<string | null>(null);
  
  // Track status of each doc: null = not uploaded, 'uploading', 'done'
  const [docStatus, setDocStatus] = useState<Record<string, string>>({});
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch the DriverProfile ID based on the logged-in User
    // For demo, we assume we saved it in localStorage during the previous step
   const storedUserId = localStorage.getItem("userId");
  const storedDriverId = localStorage.getItem("driverId");

  if (!storedUserId || !storedDriverId) {
    alert("Please complete driver application first.");
    router.push("/driver");
    return;
  }

  setUserId(storedUserId);
  setDriverId(storedDriverId);
  }, []);

  // Handle File Selection
 const handleFileUpload = async (
  docId: string,
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file || !driverId) return;

  // 1️⃣ UI: set uploading
  setDocStatus(prev => ({ ...prev, [docId]: "uploading" }));

  try {
    // 2️⃣ Create FormData
    const formData = new FormData();

    // IMPORTANT: backend expects userId in body
    formData.append("userId", userId!);

    // IMPORTANT: field name MUST match FileFieldsInterceptor
    // docId = license | rc | insurance
    formData.append(docId, file);

    // 3️⃣ Send multipart request
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/driver/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // 4️⃣ UI: success
    setDocStatus(prev => ({ ...prev, [docId]: "done" }));

  } catch (error) {
    console.error(error);
    alert("Upload failed");
    setDocStatus(prev => ({ ...prev, [docId]: "error" }));
  }
};

  // Check if all are uploaded to enable "Finish" button
  useEffect(() => {
    const isComplete = REQUIRED_DOCS.every(doc => docStatus[doc.id] === "done");
    setAllDone(isComplete);
  }, [docStatus]);

  if (allDone === true) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-black">Application Received</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Thanks for choosing Uber. Your profile is now <b>Pending Approval</b>. 
            We will review your vehicle details and notify you once you are ready to drive.
          </p>
          <button 
            onClick={() => router.push('/dashboard/driver')}
            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-black text-white p-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full">
                <ChevronLeft />
            </button>
            <div>
                <h1 className="text-xl font-bold">Required Documents</h1>
                <p className="text-gray-400 text-xs">Step 2 of 2</p>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8 flex gap-3">
            <AlertCircle className="text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
                Please upload clear photos. Blurred or expired documents will be rejected by the admin team.
            </p>
        </div>

        <div className="space-y-4">
            {REQUIRED_DOCS.map((doc) => {
                const status = docStatus[doc.id];

                return (
                    <div key={doc.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'done' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {status === 'done' ? <CheckCircle2 /> : <FileText />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{doc.label}</h3>
                                <p className="text-xs text-gray-500">{doc.desc}</p>
                            </div>
                        </div>

                        {/* Upload Button logic */}
                        <div>
                            {status === 'uploading' ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Loader2 className="animate-spin" size={16} /> Uploading...
                                </div>
                            ) : status === 'done' ? (
                                <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                                    Uploaded
                                </span>
                            ) : (
                                <label className="cursor-pointer bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition flex items-center gap-2">
                                    <UploadCloud size={16} />
                                    Upload
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => handleFileUpload(doc.id, e)}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-6 bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
            <button 
                disabled={!allDone}
                onClick={() => router.push('/dashboard')} // Or a "Waiting for Approval" screen
                className="w-full bg-black text-white p-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                Submit for Verification
            </button>
        </div>
      </div>
    </div>
  );
}