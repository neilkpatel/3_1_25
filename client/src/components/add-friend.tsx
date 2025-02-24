import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { User } from "@shared/schema";

export function AddFriend() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users/search", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const res = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(search)}`);
      return res.json();
    },
    enabled: search.length >= 2,
  });

  const addFriend = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", "/api/friends/request", { username });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent!",
        description: `Request sent to ${search}`,
      });
      setSearch("");
      setOpen(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Friend</CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {search || "Search for users..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Type a username..." 
                value={search}
                onValueChange={setSearch}
              />
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users?.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => {
                      addFriend.mutate(user.username);
                    }}
                  >
                    {user.username}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}