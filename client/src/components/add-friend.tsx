import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export function AddFriend() {
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  const addFriend = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", "/api/friends/request", { username });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent!",
        description: `Request sent to ${username}`,
      });
      setUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      addFriend.mutate(username);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Friend</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={addFriend.isPending}
          />
          <Button type="submit" disabled={addFriend.isPending}>
            {addFriend.isPending ? "Sending..." : "Send Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
