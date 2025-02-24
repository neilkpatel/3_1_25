import { FriendsList } from "@/components/friends-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Friends() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <FriendsList userId={1} /> {/* TODO: Use actual user ID */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
