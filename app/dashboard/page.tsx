"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

import {
    MapPin,
    Car,
    Clock,
    Settings,
    LogOut,
    Search,
    Loader2,
    ArrowLeft,
    Bike,
    Bus,
    CarFront,
} from "lucide-react";
// app/layout.tsx or globals.css

import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import axios from "axios";

const MAP_STYLE =
    "https://api.maptiler.com/maps/hybrid-v4/style.json?key=Zu49QfQqoiCeN31QOQJC";

const mapContainerStyle = { width: "100%", height: "100%" };
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    clickableIcons: false,
};

// --- TYPES ---
type RideState = "IDLE" | "SELECTING" | "PRICES" | "SEARCHING";

// --- CAR ICON ---
const CAR_ICON_PATH =
    "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.049l-1.497-4.191 h2.565L20.625,10.049z M4.37,5.858h14.305c0.549,0,1.053,0.139,1.497,0.374l1.528,4.282H1.345l1.527-4.282 C3.317,5.997,3.821,5.858,4.37,5.858z M1.914,21.398L1.914,21.398l-0.928-0.351V14.18l2.728,7.219H1.914z M3.713,22.846v3.666H2.031 v-3.666H3.713z M19.33,22.846v3.666h-1.682v-3.666H19.33z";

export default function Dashboard() {
    const mapRef = useRef<any>(null);
    const router = useRouter();
    const [rideOptions, setRideOptions] = useState<any[]>([]);

    // --- STATE MACHINE ---
    const [rideState, setRideState] = useState<RideState>("IDLE");

    // --- DATA ---
    const [userId, setUserId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);

    // ---  Collection of pickup and drop data  ---

    const [pickupQuery, setPickupQuery] = useState("");
    const [dropQuery, setDropQuery] = useState("");

    const [pickupResults, setPickupResults] = useState<any[]>([]);
    const [dropResults, setDropResults] = useState<any[]>([]);

    const [pickupLocation, setPickupLocation] = useState<{
        lat: number;
        lng: number;
        address: string;
    } | null>(null);

    const [dropLocation, setDropLocation] = useState<{
        lat: number;
        lng: number;
        address: string;
    } | null>(null);

    const socketRef = useRef<Socket | null>(null);

    const [distanceKm, setDistanceKm] = useState(0);
    const [durationMin, setDurationMin] = useState(0);
    const [routeGeo, setRouteGeo] = useState<any>(null);
    const [activeRide, setActiveRide] = useState<any>(null);

    const snapToRoad = async (lat: number, lng: number) => {
        const res = await fetch(
            `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`,
        );

        const data = await res.json();
        return data.waypoints[0].location; // [lng, lat]
    };

    // 2. Initialization & Socket
    useEffect(() => {
        const id = localStorage.getItem("userId");
        if (!id) router.push("/");
        setUserId(id);

        // GPS
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            });
        }

        // Socket
        socketRef.current = io("http://localhost:3000");

        // Initial Fetch
        setTimeout(() => {
            socketRef.current?.emit("get:nearbyDrivers");
        }, 500);
        socketRef.current.on("nearbyDrivers", (drivers) =>
            setNearbyDrivers(drivers),
        );

        // Live Updates
        socketRef.current.on("driver:moved", (data) => updateDriverOnMap(data));

        socketRef.current.emit("rider:join", { riderId: id });

        socketRef.current.on("ride:confirmed", (data) => {
            console.log("Ride confirmed:", data);

            setActiveRide(data);

            // Move to ride tracking screen
            router.push(`/ride/${data.rideId}`);
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // 3 for Autocomplete of search results
    useEffect(() => {
        const timer = setTimeout(() => {
            searchPhoton(pickupQuery, setPickupResults);
        }, 400);

        return () => clearTimeout(timer);
    }, [pickupQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchPhoton(dropQuery, setDropResults);
        }, 400);

        return () => clearTimeout(timer);
    }, [dropQuery]);

    //Update driver on map...
    const updateDriverOnMap = (data: {
        driverId: string;
        lat: number;
        lng: number;
    }) => {
        setNearbyDrivers((prev) => {
            const exists = prev.find((d) => d.driverId === data.driverId);
            if (exists) {
                return prev.map((d) =>
                    d.driverId === data.driverId
                        ? { ...d, lat: data.lat, lng: data.lng }
                        : d,
                );
            } else {
                return [
                    ...prev,
                    { driverId: data.driverId, lat: data.lat, lng: data.lng },
                ];
            }
        });
    };

    const handleLogout = () => {
        localStorage.removeItem("userId");
        router.push("/");
    };

    const searchPhoton = async (query: string, setter: Function) => {
        if (!query || query.length < 3) {
            setter([]);
            return;
        }

        const res = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
        );

        const data = await res.json();
        setter(data.features || []);
    };

    const handleSearchRoute = async () => {
        if (!pickupLocation || !dropLocation) return;
        console.log("Sending:", {
            pickup: pickupLocation,
            dropoff: dropLocation,
        });

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/rides/estimate`,
                {
                    pickup: pickupLocation,
                    dropoff: dropLocation,
                },
            );

            console.log(res.data);

            setDistanceKm(res.data.distanceKm);
            setDurationMin(res.data.durationMin);

            setRideOptions(res.data.options);
            setRouteGeo(res.data.geometry);

            setRideState("PRICES");
        } catch (err) {
            console.error(err);
        }
    };

    // const animateMarker = (
    //   coords: number[][],
    //   setPos: Function
    // ) => {
    //   let i = 0;

    //   const move = () => {
    //     if (i >= coords.length) return;

    //     const [lng, lat] = coords[i];
    //     setPos({ lat, lng });
    //     i++;

    //     requestAnimationFrame(move);
    //   };

    //   move();
    // };
    const requestRide = (rideType: string) => {
        if (!pickupLocation || !dropLocation || !socketRef.current || !userId)
            return;
        if (rideState === "SEARCHING") return; // prevent double

        setRideState("SEARCHING");
        console.log(pickupLocation, dropLocation);

        socketRef.current.emit("ride:request", {
            riderId: userId,
            pickup: pickupLocation,
            dropoff: dropLocation,
            rideType,
        });
        console.log(pickupLocation, dropLocation);
    };

    if (!userId)
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
            {/* --- DYNAMIC SIDEBAR --- */}
            <aside className="w-[380px] bg-white border-r border-gray-700 flex flex-col shadow-2xl z-20 relative transition-all">
                {/* Header */}
                <div className="px-6 py-5 flex justify-between items-center z-10">
                    <h2 className="text-xl text-gray-900 font-extrabold tracking-tight">
                        Uber Web
                    </h2>
                </div>

                {/* --- PHASE 1: IDLE --- */}
                {rideState === "IDLE" && (
                    <div className="flex-1 flex flex-col px-6 animate-in slide-in-from-left duration-300">
                        <nav className="space-y-1 mb-8">
                            <div className="flex items-center gap-3 px-4 py-3 bg-black text-white rounded-lg cursor-pointer">
                                <Car size={18} />
                                <span className="text-sm font-semibold">
                                    Ride
                                </span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                                <Clock size={18} />
                                <span className="text-sm font-medium">
                                    Activity
                                </span>
                            </div>
                        </nav>
                        <h1 className="text-4xl  text-gray-900 font-bold mb-6">
                            Go anywhere with Uber
                        </h1>
                        <div
                            onClick={() => setRideState("SELECTING")}
                            className="bg-gray-100 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-gray-200 transition"
                        >
                            <Search size={24} className="text-black" />
                            <span className="text-lg font-medium text-gray-700">
                                Where to?
                            </span>
                        </div>
                    </div>
                )}

                {/* --- PHASE 2: SELECTING LOCATIONS --- */}
                {rideState === "SELECTING" && (
                    <div className="flex-1 flex flex-col px-6 animate-in slide-in-from-left duration-300">
                        <button
                            onClick={() => setRideState("IDLE")}
                            className="mb-4 p-2 -ml-2 w-fit bg-gray-900 rounded-full"
                        >
                            <ArrowLeft />
                        </button>
                        <h3 className="text-2xl  text-gray-900 font-bold mb-6">
                            Get a ride
                        </h3>

                        <div className="space-y-4 relative">
                            <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-gray-300 z-0"></div>

                            {/* Pickup */}
                            <div className="relative z-10">
                                <div className="absolute left-4 top-4 w-2.5 h-2.5 bg-black rounded-full pointer-events-none"></div>

                                <input
                                    value={pickupQuery}
                                    onChange={(e) =>
                                        setPickupQuery(e.target.value)
                                    }
                                    className="w-full bg-gray-600 p-3 pl-10 rounded-lg font-medium outline-none"
                                    placeholder="Pickup location"
                                    disabled={rideState !== "SELECTING"}
                                />

                                {pickupResults.length > 0 && (
                                    <div className="bg-gray-600 border rounded-lg shadow mt-1 max-h-48 overflow-auto">
                                        {pickupResults.map((place) => (
                                            <div
                                                key={place.properties.osm_id}
                                                onClick={() => {
                                                    const [lng, lat] =
                                                        place.geometry
                                                            .coordinates;
                                                    const loc = { lat, lng };
                                                    const formattedAddress = `${place.properties.name}, ${
                                                        place.properties.city ||
                                                        place.properties
                                                            .country ||
                                                        ""
                                                    }`;

                                                    setPickupLocation({
                                                        lat,
                                                        lng,
                                                        address:
                                                            formattedAddress,
                                                    });

                                                    setPickupQuery(
                                                        formattedAddress,
                                                    );

                                                    setPickupResults([]);
                                                    mapRef.current.flyTo({
                                                        center: [lng, lat],
                                                        zoom: 16,
                                                        duration: 800,
                                                    });
                                                }}
                                                className="px-4 py-2 hover:bg-gray-900 cursor-pointer text-sm"
                                            >
                                                {place.properties.name},{" "}
                                                {place.properties.city ||
                                                    place.properties.country}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Dropoff */}
                            <div className="relative z-10">
                                <div className="absolute left-4 top-4 w-2.5 h-2.5 bg-black rounded-none pointer-events-none"></div>

                                <input
                                    value={dropQuery}
                                    onChange={(e) =>
                                        setDropQuery(e.target.value)
                                    }
                                    className="w-full bg-gray-600 p-3 pl-10 rounded-lg font-medium outline-none"
                                    placeholder="Enter destination"
                                    disabled={rideState !== "SELECTING"}
                                />

                                {dropResults.length > 0 && (
                                    <div className="bg-gray-600 border rounded-lg shadow mt-1 max-h-48 overflow-auto">
                                        {dropResults.map((place) => (
                                            <div
                                                key={place.properties.osm_id}
                                                onClick={() => {
                                                    const [lng, lat] =
                                                        place.geometry
                                                            .coordinates;
                                                    const formattedAddress = `${place.properties.name}, ${
                                                        place.properties.city ||
                                                        place.properties
                                                            .country ||
                                                        ""
                                                    }`;

                                                    setDropLocation({
                                                        lat,
                                                        lng,
                                                        address:
                                                            formattedAddress,
                                                    });

                                                    setDropQuery(
                                                        formattedAddress,
                                                    );
                                                    setDropQuery(
                                                        place.properties.name,
                                                    );
                                                    setDropResults([]);
                                                    if (
                                                        pickupLocation &&
                                                        mapRef.current
                                                    ) {
                                                        mapRef.current.fitBounds(
                                                            [
                                                                [
                                                                    pickupLocation.lng,
                                                                    pickupLocation.lat,
                                                                ],
                                                                [lng, lat],
                                                            ],
                                                            {
                                                                padding: 120,
                                                                duration: 800,
                                                            },
                                                        );
                                                    }
                                                }}
                                                className="px-4 py-2 hover:bg-gray-900 cursor-pointer text-sm"
                                            >
                                                {place.properties.name},{" "}
                                                {place.properties.city ||
                                                    place.properties.country}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                handleSearchRoute();
                            }}
                            className="mt-6 w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-lg"
                        >
                            Search Routes
                        </button>
                    </div>
                )}

                {/* --- PHASE 3: PRICES --- */}
                {rideState === "PRICES" && (
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        <h3 className="text-xl text-gray-900 font-bold mb-2">
                            Choose a ride
                        </h3>
                        <button
                            onClick={() => setRideState("SELECTING")}
                            title="Want to Choose Destination Again"
                            className="mb-4 p-2 -ml-2 w-fit bg-gray-900 rounded-full"
                        >
                            <ArrowLeft />
                        </button>
                        <p className="text-sm text-black shadow-amber-100 mb-4">
                            Distance : {distanceKm} km <br /> Time to Reach :{" "}
                            {durationMin} min
                        </p>

                        <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
                            {/* Map over your rides here */}
                            {rideOptions.map((ride) => (
                                <div
                                    key={ride.type}
                                    onClick={() => requestRide(ride.type)}
                                    // 1. Added 'group' to manage child hover states
                                    // 2. Added transform transition for smooth scaling
                                    className="group relative flex items-center text-black justify-between p-5 rounded-2xl border border-gray-200 bg-white cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500 hover:-translate-y-1 active:scale-95"
                                >
                                    {/* Decorative gradient background on hover (Optional) */}
                                    <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                    <div className="flex items-center gap-4 relative z-10">
                                        {/* Icon Container with Color Transition */}
                                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors duration-300 text-gray-700 group-hover:text-blue-600">
                                            {ride.type === "BIKE" ? (
                                                <Bike size={28} />
                                            ) : ride.type === "CAB" ? (
                                                <CarFront size={28} />
                                            ) : (
                                                <Bus size={28} />
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-lg group-hover:text-blue-700 transition-colors">
                                                {ride.name}
                                                <span className="ml-2 font-normal text-gray-500 text-xs bg-gray-100 px-1.5 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-700">
                                                    {ride.type === "BIKE"
                                                        ? 1
                                                        : ride.type === "CAB"
                                                          ? 4
                                                          : 6}
                                                </span>
                                            </h4>
                                            <p className="text-xs text-gray-500 font-medium group-hover:text-gray-800 transition-colors">
                                                Affordable • {ride.eta} min away
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex items-center gap-3">
                                        <div className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                            ₹{ride.price}
                                        </div>
                                        {/* Chevron arrow that appears on hover */}
                                        <div className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-gray-400 group-hover:text-blue-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="m9 18 6-6-6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- PHASE 4: SEARCHING --- */}
                {rideState === "SEARCHING" && (
                    <div className="flex-1 flex flex-col bg-gray-400 items-center justify-center text-center p-8 animate-in fade-in">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                            Connecting...
                        </h2>
                        <p className="text-gray-500">
                            Finding the best driver for you.
                        </p>

                        <button
                            onClick={() => setRideState("PRICES")}
                            className="mt-8 text-slate-800 font-bold bg-gray-500 px-6 py-2 rounded-full transition"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </aside>

            {/* --- MAP AREA --- */}
            <main className="flex-1 relative bg-gray-200">
                {!userLocation ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                        <MapPin size={52} className="mb-4 animate-bounce" />
                        <h1 className="text-2xl font-bold">Locating you...</h1>
                    </div>
                ) : (
                    <Map
                        ref={mapRef}
                        mapLib={maplibregl}
                        initialViewState={{
                            latitude: userLocation.lat,
                            longitude: userLocation.lng,
                            zoom: 15,
                        }}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle={MAP_STYLE}
                    >
                        {/* USER MARKER */}
                        {pickupLocation ? (
                            <Marker
                                latitude={pickupLocation.lat}
                                longitude={pickupLocation.lng}
                                draggable={rideState === "SELECTING"}
                                onDrag={(e) => {
                                    if (rideState !== "SELECTING") return;
                                    const lat = e.lngLat?.lat;
                                    const lng = e.lngLat?.lng;
                                    setPickupLocation({ lat, lng } as any);
                                }}
                                anchor="center"
                            >
                                <img
                                    src="/markers/pickup.svg"
                                    alt="Pickup"
                                    className="w-8 h-8"
                                />
                            </Marker>
                        ) : (
                            <Marker
                                latitude={userLocation.lat}
                                longitude={userLocation.lng}
                                anchor="center"
                            >
                                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-md" />
                            </Marker>
                        )}
                        {/* DRIVER MARKERS */}
                        {nearbyDrivers.map((driver) => (
                            <Marker
                                key={driver.driverId}
                                latitude={driver.lat}
                                longitude={driver.lng}
                                anchor="center"
                            >
                                <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-amber-100" />
                            </Marker>
                        ))}
                        {routeGeo && (
                            <Source
                                id="route"
                                type="geojson"
                                data={{
                                    type: "Feature",
                                    geometry: routeGeo,
                                } as any}
                            >
                                <Layer
                                    id="route-line"
                                    type="line"
                                    paint={{
                                        "line-color": "#000",
                                        "line-width": 4,
                                    }}
                                />
                            </Source>
                        )}

                        {dropLocation && (
                            <Marker
                                latitude={dropLocation.lat}
                                longitude={dropLocation.lng}
                            >
                                <img
                                    src="/markers/drop.svg"
                                    alt="Drop"
                                    className="w-8 h-8"
                                />
                            </Marker>
                        )}
                    </Map>
                )}
            </main>
        </div>
    );
}
