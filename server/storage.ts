import {
  type User,
  type Friend,
  type SupRequest,
  type Restaurant,
  type InsertUser,
  type InsertFriend,
  type InsertSupRequest,
  type InsertRestaurant,
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friends: Map<number, Friend>;
  private supRequests: Map<number, SupRequest>;
  private restaurants: Map<number, Restaurant>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.friends = new Map();
    this.supRequests = new Map();
    this.restaurants = new Map();
    this.currentIds = { users: 1, friends: 1, supRequests: 1, restaurants: 1 };
    
    // Add mock restaurants and a simulated sup request
    this.initializeRestaurants();
  }

  private initializeRestaurants() {
    const mockRestaurants: InsertRestaurant[] = [
      {
        name: "The Cozy Corner",
        description: "Intimate bistro with farm-to-table cuisine",
        image: "https://images.unsplash.com/photo-1648396705951-5dce63b1db84",
        location: { lat: 40.7128, lng: -74.006 },
        rating: 4
      },
      {
        name: "Urban Plate",
        description: "Modern American cuisine in an industrial setting",
        image: "https://images.unsplash.com/photo-1705917893728-d5c594c98d51",
        location: { lat: 40.7138, lng: -74.008 },
        rating: 5
      },
      {
        name: "Sushi Master",
        description: "Premium sushi and Japanese delicacies",
        image: "https://images.unsplash.com/photo-1597595272404-d8a0da48ec8f",
        location: { lat: 40.7148, lng: -74.003 },
        rating: 5
      }
    ];

    mockRestaurants.forEach(restaurant => {
      const id = this.currentIds.restaurants++;
      this.restaurants.set(id, { ...restaurant, id });
    });

    // Add a simulated sup request
    const simulatedRequest: InsertSupRequest = {
      senderId: 2, // Different user
      location: { lat: 40.7158, lng: -74.005 }, // Slightly offset location
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
    return Array.from(this.restaurants.values());
  }

  async getNearbyRestaurants(lat: number, lng: number, limit: number): Promise<Restaurant[]> {
    // Simple mock implementation - returns all restaurants sorted by a basic distance calculation
    return Array.from(this.restaurants.values())
      .sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a.location.lat - lat, 2) + Math.pow(a.location.lng - lng, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.location.lat - lat, 2) + Math.pow(b.location.lng - lng, 2)
        );
        return distA - distB;
      })
      .slice(0, limit);
  }
}

export const storage = new MemStorage();