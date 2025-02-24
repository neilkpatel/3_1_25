import type { Location } from "@shared/schema";

interface MapViewProps {
  location: Location;
}

export function MapView({ location }: MapViewProps) {
  return (
    <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-muted-foreground">
          Map view at {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </p>
      </div>
    </div>
  );
}
