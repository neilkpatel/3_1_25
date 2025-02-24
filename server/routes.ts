import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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

      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Get restaurants near a location
  app.get("/api/restaurants/nearby", async (req, res) => {
    const schema = z.object({
      lat: z.string().transform(Number),
      lng: z.string().transform(Number),
    });

    try {
      const { lat, lng } = schema.parse(req.query);
      const restaurants = await storage.getNearbyRestaurants(lat, lng, 3);
      res.json(restaurants);
    } catch (error) {
      res.status(400).json({ error: "Invalid coordinates" });
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
