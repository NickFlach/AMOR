import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  processGuardianMessage,
  streamGuardianMessage,
  getSessionMessages,
  clearSession,
} from "./guardian";
import { getChainStats, getUserChainData } from "./onchain";
import {
  addSubscriber,
  removeSubscriber,
  getSubscriberCount,
  sendNewsletterToAll,
  generateWeeklyNewsletter,
  sendWelcomeEmail,
} from "./newsletter";
import { isSmtpConfigured, verifySmtpConnection } from "./mailer";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/config", (req, res) => {
    res.json({
      walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || "",
    });
  });

  app.post("/api/guardian/chat", async (req: Request, res: Response) => {
    try {
      const { sessionId, message, walletContext } = req.body;

      if (!sessionId || !message) {
        return res.status(400).json({ error: "sessionId and message are required" });
      }

      const response = await processGuardianMessage(sessionId, message, walletContext);
      res.json(response);
    } catch (error) {
      console.error("Guardian chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.post("/api/guardian/chat/stream", async (req: Request, res: Response) => {
    try {
      const { sessionId, message, walletContext } = req.body;

      if (!sessionId || !message) {
        return res.status(400).json({ error: "sessionId and message are required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      await streamGuardianMessage(
        sessionId,
        message,
        walletContext,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      );

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Guardian stream error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to stream message" });
      }
    }
  });

  app.get("/api/guardian/history/:sessionId", (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const messages = getSessionMessages(sessionId);
    res.json({ messages });
  });

  app.delete("/api/guardian/session/:sessionId", (req: Request, res: Response) => {
    const { sessionId } = req.params;
    clearSession(sessionId);
    res.status(204).send();
  });

  app.get("/api/chain/stats", async (req: Request, res: Response) => {
    try {
      const stats = await getChainStats();
      res.json(stats);
    } catch (error) {
      console.error("Chain stats error:", error);
      res.status(500).json({ error: "Failed to fetch chain stats" });
    }
  });

  app.get("/api/chain/user/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      const userData = await getUserChainData(address);
      res.json(userData);
    } catch (error) {
      console.error("User chain data error:", error);
      res.status(500).json({ error: "Failed to fetch user chain data" });
    }
  });

  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const added = await addSubscriber(email);
      
      if (added) {
        sendWelcomeEmail(email).catch(err => 
          console.error("Failed to send welcome email:", err)
        );
        res.json({ success: true, message: "Successfully subscribed to newsletter" });
      } else {
        res.json({ success: false, message: "Email already subscribed" });
      }
    } catch (error) {
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.post("/api/newsletter/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      await removeSubscriber(email);
      res.json({ success: true, message: "Successfully unsubscribed" });
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.get("/api/newsletter/status", async (req: Request, res: Response) => {
    try {
      const subscriberCount = await getSubscriberCount();
      const smtpConfigured = isSmtpConfigured();
      
      res.json({
        subscriberCount,
        smtpConfigured,
      });
    } catch (error) {
      console.error("Newsletter status error:", error);
      res.status(500).json({ error: "Failed to get newsletter status" });
    }
  });

  app.get("/api/newsletter/preview", async (req: Request, res: Response) => {
    try {
      const { subject, html } = await generateWeeklyNewsletter();
      res.json({ subject, html });
    } catch (error) {
      console.error("Newsletter preview error:", error);
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  app.post("/api/newsletter/send", async (req: Request, res: Response) => {
    try {
      if (!isSmtpConfigured()) {
        return res.status(400).json({ error: "SMTP not configured" });
      }

      const result = await sendNewsletterToAll();
      res.json({ 
        success: true, 
        message: `Newsletter sent to ${result.sent} subscribers`,
        ...result 
      });
    } catch (error) {
      console.error("Newsletter send error:", error);
      res.status(500).json({ error: "Failed to send newsletter" });
    }
  });

  app.get("/api/newsletter/smtp-status", async (req: Request, res: Response) => {
    try {
      if (!isSmtpConfigured()) {
        return res.json({ configured: false, verified: false });
      }
      
      const verified = await verifySmtpConnection();
      res.json({ configured: true, verified });
    } catch (error) {
      console.error("SMTP status error:", error);
      res.json({ configured: isSmtpConfigured(), verified: false, error: String(error) });
    }
  });

  return httpServer;
}
