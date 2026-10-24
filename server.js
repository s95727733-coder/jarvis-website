import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static(__dirname, {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith("sw.js")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

// Small in-memory rate limit for a single-server starter deployment.
const requests = new Map();
app.use("/api/", (req, res, next) => {
  const now = Date.now();
  const key = req.ip || "unknown";
  const recent = (requests.get(key) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 30) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }
  recent.push(now);
  requests.set(key, recent);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, geminiConfigured: Boolean(ai) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "J.A.R.V.I.S. needs a Gemini API key. Add GEMINI_API_KEY to your server's .env file."
      });
    }

    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 3000) return res.status(400).json({ error: "Message is too long (max 3000 characters)." });

    const language = req.body?.language === "hi" ? "Hindi" : "English";
    const personality = ["tactical", "witty", "formal"].includes(req.body?.personality)
      ? req.body.personality : "tactical";
    const historyInput = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
    const history = historyInput
      .filter((item) =>
        item &&
        (item.role === "user" || item.role === "model") &&
        typeof item.text === "string" &&
        item.text.length <= 3000
      )
      .map((item) => ({
        role: item.role,
        parts: [{ text: item.text }]
      }));

    const style = {
      tactical: "Be concise, clear, capable, and mission-focused.",
      witty: "Be helpful, confident, and lightly witty without being rude.",
      formal: "Be professional, polished, and precise."
    }[personality];

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction:
          `You are J.A.R.V.I.S., a helpful personal AI assistant inspired by a futuristic cinematic HUD. ` +
          `Respond in ${language}. ${style} Be honest about your capabilities. ` +
          `Do not claim to control the user's device, access private data, or perform actions you did not perform.`
      }
    });

    const reply = response.text?.trim();
    if (!reply) return res.status(502).json({ error: "The assistant returned an empty response. Please try again." });
    res.json({ reply });
  } catch (error) {
    console.error("Chat request failed:", error?.message || error);
    res.status(500).json({ error: "J.A.R.V.I.S. is temporarily unavailable. Please try again." });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`J.A.R.V.I.S. is running at http://localhost:${port}`);
  if (!apiKey) console.warn("GEMINI_API_KEY is not set. Chat will show setup instructions.");
});
