import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  company: text("company").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  url: text("url").notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  categories: text("categories").array().notNull(),
  active: boolean("active").notNull().default(true),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  sent: boolean("sent").notNull().default(false),
  sendDate: timestamp("send_date"),
  openCount: integer("open_count").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users);
export const insertJobSchema = createInsertSchema(jobs);
export const insertSubscriberSchema = createInsertSchema(subscribers);
export const insertCampaignSchema = createInsertSchema(campaigns);

export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
