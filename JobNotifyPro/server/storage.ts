import { IStorage } from "./types";
import { InsertUser, InsertJob, InsertSubscriber, InsertCampaign, User, Job, Subscriber, Campaign } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private subscribers: Map<number, Subscriber>;
  private campaigns: Map<number, Campaign>;
  private currentId: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.subscribers = new Map();
    this.campaigns = new Map();
    this.currentId = { users: 1, jobs: 1, subscribers: 1, campaigns: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const id = this.currentId.jobs++;
    const newJob = { ...job, id };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  // Subscriber operations
  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const id = this.currentId.subscribers++;
    const newSubscriber = { ...subscriber, id, categories: [], active: true };
    this.subscribers.set(id, newSubscriber);
    return newSubscriber;
  }

  async getSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values()).filter(sub => sub.active);
  }

  // Campaign operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentId.campaigns++;
    const newCampaign = { 
      ...campaign, 
      id,
      sent: false,
      sendDate: null,
      openCount: 0
    };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaigns.get(id);
    if (!campaign) throw new Error("Campaign not found");
    const updatedCampaign = { ...campaign, ...updates };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }
}

export const storage = new MemStorage();