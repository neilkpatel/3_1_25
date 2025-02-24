import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Location } from "@shared/schema";
import { useEffect } from 'react';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

// Import marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface MapViewProps {
  location: Location;
}

export function MapView({ location }: MapViewProps) {
  useEffect(() => {
    // This is needed for the default markers to work
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  return (
    <div className="h-[400px] rounded-lg overflow-hidden">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[location.lat, location.lng]}>
          <Popup>
            Your location
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}