import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupRequestSchema } from "@shared/schema";
import { z } from "zod";
import { createNotificationServer } from "./websocket";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const notificationServer = createNotificationServer(httpServer);

  // Set up authentication routes and middleware
  setupAuth(app);

  // Get active sup requests
  app.get("/api/sup-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.getActiveSupRequests();
    res.json(requests);
  });

  // Create a new sup request
  app.post("/api/sup-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const data = insertSupRequestSchema.parse({
        ...req.body,
        senderId: req.user.id, // Use the authenticated user's ID
      });
      const request = await storage.createSupRequest(data);

      // Broadcast new sup request to all connected clients
      notificationServer.broadcastNotification({
        type: "New Sup Request",
        message: "Someone wants to meet up!",
        data: request,
      });

      res.json(request);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Accept a sup request
  app.post("/api/sup-requests/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { id } = req.params;
    const schema = z.object({ location: z.object({ lat: z.number(), lng: z.number() }) });

    try {
      const { location } = schema.parse(req.body);
      const request = await storage.getSupRequest(Number(id));

      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (request.status !== "active") {
        return res.status(400).json({ error: "Request cannot be accepted" });
      }

      const updated = await storage.updateSupRequest(Number(id), {
        status: "accepted",
        acceptedLocation: location,
        acceptedBy: req.user.id, // Use the authenticated user's ID
      });

      // Send notification to the original sender
      notificationServer.sendNotification(request.senderId, {
        type: "Request Accepted",
        message: "Someone accepted your meet-up request!",
        data: updated,
      });

      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Get restaurants near a location
  app.get("/api/restaurants/nearby", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radius: z.coerce.number().optional().default(1000),
    });

    try {
      const { lat, lng, radius } = schema.parse(req.query);
      const bars = await storage.getNearbyRestaurants(lat, lng, 10);
      res.json(bars);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Invalid coordinates format",
          details: error.errors,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch nearby bars",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });


  // Send friend request
  app.post("/api/friends/request", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    try {
      const targetUser = await storage.getUserByUsername(username);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.id === req.user.id) {
        return res.status(400).json({ error: "Cannot add yourself as a friend" });
      }

      const existingFriendship = await storage.getFriends(req.user.id);
      const alreadyFriends = existingFriendship.some(
        f => f.friendId === targetUser.id || f.userId === targetUser.id
      );

      if (alreadyFriends) {
        return res.status(400).json({ error: "Friend request already exists" });
      }

      const friend = await storage.addFriend({
        userId: req.user.id,
        friendId: targetUser.id,
        status: "pending"
      });

      // Notify the target user about the friend request
      notificationServer.sendNotification(targetUser.id, {
        type: "Friend Request",
        message: `${req.user.username} sent you a friend request`,
      });

      res.json(friend);
    } catch (error) {
      res.status(500).json({ error: "Failed to send friend request" });
    }
  });

  // Accept friend request
  app.post("/api/friends/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const friend = await storage.getFriend(parseInt(req.params.id));
      if (!friend) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      if (friend.friendId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to accept this request" });
      }

      const updated = await storage.updateFriend(friend.id, { status: "accepted" });

      // Notify the original sender that their request was accepted
      notificationServer.sendNotification(friend.userId, {
        type: "Friend Request Accepted",
        message: `${req.user.username} accepted your friend request`,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });

  // Reject friend request
  app.post("/api/friends/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const friend = await storage.getFriend(parseInt(req.params.id));
      if (!friend) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      if (friend.friendId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to reject this request" });
      }

      await storage.deleteFriend(friend.id);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject friend request" });
    }
  });

  // Get friends list
  app.get("/api/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const friends = await storage.getFriends(req.user.id);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friends list" });
    }
  });

  // Search users
  app.get("/api/users/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    try {
      const users = await storage.searchUsers(query);
      // Don't include the current user in results
      const filteredUsers = users.filter(u => u.id !== req.user?.id);
      res.json(filteredUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  return httpServer;
}