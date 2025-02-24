import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupRequestSchema } from "@shared/schema";
import { z } from "zod";
import { createNotificationServer } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const notificationServer = createNotificationServer(httpServer);

  // Get active sup requests
  app.get("/api/sup-requests", async (req, res) => {
    const requests = await storage.getActiveSupRequests();
    res.json(requests);
  });

  // Create a new sup request
  app.post("/api/sup-requests", async (req, res) => {
    try {
      const data = insertSupRequestSchema.parse(req.body);
      const request = await storage.createSupRequest(data);

      // Broadcast new sup request to all connected clients
      notificationServer.broadcastNotification({
        type: "New Sup Request",
        message: "Someone wants to meet up!",
        data: request
      });

      res.json(request);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Accept a sup request
  app.post("/api/sup-requests/:id/accept", async (req, res) => {
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
        acceptedBy: 1, // TODO: Use actual user ID
      });

      // Send notification to the original sender
      notificationServer.sendNotification(request.senderId, {
        type: "Request Accepted",
        message: "Someone accepted your meet-up request!",
        data: updated
      });

      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Get restaurants near a location
  app.get("/api/restaurants/nearby", async (req, res) => {
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radius: z.coerce.number().optional().default(1000),
    });

    try {
      console.log('Received nearby restaurants request:', req.query);
      const { lat, lng, radius } = schema.parse(req.query);

      console.log('Fetching bars near:', { lat, lng, radius });
      const bars = await storage.getNearbyRestaurants(lat, lng, 10);

      console.log('Returning bars:', bars);
      res.json(bars);
    } catch (error) {
      console.error('Error in /api/restaurants/nearby:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid coordinates format",
          details: error.errors
        });
      } else {
        res.status(500).json({ 
          error: "Failed to fetch nearby bars",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Get friends list
  app.get("/api/friends/:userId", async (req, res) => {
    const { userId } = req.params;
    const friends = await storage.getFriends(Number(userId));
    res.json(friends);
  });

  return httpServer;
}