import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import type { Location, SupRequest, Restaurant } from "@shared/schema";
import { useEffect } from 'react';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

// Import marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface MapViewProps {
  userLocation: Location;
  supRequests?: SupRequest[];
  restaurants?: Restaurant[];
}

export function MapView({ userLocation, supRequests = [], restaurants = [] }: MapViewProps) {
  useEffect(() => {
    // This is needed for the default markers to work
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  // Create custom icons for different marker types
  const supIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const restaurantIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Calculate bounds to fit all markers
  const locations = [
    userLocation,
    ...supRequests.map(req => req.location),
    ...restaurants.map(rest => rest.location)
  ];

  const bounds = L.latLngBounds(
    locations.map(loc => [loc.lat, loc.lng])
  );

  return (
    <div className="h-[400px] rounded-lg overflow-hidden">
      <MapContainer
        bounds={bounds}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User's location */}
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>
            Your location
          </Popup>
        </Marker>

        {/* Sup requests */}
        {supRequests.map((request) => (
          <Marker 
            key={request.id}
            position={[request.location.lat, request.location.lng]}
            icon={supIcon}
          >
            <Popup>
              Someone wants to meet up!
              <br />
              {request.status === 'active' ? 'Active request' : 'Request accepted'}
            </Popup>
          </Marker>
        ))}

        {/* Restaurants */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.location.lat, restaurant.location.lng]}
            icon={restaurantIcon}
          >
            <Popup>
              <div className="font-semibold">{restaurant.name}</div>
              <div className="text-sm text-muted-foreground">{restaurant.description}</div>
              <div className="text-sm">Rating: {restaurant.rating}/5</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}