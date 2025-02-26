import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapView } from "@/components/map-view";
import { LocationRequest } from "@/components/location-request";
import { CountdownTimer } from "@/components/countdown-timer";
import { RestaurantCard } from "@/components/restaurant-card";
import { getCurrentLocation } from "@/lib/location";
import { Info } from "lucide-react";
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
      const response = await apiRequest(
        'GET',
        `/api/restaurants/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`
      );
      return response.json();
    }
  });

  useEffect(() => {
    connect(1); // TODO: Use actual user ID
  }, []);

  useEffect(() => {
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

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
});

const createRequest = useMutation({
    mutationFn: async (location: Location) => {
      if (!user) throw new Error("Must be logged in to send requests");
      const response = await apiRequest("POST", "/api/sup-requests", {
        senderId: user.id,
        location: { lat: Number(location.lat), lng: Number(location.lng) },
        status: "active",
        expiresAt: new Date(Date.now() + 60000).toISOString()
      });
      
      if (!response) throw new Error("Failed to create request");
      return response;
    },
    onSuccess: () => {
      setIsRequesting(true);
      queryClient.invalidateQueries({ queryKey: ["/api/sup-requests"] });
      toast({
        title: "Sup request sent!",
        description: "Push notifications sent to your friends. They'll get notified even if they're not using the app right now.",
        duration: 5000,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: error instanceof Error ? error.message : "Please try again",
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-none">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-semibold mb-2">How SupBars Works</h2>
                <p className="text-muted-foreground">
                  1. Click the "Sup!" button when you want to meet up
                  <br />
                  2. Your friends will see your request and can accept it
                  <br />
                  3. Once accepted, we'll suggest nearby bars to meet at
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Ready to meet up?
          </h1>

          <Button
            size="lg"
            className="w-32 h-32 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            onClick={handleSupClick}
            disabled={isRequesting || createRequest.isPending || isInitializingLocation}
          >
            {isInitializingLocation ? "Loading..." : "Sup!"}
          </Button>

          {isRequesting && (
            <Card className="p-4 border-primary/20">
              <CountdownTimer duration={60} onComplete={() => setIsRequesting(false)} />
              <p className="text-muted-foreground">Waiting for friends to respond...</p>
            </Card>
          )}
        </div>

        {userLocation && (
          <div className="space-y-8">
            <div className="rounded-xl overflow-hidden border shadow-lg">
              <MapView 
                userLocation={userLocation}
                supRequests={activeRequests || []}
                restaurants={nearbyRestaurants || []}
              />
            </div>

            {nearbyRestaurants && nearbyRestaurants.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Popular Bars Nearby</h2>
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