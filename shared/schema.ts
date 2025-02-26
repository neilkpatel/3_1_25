import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").notNull(), // pending, accepted
});

export const usersRelations = relations(users, ({ many }) => ({
  sentFriendRequests: many(friends, { relationName: "sender", fields: [users.id], references: [friends.userId] }),
  receivedFriendRequests: many(friends, { relationName: "receiver", fields: [users.id], references: [friends.friendId] }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  sender: one(users, { relationName: "sender", fields: [friends.userId], references: [users.id] }),
  receiver: one(users, { relationName: "receiver", fields: [friends.friendId], references: [users.id] }),
}));

export const supRequests = pgTable("sup_requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  location: jsonb("location").notNull(), // {lat: number, lng: number}
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").notNull(), // active, accepted, expired
  acceptedBy: integer("accepted_by").references(() => users.id),
  acceptedLocation: jsonb("accepted_location"), // {lat: number, lng: number}
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  location: jsonb("location").notNull(), // {lat: number, lng: number}
  rating: integer("rating").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertFriendSchema = createInsertSchema(friends);
export const insertSupRequestSchema = createInsertSchema(supRequests).omit({ id: true });
export const insertRestaurantSchema = createInsertSchema(restaurants);

export type User = typeof users.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type SupRequest = typeof supRequests.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type Location = { lat: number; lng: number };

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type InsertSupRequest = z.infer<typeof insertSupRequestSchema>;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications);
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;