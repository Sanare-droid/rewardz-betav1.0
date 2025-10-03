/**
 * Simple server for testing without complex middleware
 */
import "dotenv/config";
import express from "express";
import cors from "cors";

export function createSimpleServer() {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Simple ping
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Simple server is working!" });
  });

  // In development, we don't need to serve static files
  // Vite dev server handles the frontend
  
  // API routes
  app.get("/api/demo", (_req, res) => {
    res.json({ message: "Hello from Express server" });
  });

  // Health check for API
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, message: "API is healthy" });
  });

  // Serve test HTML file for development
  app.get("/", (_req, res) => {
    res.sendFile("test.html", { root: "." });
  });

  return app;
}
