import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapView } from "@/components/map-view";
import { LocationRequest } from "@/components/location-request";
import { CountdownTimer } from "@/components/countdown-timer";
import { RestaurantCard } from "@/components/restaurant-card";
import { getCurrentLocation } from "@/lib/location";
import type { SupRequest, Restaurant, Location } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { connect } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);
  const [userLocation, setUserLocation] = useState<Location>();
  const [isInitializingLocation, setIsInitializingLocation] = useState(true);

  const { data: activeRequests } = useQuery<SupRequest[]>({
    queryKey: ["/api/sup-requests"],
  });

  const { data: nearbyRestaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants/nearby'],
    enabled: !!userLocation,
    queryFn: async () => {
      if (!userLocation) return [];
      console.log('Fetching nearby restaurants for location:', userLocation);
      const response = await apiRequest(
        'GET',
        `/api/restaurants/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`
      );
      const data = await response.json();
      console.log('Received restaurants:', data);
      return data;
    }
  });

  useEffect(() => {
    // Initialize web socket connection immediately
    connect(1); // TODO: Use actual user ID
  }, []);

  useEffect(() => {
    // Initialize location separately
    const initializeLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Location error:', error);
        toast({
          variant: "destructive",
          title: "Location Access Required",
          description: "Please enable location access in your browser to use all features.",
        });
      } finally {
        setIsInitializingLocation(false);
      }
    };

    initializeLocation();
  }, [toast]);

  const createRequest = useMutation({
    mutationFn: async (location: Location) => {
      return apiRequest("POST", "/api/sup-requests", {
        senderId: 1, // TODO: Use actual user ID
        location,
        status: "active",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });
    },
    onSuccess: () => {
      setIsRequesting(true);
      queryClient.invalidateQueries({ queryKey: ["/api/sup-requests"] });
      toast({
        title: "Sup request sent!",
        description: "Waiting for friends to respond...",
      });
    },
  });

  const handleSupClick = async () => {
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location access to send a Sup request.",
      });
      return;
    }

    try {
      await createRequest.mutate(userLocation);
    } catch (error) {
      console.error('Request error:', error);
      toast({
        variant: "destructive",
        title: "Request Error",
        description: error instanceof Error ? error.message : "Could not send your request.",
      });
    }
  };

  useEffect(() => {
    console.log('Active requests:', activeRequests);
    console.log('Nearby restaurants:', nearbyRestaurants);
  }, [activeRequests, nearbyRestaurants]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Ready to meet up?
          </h1>

          <Button
            size="lg"
            className="w-32 h-32 rounded-full text-2xl font-bold"
            onClick={handleSupClick}
            disabled={isRequesting || createRequest.isPending || isInitializingLocation}
          >
            {isInitializingLocation ? "Loading..." : "Sup!"}
          </Button>

          {isRequesting && (
            <Card className="p-4">
              <CountdownTimer duration={60} onComplete={() => setIsRequesting(false)} />
              <p className="text-muted-foreground">Waiting for friends to respond...</p>
            </Card>
          )}
        </div>

        {userLocation && (
          <div className="space-y-4">
            <MapView 
              userLocation={userLocation}
              supRequests={activeRequests || []}
              restaurants={nearbyRestaurants || []}
            />

            {nearbyRestaurants && nearbyRestaurants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nearbyRestaurants.map(restaurant => (
                  <RestaurantCard
                    key={restaurant.id}
                    name={restaurant.name}
                    description={restaurant.description}
                    image={restaurant.image}
                    rating={restaurant.rating}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeRequests?.map((request) => (
          <LocationRequest key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}