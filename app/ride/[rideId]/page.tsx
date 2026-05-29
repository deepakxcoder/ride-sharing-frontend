"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import axios from "axios";
import { Bus, Car, Motorbike } from "lucide-react";
import { RiderPaymentSuccess } from "../../components/PaymentSuccess";
import { useRouter } from "next/navigation";

import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../../components/StripeCheckout";
import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const MAP_STYLE =
    "https://api.maptiler.com/maps/hybrid-v4/style.json?key=Zu49QfQqoiCeN31QOQJC";

export default function RideTracking() {
    const { rideId } = useParams();
    const mapRef = useRef<any>(null);
    const [riderLocation, setRiderLocation] = useState<any>(null);
    const router = useRouter();
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);

    const [driverLocation, setDriverLocation] = useState<any>(null);
    const [routeGeo, setRouteGeo] = useState<any>(null);

    const [ride, setRide] = useState<any>(null);
    const [showPayment, setShowPayment] = useState(false);


    const [tripDistance, setTripDistance] = useState("0 km");
const [tripDuration, setTripDuration] = useState("0 min");
const [calculatedFare, setCalculatedFare] = useState(0);

useEffect(() => {
  if (!routeGeo || !ride) return;

  const distanceMeters = routeGeo.properties?.distance || 0; // if using OSRM, distance is in meters
  const durationSeconds = routeGeo.properties?.duration || 0; // duration in seconds

  const km = distanceMeters / 1000;
  const min = durationSeconds / 60;

  setTripDistance(`${km.toFixed(1)} km`);
  setTripDuration(`${Math.round(min)} min`);

  // PricingService logic replicated
  const PRICING = {
    BIKE: { base: 20, perKm: 8, perMin: 1 },
    CAR: { base: 40, perKm: 15, perMin: 2 },
    XL: { base: 60, perKm: 20, perMin: 3 },
  };

  const config = PRICING[ride.rideType as keyof typeof PRICING];
  const fare = config.base + km * config.perKm + min * config.perMin;

  setCalculatedFare(Math.round(fare));
}, [routeGeo, ride]);



   useEffect(() => {
  // Get rider location
  navigator.geolocation.getCurrentPosition((pos) => {
    setRiderLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    });
  });

  // Fetch ride details
  const fetchRide = async () => {
    if (!ride?._id) return; // make sure ride._id exists
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/rides/${ride._id}`);
      setRide(res.data);
    } catch (err) {
      console.error("Error fetching ride:", err);
    }
  };

  fetchRide();
}, [ride?._id]);
    //SOCKET EVENTS
    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_API_URL!);

        const riderId = localStorage.getItem("userId");

      console.log("Joining room:", `rider_${riderId}`);
        socketRef.current.emit("rider:join", {
            riderId,
        });

        // 🔹 Driver live location
        socketRef.current.on("driver:location", (data) => {
            setDriverLocation(data);
            if (mapRef.current && ride?.status !== "STARTED") {
                mapRef.current.flyTo({
                    center: [data.lng, data.lat],
                    zoom: 15,
                    duration: 1000,
                });
            }
        });

        // 🔹 Ride confirmed (OTP comes here)
        socketRef.current.on("ride:confirmed", (data) => {
            setRide(data); // contains otp
        });

        socketRef.current.on("ride:payment_success", () => {
            setShowPayment(true);
        });

        // 🔹 Ride status updates
        socketRef.current.on("ride:status", (data) => {
            setRide((prev: any) => {
                const updated = { ...prev, status: data.status };

                if (
                    data.status === "ACCEPTED" &&
                    driverLocation &&
                    mapRef.current
                ) {
                    mapRef.current.flyTo({
                        center: [driverLocation.lng, driverLocation.lat],
                        zoom: 16,
                        duration: 1500,
                    });
                }

                return updated;
            });
        });

        socketRef.current.on("ride:awaiting_payment", async (ride) => {
          console.log("🔥 awaiting_payment received", ride);
  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent/${ride._id}`);
  setClientSecret(res.data.clientSecret);
});

        return () => {
            socketRef.current?.disconnect();
        };
    }, [rideId]);

    useEffect(() => {
        if (!ride || !driverLocation) return;

        const target =
            ride.status === "STARTED"
                ? { lat: ride.dropLat, lng: ride.dropLng }
                : { lat: ride.pickupLat, lng: ride.pickupLng };

        const fetchRoute = async () => {
            const url = `https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.routes?.length) {
                setRouteGeo(data.routes[0].geometry);
            }
        };

        fetchRoute();
    }, [ride?.status, driverLocation]);

    useEffect(() => {
        const fetchRide = async () => {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}`,
            );
            setRide(res.data);
        };

        if (rideId) fetchRide();
    }, [rideId]);

    return (
        <div className="h-screen w-full relative">
            <Map
                ref={mapRef}
                mapLib={maplibregl}
                initialViewState={{
                    latitude: 28.6139,
                    longitude: 77.209,
                    zoom: 14,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle={MAP_STYLE}
            >
                {/* Pickup */}
                {ride && ride.status !== "STARTED" && (
                    <Marker
                        latitude={ride.pickupLat}
                        longitude={ride.pickupLng}
                        color="green"
                    />
                )}

                {/* Drop */}
                {ride && (
                    <Marker
                        latitude={ride.dropLat}
                        longitude={ride.dropLng}
                        color="red"
                    />
                )}

                {/* Rider current location */}

                {driverLocation && ride && (
                    <Marker
                        latitude={driverLocation.lat}
                        longitude={driverLocation.lng}
                        anchor="center"
                    >
                        <div style={{ fontSize: "36px", color: "red" }}>
                            {ride.rideType === "BIKE" && <Motorbike />}
                            {ride.rideType === "CAR" && <Car />}
                            {ride.rideType === "AUTO" && <Bus />}
                        </div>
                    </Marker>
                )}

                {routeGeo && (
                    <Source
                        id="route"
                        type="geojson"
                        data={{
                            type: "Feature",
                            geometry: routeGeo,
                        }as any}
                    >
                        <Layer
                            id="route-line"
                            type="line"
                            paint={{
                                "line-color": "#000",
                                "line-width": 5,
                            }}
                        />
                    </Source>
                )}
            </Map>

            <div className="absolute text-gray-900 bottom-0 left-0 right-0 bg-white p-6 shadow-lg rounded-t-2xl space-y-3">
                <h2 className="text-xl font-bold">Driver is on the way 🚗</h2>

                <p className="text-gray-500">Ride ID: {rideId}</p>

                {/* 🔥 OTP SECTION */}
                {ride?.status === "ACCEPTED" && (
                    <div className="bg-yellow-100 p-4 rounded-xl text-center">
                        <p className="text-lg text-gray-900 font-bold">
                            Your OTP
                        </p>

                        <p className="text-3xl tracking-widest font-bold">
                            {ride.otp}
                        </p>

                        <p className="text-sm text-gray-600 mt-2">
                            Share this with driver after arrival
                        </p>
                    </div>
                )}

                {/* Optional: Hide OTP once ride starts */}
                {ride?.status === "STARTED" && (
                    <div className="bg-green-100 text-gray-950 p-3 rounded-xl text-center">
                        Ride has started 🚀
                    </div>
                )}
                {clientSecret && (
                    <div className="bg-white p-4 rounded-2xl shadow-xl">
                        <h3 className="text-lg font-bold mb-3">
                            Complete Payment
                        </h3>

                        <Elements
                            stripe={stripePromise}
                            options={{ clientSecret }}
                        >
                           <CheckoutForm
  onSuccess={() => setShowPayment(true)}
  amount={calculatedFare} // dynamically calculated
  driverName={ride.driverId?.name || "Driver"}
  tripDistance={tripDistance}
  tripDuration={tripDuration}
  pickupAddress={ride.pickupAddress}
  dropAddress={ride.dropoffAddress}
/>
                        </Elements>
                    </div>
                )}

                {showPayment && (
                    <RiderPaymentSuccess
                        amount={ride.fare}
                       
                        paymentMethod="UPI · GPay"
                        transactionId={ride.txnId}
                        onDone={() => {
                            setShowPayment(false);
                            router.push("/dashboard");
                        }}
                    />
                )}
            </div>
        </div>
    );
}
