import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { sendCampaignEmails } from "./mailer";
import { insertJobSchema, insertSubscriberSchema, insertCampaignSchema } from "@shared/schema";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Categories
  app.get("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const jobs = await storage.getJobs();
    const categories = [...new Set(jobs.map(job => job.category))];
    res.json(categories);
  });

  // Jobs
  app.get("/api/jobs", async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const job = await storage.createJob(parsed.data);
    res.status(201).json(job);
  });

  // Subscribers
  app.get("/api/subscribers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subscribers = await storage.getSubscribers();
    res.json(subscribers);
  });

  app.post("/api/subscribers", async (req, res) => {
    const parsed = insertSubscriberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const subscriber = await storage.createSubscriber(parsed.data);
    res.status(201).json(subscriber);
  });

  app.post("/api/subscribers/upload-csv", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (!req.files || !req.files.csv) {
      return res.status(400).json({ message: "No CSV file uploaded" });
    }

    const file = req.files.csv;
    const parser = parse({ columns: true, skip_empty_lines: true });

    try {
      const records: any[] = [];
      const stream = createReadStream(file.tempFilePath);

      stream.pipe(parser)
        .on("data", (record) => {
          // Check for both lowercase and uppercase email fields
          const email = record.email || record.Email;

          if (!email || email.trim() === '') {
            console.error('Empty or missing email in record:', record);
            return;
          }

          records.push({
            email: email.trim(),
            categories: [],
            active: true
          });
        })
        .on("end", async () => {
          console.log(`Parsed ${records.length} valid records from CSV`);

          if (records.length === 0) {
            return res.status(400).json({ message: "No valid email addresses found in CSV file" });
          }

          for (const record of records) {
            try {
              await storage.createSubscriber(record);
            } catch (error) {
              console.error("Error creating subscriber:", error);
            }
          }
          res.json({ message: `Imported ${records.length} subscribers` });
        })
        .on("error", (error) => {
          console.error("CSV parsing error:", error);
          res.status(500).json({ message: "Error processing CSV file" });
        });
    } catch (error) {
      console.error("CSV upload error:", error);
      res.status(500).json({ message: "Error processing CSV file" });
    }
  });

  // Campaigns
  app.get("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });

  app.post("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const campaign = await storage.createCampaign(parsed.data);
    res.status(201).json(campaign);
  });

  app.post("/api/campaigns/:id/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const campaignId = parseInt(req.params.id);
    const campaigns = await storage.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.sent) return res.status(400).json({ message: "Campaign already sent" });

    const jobs = await storage.getJobs();
    const subscribers = await storage.getSubscribers();

    if (subscribers.length === 0) {
      return res.status(400).json({ 
        message: "No active subscribers found. Please add subscribers first." 
      });
    }

    const success = await sendCampaignEmails(campaign, jobs, subscribers);
    if (!success) return res.status(500).json({ message: "Failed to send campaign" });

    const updatedCampaign = await storage.updateCampaign(campaignId, {
      sent: true,
      sendDate: new Date(),
    });

    res.json(updatedCampaign);
  });

  app.post("/api/test-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const testEmail = req.body.email;
      if (!testEmail) {
        return res.status(400).json({ message: "Email address required" });
      }

      const testCampaign = {
        id: 0,
        name: "Test Campaign",
        subject: "Test Email",
        content: "This is a test email to verify the email delivery system.",
        category: "test",
        sent: false,
        sendDate: null,
        openCount: 0
      };

      const testJob = {
        id: 0,
        title: "Test Job",
        company: "Test Company",
        description: "This is a test job posting.",
        category: "test",
        location: "Remote",
        url: "https://example.com"
      };

      const success = await sendCampaignEmails(
        testCampaign,
        [testJob],
        [{ id: 0, email: testEmail, categories: ["test"], active: true }]
      );

      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });

  app.get("/api/jobberway/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const response = await axios.get("https://jobberway.com/postslists.php");
      const jobs = response.data.slice(0, 10); // Get first 10 jobs
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching jobs from Jobberway" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}