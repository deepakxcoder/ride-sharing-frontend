"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Map, { Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

import {
    Power,
    Navigation,
    Menu,
    DollarSign,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import RideRequestCard from "@/app/components/RideRequestCard";

// Google Maps Styles to remove UI clutter (optional)
export default function DriverDashboard() {
    const router = useRouter();

    // Auth Data
    const [userId, setUserId] = useState<string | null>(null);
    const [driverId, setDriverId] = useState<string | null>(null);

    // Status States
    const [isOnline, setIsOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    // Location State (for Map)
    const [currentLocation, setCurrentLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    // Error State
    const [error, setError] = useState<{
        message: string;
        reason?: string;
        documents?: string[];
    } | null>(null);

    // Refs for persistent connections
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);

    const [incomingRide, setIncomingRide] = useState<any>(null);
    const [rideTaken, setRideTaken] = useState(false);

    // 1. INITIALIZATION
    useEffect(() => {
        const uId = localStorage.getItem("userId");
        const dId = localStorage.getItem("driverId");

        if (!uId) {
            router.push("/");
        } else {
            setUserId(uId);

            setDriverId(dId);
            setIsLoading(false);

            // Initial location for map center
            navigator.geolocation.getCurrentPosition(
  (pos) => {
    setCurrentLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    });
  },
  (err) => {
    console.error("Initial GPS error", err);

    // fallback location (India center)
    setCurrentLocation({
      lat: 28.6139,
      lng: 77.2090,
    });
  },
  {
    enableHighAccuracy: false, // 🔥 change this
    timeout: 15000,            // increase timeout
    maximumAge: 0,
  }
);
            // Connect socket
            socketRef.current = io("http://localhost:3000");
        } // ✅ THIS WAS MISSING

        // Cleanup
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            socketRef.current?.disconnect();
        };
    }, []);

    async function fetchDriver(userId: string) {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/driver/me`, {
                userId,
            });

            const { driverId, status, isOnline } = res.data;

            console.log("Driver ID:", driverId);
            localStorage.setItem("driverId", driverId);
            setDriverId(driverId);

            if (!driverId) {
                console.log("User is not a driver");
            }

            return res.data;
        } catch (err) {
            console.error("Error fetching driver:", err);
        }
    }

    useEffect(() => {
        if (!socketRef.current || !driverId) return;

        socketRef.current.emit("driver:join", { driverId });

        socketRef.current.on("new_ride_request", (data) => {
            console.log(data);
            setIncomingRide(data);
            console.log(data);
            setRideTaken(false);
        });

        socketRef.current.on("ride:taken", ({ rideId }) => {
            if (incomingRide?.rideId === rideId) {
                setRideTaken(true);
                setIncomingRide(null);
            }
        });

        // 🔥 ADD IT HERE
        socketRef.current.on("ride:accepted", (ride) => {
            setIncomingRide(null);
            router.push(`/driver/ride/${ride.rideId}`);
        });

        return () => {
            socketRef.current?.off("new_ride_request");
            socketRef.current?.off("ride:taken");
            socketRef.current?.off("ride:accepted");
        };
    }, [driverId]);

    useEffect(() => {
  if (!incomingRide) return;

  const timer = setTimeout(() => {
    setIncomingRide(null);
  }, 15000);

  return () => clearTimeout(timer);
}, [incomingRide]);

    // 2. START TRACKING (Socket Logic)
    const startLocationStreaming = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                if (isDraggingRef.current) return;
                const { latitude, longitude } = pos.coords;

                // Update Local Map State
                setCurrentLocation({ lat: latitude, lng: longitude });

                // Emit to Server
                if (socketRef.current && driverId) {
                    console.log(`📍 Streaming: ${latitude}, ${longitude}`);
                    socketRef.current.emit("driver:location", {
                        userId, // Send Driver Profile ID
                        lat: latitude,
                        lng: longitude,
                    });
                }
            },
            (err) => console.error("Location Error:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
        );
    };

    // 3. STOP TRACKING
    const stopLocationStreaming = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    // 4. TOGGLE BUTTON HANDLER (API Logic)
    const toggleOnline = async () => {
        setError(null);
        setIsToggling(true);

        try {
            // Get fresh coordinates for the API call
            const lat = currentLocation?.lat;
            const lng = currentLocation?.lng;

            if (lat === undefined || lng === undefined) {
                throw new Error("Location not ready");
            }

            // Call Backend
            const res = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/driver/status`,
                {
                    userId: userId,
                    isOnline: !isOnline,
                    lat: lat,
                    lng: lng,
                },
            );

            // Update State based on response
            const newStatus = res.data.isOnline;
            setIsOnline(newStatus);

            // Handle Streaming
            if (newStatus && socketRef.current && currentLocation) {
                if (userId) fetchDriver(userId);
                socketRef.current.emit("driver:location", {
                    userId,
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                });

                startLocationStreaming();
            } else {
                stopLocationStreaming();
            }
        } catch (error: any) {
            const data = error.response?.data;

            if (data?.code === "DRIVER_DOCUMENT_REJECTED") {
                setError({
                    message: data.message,
                    reason: data.reason,
                    documents: data.documents,
                });
            } else if (data?.code === "DRIVER_PENDING") {
                setError({
                    message: data.message,
                });
            } else {
                setError({
                    message: "Failed to go online. Check GPS/Network.",
                });
            }
        } finally {
            setIsToggling(false);
        }
    };

    if (isLoading)
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );

    return (
        <div className="h-screen w-full flex flex-col relative bg-gray-100 overflow-hidden">
            {/* --- HEADER --- */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center pointer-events-none">
                <div className="bg-white p-3 rounded-full shadow-lg pointer-events-auto cursor-pointer hover:bg-gray-50 transition">
                    <Menu className="text-black" />
                </div>
                <div className="bg-black text-white px-6 py-2 rounded-full shadow-lg font-bold pointer-events-auto flex items-center gap-2">
                    <DollarSign size={16} /> 0.00
                </div>
            </div>

            {/* --- ERROR BANNER --- */}
            {error && (
                <div className="absolute top-20 left-4 right-4 z-30 bg-red-500 text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top-2">
                    <div className="flex gap-3">
                        <AlertTriangle className="shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold text-sm">{error.message}</p>
                            {error.reason && (
                                <p className="text-xs opacity-90 mt-1">
                                    Reason: {error.reason}
                                </p>
                            )}
                            {error.documents?.length && (
                                <p className="text-xs mt-1">
                                    Fix:{" "}
                                    <span className="font-bold">
                                        {error.documents.join(", ")}
                                    </span>
                                </p>
                            )}
                            <button
                                onClick={() => router.push("/driver/documents")}
                                className="mt-3 bg-white text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50"
                            >
                                Re-upload Documents
                            </button>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="opacity-70 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* --- MAP AREA (Replaces the placeholder div) --- */}
            {/* --- MAP AREA --- */}
            <div className="flex-1 relative">
                {currentLocation ? (
                    <Map
                        mapLib={maplibregl}
                        initialViewState={{
                            latitude: currentLocation.lat,
                            longitude: currentLocation.lng,
                            zoom: 15,
                        }}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle="https://api.maptiler.com/maps/hybrid-v4/style.json?key=Zu49QfQqoiCeN31QOQJC"
                    >
                        <Marker
                            latitude={currentLocation.lat}
                            longitude={currentLocation.lng}
                            draggable
                            onDragStart={() => (isDraggingRef.current = true)}
                            onDragEnd={(e) => {
                                setCurrentLocation({
                                    lat: e.lngLat.lat,
                                    lng: e.lngLat.lng,
                                });

                                socketRef.current?.emit("driver:location", {
                                    userId,
                                    lat: e.lngLat.lat,
                                    lng: e.lngLat.lng,
                                });

                                isDraggingRef.current = false;
                            }}
                        />
                    </Map>
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                        {" "}
                        <div className="text-center">
                            {" "}
                            <Navigation
                                size={40}
                                className="mx-auto mb-2 animate-pulse"
                            />{" "}
                            <p>Loading map...</p>{" "}
                        </div>{" "}
                    </div>
                )}

                {!isOnline && (
                    <div className="absolute inset-0 bg-gray-100/80 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                <Power size={30} />
                            </div>
                            <p className="text-xl font-bold text-gray-700">
                                You are Offline
                            </p>
                            <p className="text-sm text-gray-500">
                                Go online to see the map
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {incomingRide && (
                <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center px-4">
                    <RideRequestCard
  ride={incomingRide}
  onAccept={() => {
    socketRef.current?.emit("ride:accept", {
      rideId: incomingRide.rideId,
      driverId,
    });
  }}
  onDecline={() => {
    setIncomingRide(null);
  }}
/>
                </div>
            )}

            {/* --- BOTTOM CONTROLS --- */}
            <div className="bg-white p-6 pb-10 rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.1)] z-20">
                {!isOnline ? (
                    <div className="text-center">
                        <h2 className="text-xl font-bold mb-2 text-black">
                            Ready to drive?
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Go online to start receiving ride requests nearby.
                        </p>

                        <button
                            onClick={toggleOnline}
                            disabled={isToggling}
                            className="w-full bg-blue-600 text-white p-5 rounded-xl font-bold text-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isToggling ? (
                                <>
                                    <Loader2 className="animate-spin" />{" "}
                                    Verifying...
                                </>
                            ) : (
                                "GO ONLINE"
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div className="text-left">
                                <p className="text-xs text-gray-400 font-bold uppercase">
                                    Status
                                </p>
                                <p className="text-green-600 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-bold uppercase">
                                    GPS
                                </p>
                                <p className="font-bold text-slate-800">
                                    Tracking
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={toggleOnline}
                            disabled={isToggling}
                            className="w-full bg-red-50 text-red-600 border border-red-100 p-5 rounded-full font-bold text-lg hover:bg-red-100 active:scale-[0.98] transition flex items-center justify-center gap-2"
                        >
                            <Power size={20} /> GO OFFLINE
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
