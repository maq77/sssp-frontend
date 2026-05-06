import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 🛠 Fix for default Leaflet marker icons in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// إعداد أيقونات Leaflet بشكل صحيح
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Incident {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

interface LeafletMapProps {
  incidents: Incident[];
  center?: [number, number];
  zoom?: number;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  incidents,
  center = [30.0444, 31.2357],
  zoom = 12,
}) => {
  return (
    // ✅ مهم جدًا: ارتفاع محدد للحاوية
    <div className="w-full h-[500px]">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url={
            import.meta.env.VITE_MAP_URL ||
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {incidents.map((inc) => (
          <Marker key={inc.id} position={[inc.lat, inc.lng]}>
            <Popup>{inc.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
