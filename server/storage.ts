import {
  type User,
  type Friend,
  type SupRequest,
  type Restaurant,
  type InsertUser,
  type InsertFriend,
  type InsertSupRequest,
  type InsertRestaurant,
  type Location,
} from "@shared/schema";
import { searchBarsNearby } from "./services/yelp";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Friends
  getFriends(userId: number): Promise<Friend[]>;
  addFriend(friend: InsertFriend): Promise<Friend>;

  // Sup Requests
  createSupRequest(request: InsertSupRequest): Promise<SupRequest>;
  getActiveSupRequests(): Promise<SupRequest[]>;
  getSupRequest(id: number): Promise<SupRequest | undefined>;
  updateSupRequest(id: number, update: Partial<SupRequest>): Promise<SupRequest>;

  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getNearbyRestaurants(lat: number, lng: number, limit: number): Promise<Restaurant[]>;

  // Session Store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friends: Map<number, Friend>;
  private supRequests: Map<number, SupRequest>;
  private currentIds: { [key: string]: number };
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.friends = new Map();
    this.supRequests = new Map();
    this.currentIds = { users: 1, friends: 1, supRequests: 1 };

    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add a simulated sup request
    this.initializeSimulatedRequest();
  }

  private initializeSimulatedRequest() {
    // Add a simulated sup request
    const simulatedRequest: InsertSupRequest = {
      senderId: 2, // Different user
      location: { lat: 25.7144, lng: -80.3626 }, // Near the bars
      status: "active",
      expiresAt: new Date(Date.now() + 60000), // Expires in 1 minute
      acceptedBy: null,
      acceptedLocation: null
    };

    const id = this.currentIds.supRequests++;
    this.supRequests.set(id, { ...simulatedRequest, id });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async getFriends(userId: number): Promise<Friend[]> {
    return Array.from(this.friends.values()).filter(f =>
      f.userId === userId || f.friendId === userId
    );
  }

  async addFriend(friend: InsertFriend): Promise<Friend> {
    const id = this.currentIds.friends++;
    const newFriend = { ...friend, id };
    this.friends.set(id, newFriend);
    return newFriend;
  }

  async createSupRequest(request: InsertSupRequest): Promise<SupRequest> {
    const id = this.currentIds.supRequests++;
    const newRequest = { ...request, id };
    this.supRequests.set(id, newRequest);
    return newRequest;
  }

  async getActiveSupRequests(): Promise<SupRequest[]> {
    return Array.from(this.supRequests.values()).filter(
      r => r.status === 'active' && new Date(r.expiresAt) > new Date()
    );
  }

  async getSupRequest(id: number): Promise<SupRequest | undefined> {
    return this.supRequests.get(id);
  }

  async updateSupRequest(id: number, update: Partial<SupRequest>): Promise<SupRequest> {
    const request = this.supRequests.get(id);
    if (!request) throw new Error('Sup request not found');

    const updated = { ...request, ...update };
    this.supRequests.set(id, updated);
    return updated;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    // This will be replaced by Yelp API calls in getNearbyRestaurants
    return [];
  }

  async getNearbyRestaurants(lat: number, lng: number, limit: number): Promise<Restaurant[]> {
    try {
      const bars = await searchBarsNearby(lat, lng);
      return bars.slice(0, limit);
    } catch (error) {
      console.error('Error fetching nearby bars:', error);
      return [];
    }
  }
}

export const storage = new MemStorage();