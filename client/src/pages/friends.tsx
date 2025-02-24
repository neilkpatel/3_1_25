import { FriendsList } from "@/components/friends-list";
import { AddFriend } from "@/components/add-friend";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Friends() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <AddFriend />

        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <FriendsList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}