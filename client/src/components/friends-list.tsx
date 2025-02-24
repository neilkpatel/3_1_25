import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Friend } from "@shared/schema";

export function FriendsList() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: friends } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  const acceptFriend = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest("POST", `/api/friends/${friendId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request accepted!",
      });
    },
  });

  const rejectFriend = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest("POST", `/api/friends/${friendId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request rejected",
      });
    },
  });

  if (!friends?.length) {
    return (
      <div className="text-center text-muted-foreground">
        No friends or pending requests
      </div>
    );
  }

  const pendingRequests = friends.filter(f => f.status === "pending");
  const acceptedFriends = friends.filter(f => f.status === "accepted");

  return (
    <ScrollArea className="h-[400px]">
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Pending Requests</h3>
          <div className="space-y-4">
            {pendingRequests.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {friend.friendId.toString().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Friend #{friend.friendId}</p>
                    <p className="text-sm text-muted-foreground">Pending request</p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    onClick={() => acceptFriend.mutate(friend.id)}
                    disabled={acceptFriend.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectFriend.mutate(friend.id)}
                    disabled={rejectFriend.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-4">Friends</h3>
        <div className="space-y-4">
          {acceptedFriends.map((friend) => (
            <div key={friend.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  {friend.friendId.toString().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Friend #{friend.friendId}</p>
                <p className="text-sm text-muted-foreground">Friend</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}