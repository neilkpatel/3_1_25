import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapView } from "@/components/map-view";
import { LocationRequest } from "@/components/location-request";
import { CountdownTimer } from "@/components/countdown-timer";
import { RestaurantCard } from "@/components/restaurant-card";
import { getCurrentLocation } from "@/lib/location";
import type { SupRequest, Location } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { connect } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);
  const [userLocation, setUserLocation] = useState<Location>();

  const { data: activeRequests } = useQuery<SupRequest[]>({
    queryKey: ["/api/sup-requests"],
  });

  useEffect(() => {
    // Initialize location first, then connect to WebSocket
    const initializeServices = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        // Connect to notification service with hardcoded user ID
        connect(1); // TODO: Use actual user ID
      } catch (error) {
        console.error('Initialization error:', error);
        toast({
          variant: "destructive",
          title: "Setup Error",
          description: error instanceof Error ? error.message : "Could not initialize required services.",
        });
      }
    };

    initializeServices();
  }, []); // Empty dependency array - run once when component mounts

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
        title: "Location Error",
        description: "Please allow location access to continue.",
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
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Ready to meet up?
          </h1>

          <Button
            size="lg"
            className="w-32 h-32 rounded-full text-2xl font-bold"
            onClick={handleSupClick}
            disabled={isRequesting || createRequest.isPending || !userLocation}
          >
            Sup!
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
            <MapView location={userLocation} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RestaurantCard
                name="The Cozy Corner"
                description="Intimate bistro with farm-to-table cuisine"
                image="https://images.unsplash.com/photo-1648396705951-5dce63b1db84"
                rating={4}
              />
              <RestaurantCard
                name="Urban Plate"
                description="Modern American cuisine in an industrial setting"
                image="https://images.unsplash.com/photo-1705917893728-d5c594c98d51"
                rating={5}
              />
              <RestaurantCard
                name="Sushi Master"
                description="Premium sushi and Japanese delicacies"
                image="https://images.unsplash.com/photo-1597595272404-d8a0da48ec8f"
                rating={5}
              />
            </div>
          </div>
        )}

        {activeRequests?.map((request) => (
          <LocationRequest key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}