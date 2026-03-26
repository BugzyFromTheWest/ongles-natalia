"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_HUE: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

function numberedIcon(n: number, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};color:white;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

type Appt = {
  id: string;
  customer_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: string;
  scheduled_time: string | null;
  service_requested?: string;
};

export default function AppointmentMap({ appointments }: { appointments: Appt[] }) {
  const valid = appointments.filter((a) => a.lat && a.lng);

  if (valid.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        No geocoded appointments to display
      </div>
    );
  }

  const center: [number, number] = [
    valid.reduce((s, a) => s + a.lat!, 0) / valid.length,
    valid.reduce((s, a) => s + a.lng!, 0) / valid.length,
  ];

  const routePoints: [number, number][] = valid.map((a) => [a.lat!, a.lng!]);

  function fmtTime(t: string) {
    return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={routePoints} color="#3b82f6" weight={2} dashArray="6 4" opacity={0.6} />
      {valid.map((a, i) => (
        <Marker
          key={a.id}
          position={[a.lat!, a.lng!]}
          icon={numberedIcon(i + 1, STATUS_HUE[a.status] ?? "#6b7280")}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-semibold text-slate-900 mb-0.5">{a.customer_name}</p>
              {a.scheduled_time && (
                <p className="text-slate-500 text-xs mb-1">{fmtTime(a.scheduled_time)}</p>
              )}
              {a.service_requested && (
                <p className="text-slate-600 text-xs mb-1">{a.service_requested}</p>
              )}
              <p className="text-slate-400 text-xs">{a.address}</p>
              <a
                href={`/admin/appointments/${a.id}`}
                className="text-blue-600 text-xs mt-2 inline-block hover:underline"
              >
                View details →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
