import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Friend } from "@shared/schema";

interface FriendsListProps {
  userId: number;
}

export function FriendsList({ userId }: FriendsListProps) {
  const { data: friends } = useQuery<Friend[]>({
    queryKey: [`/api/friends/${userId}`],
  });

  if (!friends?.length) {
    return (
      <div className="text-center text-muted-foreground">
        No friends added yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {friends.map((friend) => (
          <div key={friend.id} className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>
                {friend.friendId.toString().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Friend #{friend.friendId}</p>
              <p className="text-sm text-muted-foreground">
                {friend.status === "pending" ? "Pending" : "Friend"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
