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
  users,
  friends,
  supRequests,
  restaurants,
} from "@shared/schema";
import { searchBarsNearby } from "./services/yelp";
import session from "express-session";
import { db } from "./db";
import { eq, or, and, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

export async function searchUsers(query: string) {
  return db.select()
    .from(users)
    .where(sql`LOWER(username) LIKE ${`%${query.toLowerCase()}%`}`)
    .limit(10);
}

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string): Promise<User[]>;

  // Friends
  getFriends(userId: number): Promise<Friend[]>;
  addFriend(friend: InsertFriend): Promise<Friend>;
  getFriend(id: number): Promise<Friend | undefined>;
  updateFriend(id: number, update: Partial<Friend>): Promise<Friend>;
  deleteFriend(id: number): Promise<void>;

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

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  async searchUsers(query: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(sql`${users.username} ILIKE ${`%${query}%`}`)
      .limit(5);
  }

  // Friends
  async getFriends(userId: number): Promise<Friend[]> {
    return db
      .select()
      .from(friends)
      .where(or(eq(friends.userId, userId), eq(friends.friendId, userId)));
  }

  async getFriend(id: number): Promise<Friend | undefined> {
    const [friend] = await db.select().from(friends).where(eq(friends.id, id));
    return friend;
  }

  async addFriend(friend: InsertFriend): Promise<Friend> {
    const [createdFriend] = await db.insert(friends).values(friend).returning();
    return createdFriend;
  }

  async updateFriend(id: number, update: Partial<Friend>): Promise<Friend> {
    const [updatedFriend] = await db
      .update(friends)
      .set(update)
      .where(eq(friends.id, id))
      .returning();
    return updatedFriend;
  }

  async deleteFriend(id: number): Promise<void> {
    await db.delete(friends).where(eq(friends.id, id));
  }

  // Sup Requests
  async createSupRequest(request: InsertSupRequest): Promise<SupRequest> {
    const [createdRequest] = await db.insert(supRequests).values(request).returning();
    return createdRequest;
  }

  async getActiveSupRequests(): Promise<SupRequest[]> {
    return db
      .select()
      .from(supRequests)
      .where(
        and(
          eq(supRequests.status, "active"),
          sql`${supRequests.expiresAt} > NOW()`
        )
      );
  }

  async getSupRequest(id: number): Promise<SupRequest | undefined> {
    const [request] = await db.select().from(supRequests).where(eq(supRequests.id, id));
    return request;
  }

  async updateSupRequest(id: number, update: Partial<SupRequest>): Promise<SupRequest> {
    const [updatedRequest] = await db
      .update(supRequests)
      .set(update)
      .where(eq(supRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants);
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

export const storage = new DatabaseStorage();