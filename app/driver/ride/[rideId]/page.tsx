"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Phone, Navigation, CheckCircle, Bike, Car, Bus, Motorbike } from "lucide-react";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import SlideToComplete from "../../../components/SlideToComplete";
import {DriverPaymentSuccess} from "../../../components/PaymentSuccess"



export default function DriverRidePage() {
  const { rideId } = useParams();
  const router = useRouter();
  const [showEarningModal, setShowEarningModal] = useState(false);
  const getDistance = (lat1:number, lng1:number, lat2:number, lng2:number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};



  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<any>(null);


  const [ride, setRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [routeGeo, setRouteGeo] = useState<any>(null);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "ONLINE">("CASH");
  const[paymentSucceeded, setPaymentSucceeded] = useState(false);

  const distance =
  driverLocation && ride
    ? getDistance(
        driverLocation.lat,
        driverLocation.lng,
        ride.pickupLat,
        ride.pickupLng
      )
    : null;

const canStartRide =
  ride?.status === "ARRIVED" &&
  distance !== null &&
  distance < 50;

  

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;

  /* =====================================================
     1️⃣ FETCH RIDE
  ===================================================== */
  useEffect(() => {
    const fetchRide = async () => {
      const res = await axios.get(`${API_BASE}/rides/${rideId}`);
      setRide(res.data);
    };

    if (rideId) fetchRide();
  }, [rideId]);

  useEffect(() => {
  socketRef.current?.on("ride:payment_success", (ride) => {
    setShowEarningModal(true);
    setPaymentSucceeded(true);
  });
}, []);

  useEffect(() => {
  if (!ride) return;

  setDriverLocation({
    lat: ride.pickupLat - 0.01,
    lng: ride.pickupLng - 0.01,
  });
}, [ride]);

  /* =====================================================
     3️⃣ SOCKET SETUP
  ===================================================== */
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
  const driverId = localStorage.getItem("driverId");

  if (driverId) {
    socketRef.current?.emit("driver:join", { driverId });
  }

  socketRef.current?.emit("ride:join", { rideId });
});

    socketRef.current.on("ride:status", (data) => {
  setRide((prev: any) => ({
    ...prev,
    status: data.status,
  }));
});


    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  //ROUTING EFFECT
  useEffect(() => {
  if (!ride || !driverLocation) return;

  const isStarted = ride.status === "STARTED";

  const targetLat = isStarted ? ride.dropLat : ride.pickupLat;
  const targetLng = isStarted ? ride.dropLng : ride.pickupLng;

  const fetchRoute = async () => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${targetLng},${targetLat}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.length) {
        setRouteGeo(data.routes[0].geometry);
      }
    } catch (e) {
      console.error("Routing failed", e);
    }
  };

  fetchRoute();
}, [ride?.status, driverLocation]);

//   /* =====================================================
//      4️⃣ DRIVER LIVE GPS
//   ===================================================== */
//   useEffect(() => {
//     const watchId = navigator.geolocation.watchPosition(
//       (pos) => {
//         const coords = {
//           lat: pos.coords.latitude,
//           lng: pos.coords.longitude,
//         };

//         setDriverLocation(coords);

//         socketRef.current?.emit("driver:location", {
//           userId: localStorage.getItem("userId"),
//           lat: coords.lat,
//           lng: coords.lng,
//         });

//         if (mapRef.current) {
//   mapRef.current.flyTo({
//     center: [coords.lng, coords.lat],
//     zoom: 15,
//     duration: 1000,
//   });
// }


//       },
//       (err) => console.error(err),
//       { enableHighAccuracy: true }
//     );

//     return () => navigator.geolocation.clearWatch(watchId);
//   }, []);

 
  /* =====================================================
     6️⃣ ROUTE USING OSRM (NO API KEY)
  ===================================================== */
  // useEffect(() => {
  //   if (!ride || !driverLocation) return;

  //   const fetchRoute = async () => {
  //     const target =
  //       ride.status === "STARTED"
  //         ? { lat: ride.dropLat, lng: ride.dropLng }
  //         : { lat: ride.pickupLat, lng: ride.pickupLng };

  //     const url = `https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`;

  //     try {
  //       const res = await fetch(url);
  //       const data = await res.json();

  //       const geometry = data.routes[0].geometry;
  //       setRouteGeo(geometry);
  //     } catch (e) {
  //       console.error("Routing failed", e);
  //     }
  //   };

  //   fetchRoute();
  // }, [ride, driverLocation]);

  /* =====================================================
     ACTIONS
  ===================================================== */

 
   const startRide = async () => {
  const enteredOtp = prompt("Enter OTP from rider");
  if (!enteredOtp) return;

  socketRef.current?.emit("ride:start", {
    rideId,   
    otp: enteredOtp,
  });
  };

  const dropDistance =
  driverLocation && ride
    ? getDistance(
        driverLocation.lat,
        driverLocation.lng,
        ride.dropLat,
        ride.dropLng
      )
    : null;

const canCompleteRide =
  ride?.status === "STARTED" &&
  dropDistance !== null &&
  dropDistance < 200; // 200 meters like Uber

  const completeRide = async () => {
    await axios.patch(`${API_BASE}/rides/${rideId}/complete`);
    router.push("/driver/dashboard");
  };

  

  

 if (!ride) return <div>Loading...</div>;

return (
  <div style={{ height: "100vh", width: "100vw" }}>
    <Map
      initialViewState={{
        latitude: ride.pickupLat,
        longitude: ride.pickupLng,
        zoom: 15,
      }}
     ref={mapRef}
      style={{ width: "100%", height: "70vh" }}
      mapStyle="https://api.maptiler.com/maps/hybrid-v4/style.json?key=Zu49QfQqoiCeN31QOQJC"
    >
      {/* Pickup Marker */}
      {ride.status !== "STARTED" && (
  <Marker
    longitude={ride.pickupLng}
    latitude={ride.pickupLat}
    color="green"
  />
)}

      {/* Drop Marker */}
      <Marker
        longitude={ride.dropLng}
        latitude={ride.dropLat}
        color="red"
      />

      {/* Driver Marker */}
      {driverLocation && (
        <Marker
  longitude={driverLocation.lng}
  latitude={driverLocation.lat}
  anchor="bottom"
  draggable
  onDragEnd={(e) => {
    const { lng, lat } = e.lngLat;

    setDriverLocation({ lat, lng });

    socketRef.current?.emit("driver:location", {
      userId: localStorage.getItem("userId"),
      lat,
      lng,
    });

    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 500,
    });
  }}
> <div style={{ fontSize: "38px", color:"red" }}>
      {ride.rideType === "BIKE" && <Motorbike  / >}
      {ride.rideType === "CAR" && <Car/>}
      {ride.rideType === "AUTO" && <Bus/>}
    </div> </Marker>
      )}

      {/* Route Line */}
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

    {/* BOTTOM PANEL */}
    <div className="p-4 bg-white shadow-lg space-y-3">
      <div className="text-gray-900">
        <h2 className="font-bold text-lg">Ride #{ride._id}</h2>
        <p>Pickup: {ride.pickupAddress}</p>
        <p>Destination: {ride.dropoffAddress}</p>
        <p>Status: {ride.status}</p>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 bg-blue-500 text-white p-3 rounded-xl flex items-center justify-center gap-2">
          <Phone size={18} />
          Call Rider
        </button>

       { /* ARRIVED BUTTON */}
{ride.status === "ACCEPTED" && (
  <button
    onClick={async () => {
      const driverId = localStorage.getItem("driverId");
      console.log(driverId);

     socketRef.current?.emit("ride:arrived", {
  rideId,
  driverId,
});
    }}
    className="flex-1 bg-yellow-500 text-white p-3 rounded-xl"
  >
    Arrived
  </button>
)}

{/* START RIDE BUTTON */}
{ride.status === "ARRIVED" && (
  <button
    onClick={startRide}
    className={`flex-1 p-3 rounded-xl bg-green-500 text-white`}
  >
    Start Ride
  </button>
)}
      </div>
    </div>


    {ride.status === "STARTED" && (
  <div className="p-4 bg-white text-gray-950 space-y-3">
    <p className="font-semibold">Payment Mode</p>

    <div className="flex gap-3">
      <button
        onClick={() => setPaymentMode("CASH")}
        className={`flex-1 p-2 rounded-xl ${
          paymentMode === "CASH"
            ? "bg-black text-white"
            : "bg-gray-200"
        }`}
      >
        Cash
      </button>

      <button
        onClick={() => setPaymentMode("ONLINE")}
        className={`flex-1 p-2 rounded-xl ${
          paymentMode === "ONLINE"
            ? "bg-black text-white"
            : "bg-gray-200"
        }`}
      >
        Online
      </button>
    </div>
  </div>
)}
  
   {/* COMPLETE RIDE SLIDER */}
{ride.status === "STARTED" && (
  <SlideToComplete
    canCompleteRide={canCompleteRide}
    onComplete={() => {
      socketRef.current?.emit("ride:complete", {
  rideId,
  paymentMode,
});
    }}
  />
)}

{showEarningModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-3xl w-80 shadow-xl">

      <h2 className="text-xl font-bold text-center">
        Ride Completed 🎉
      </h2>

      <div className="flex gap-3 mt-5">
        <button
          onClick={() => router.push("dashboard/driver")}
          className="flex-1 bg-green-500 text-white p-2 rounded-xl"
        >
          Go Online
        </button>
      </div>
    </div>
  </div>
)}

{ paymentSucceeded && (
  <DriverPaymentSuccess
    earned={ride.driverEarnings}
    riderName={ride.rider.name}
    platformFee={ride.platformFee}
    onDone={() => setPaymentSucceeded(false)}
  />
)}

</div>

 

);
}