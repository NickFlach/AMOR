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

  return httpServer;
}
