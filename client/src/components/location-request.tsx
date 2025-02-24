import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentLocation } from "@/lib/location";
import { useToast } from "@/hooks/use-toast";
import type { SupRequest } from "@shared/schema";

interface LocationRequestProps {
  request: SupRequest;
}

export function LocationRequest({ request }: LocationRequestProps) {
  const { toast } = useToast();

  const acceptRequest = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      return apiRequest("POST", `/api/sup-requests/${request.id}/accept`, { location });
    },
    onSuccess: () => {
      toast({
        title: "Request accepted!",
        description: "Check out the recommended meeting spots.",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Someone wants to meet up!</h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          A friend is looking to hang out. Want to join them?
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => acceptRequest.mutate()}
          disabled={acceptRequest.isPending}
        >
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
