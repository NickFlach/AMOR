import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/config", (req, res) => {
    res.json({
      walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || "",
    });
  });

  return httpServer;
}
