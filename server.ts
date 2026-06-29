import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Helper to write to log file
function logLLMResponse(provider: string, model: string, systemInstruction: any, prompt: string, responseText: string, error?: string) {
  try {
    const timestamp = new Date().toISOString();
    const divider = "=".repeat(80);
    const logContent = `
${divider}
TIMESTAMP: ${timestamp}
PROVIDER: ${provider}
MODEL: ${model}
SYSTEM INSTRUCTION:
${systemInstruction || "(None)"}
--------------------------------------------------------------------------------
PROMPT:
${prompt}
--------------------------------------------------------------------------------
RESPONSE:
${responseText || "(Empty / Error: " + error + ")"}
${divider}
\n`;
    fs.appendFileSync(path.join(process.cwd(), "llm_responses.log"), logContent, "utf8");
  } catch (err) {
    console.error("Failed to write to LLM log file:", err);
  }
}

// Initialize Gemini SDK lazily to avoid startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets/Env.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/config", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    res.json({
      geminiAvailable: hasKey,
      appUrl: process.env.APP_URL || "http://localhost:3000"
    });
  });

  // Log external or local LLM response from the client
  app.post("/api/log-llm", (req, res) => {
    try {
      const { provider, model, systemInstruction, prompt, responseText, error } = req.body;
      logLLMResponse(provider || "unknown", model || "unknown", systemInstruction, prompt, responseText, error);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Generate text using Gemini
  app.post("/api/gemini/generate", async (req, res) => {
    const { model, prompt, systemInstruction, temperature } = req.body;
    try {
      const ai = getGeminiClient();
      
      const response = await ai.models.generateContent({
        model: model || "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: temperature !== undefined ? Number(temperature) : undefined,
        }
      });

      const responseText = response.text || "";
      logLLMResponse("gemini", model || "gemini-3.5-flash", systemInstruction, prompt, responseText);
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini Generate Error:", error);
      logLLMResponse("gemini", model || "gemini-3.5-flash", systemInstruction, prompt, "", error.message || String(error));
      res.status(500).json({ error: error.message || "Failed to generate content from Gemini." });
    }
  });

  // Summarize conversation (Recursive Summarizer AI)
  app.post("/api/gemini/summarize", async (req, res) => {
    const { messages, previousSummary, topic } = req.body;
    let prompt = "";
    try {
      const ai = getGeminiClient();

      const messagesText = messages
        .map((m: any) => `${m.senderName} (${m.senderId}): ${m.content}`)
        .join("\n\n");

      prompt = `
Topic being discussed: "${topic}"

${previousSummary ? `Previous running summary of earlier dialogue:\n"""\n${previousSummary}\n"""\n` : ""}

New dialogue lines to integrate:
"""
${messagesText}
"""

As the Summarizer AI, your task is to recursively summarize this entire dialogue history. 
Condense the conversation so far, retaining critical context, positions, and core insights, while discarding redundant conversational pleasantries or outdated points.
Ensure you track:
1. What the key points of disagreement or agreement are.
2. The current stance/insight of each active participant.
3. The socratic questions that have driven the conversation so far.

Write a clear, cohesive, high-density bulleted summary (around 200-350 words). Do not invent anything that hasn't been said.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an objective, highly logical Summarizer AI specialized in capturing multi-agent dialogues and conceptual evolution without bias.",
          temperature: 0.2
        }
      });

      const responseText = response.text || "";
      logLLMResponse("gemini", "gemini-3.5-flash", "You are an objective, highly logical Summarizer AI specialized in capturing multi-agent dialogues and conceptual evolution without bias.", prompt, responseText);
      res.json({ summary: responseText });
    } catch (error: any) {
      console.error("Gemini Summarization Error:", error);
      logLLMResponse("gemini", "gemini-3.5-flash", "You are an objective, highly logical Summarizer AI specialized in capturing multi-agent dialogues and conceptual evolution without bias.", prompt, "", error.message || String(error));
      res.status(500).json({ error: error.message || "Failed to generate summary from Gemini." });
    }
  });

  // Analyze topic and auto-assign 2-3 perspectives and character prompts for the multi-faceted analysis
  app.post("/api/gemini/assign-perspectives", async (req, res) => {
    const { topic } = req.body;
    let prompt = "";
    try {
      const ai = getGeminiClient();

      prompt = `The user wants to explore the following theological or moral topic: "${topic}" via an Interfaith Socratic Cartography platform.
Analyze this topic and determine 2 or 3 distinct faith traditions or belief systems (choose from: Christianity, Islam, Judaism, Hinduism, Buddhism, Sikhism, Baháʼí, Secular Humanism, Agnosticism, Atheism) that have rich comparative theological viewpoints on this topic.
For each tradition chosen, generate:
1. A descriptive Agent Name of a respectful representative (e.g., "Brother Thomas", "Imam Farooq", "Rabbi Sarah", "Acharya Arjun", "Tenzin Gyatso", "Simran Kaur", "Layli", "Leo the Humanist", "Maya the Agnostic", "Dr. Sam").
2. A Perspective Name, which MUST be the name of the faith tradition itself (e.g., "Christianity", "Islam", "Judaism", "Hinduism", "Buddhism", "Sikhism", "Baháʼí", "Secular Humanism", "Agnosticism", "Atheism").
3. An initial stance on the topic ('agree', 'disagree', or 'neutral').
4. A highly detailed character prompt explaining how this agent should present their tradition's views on the topic, cite scriptural or traditional sources respectfully, and maintain strict adherence to dialogue rules (never say other faiths are wrong, never try to convert, never caricature, speak only from within their own framework).

Format your response strictly as a JSON array of these agent objects.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "List of assigned respondent agents",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Descriptive agent name" },
                perspectiveName: { type: Type.STRING, description: "The perspective they represent" },
                initialPosition: { 
                  type: Type.STRING, 
                  description: "Initial stance on the topic",
                  enum: ["agree", "disagree", "neutral"]
                },
                characterPrompt: { 
                  type: Type.STRING, 
                  description: "Character instruction/system prompt for this respondent" 
                },
                avatarColor: {
                  type: Type.STRING,
                  description: "A Tailwind bg color class (e.g. bg-blue-500, bg-amber-500, bg-rose-500, bg-emerald-500, bg-indigo-500)",
                }
              },
              required: ["name", "perspectiveName", "initialPosition", "characterPrompt", "avatarColor"]
            }
          },
          temperature: 0.7
        }
      });

      const responseText = response.text || "[]";
      logLLMResponse("gemini", "gemini-3.5-flash", "Assign comparative theological viewpoints as structured JSON agents.", prompt, responseText);
      const parsedAgents = JSON.parse(responseText);
      res.json({ agents: parsedAgents });
    } catch (error: any) {
      console.error("Gemini Perspective Assignment Error:", error);
      logLLMResponse("gemini", "gemini-3.5-flash", "Assign comparative theological viewpoints as structured JSON agents.", prompt, "", error.message || String(error));
      res.status(500).json({ error: error.message || "Failed to assign perspectives using Gemini." });
    }
  });

  // Get raw LLM log file
  app.get("/api/logs/llm", (req, res) => {
    const logPath = path.join(process.cwd(), "llm_responses.log");
    if (!fs.existsSync(logPath)) {
      res.setHeader("Content-Type", "text/plain");
      return res.send("No logs recorded yet. Run a dialogue turn to populate the log file!");
    }
    res.setHeader("Content-Type", "text/plain");
    res.sendFile(logPath);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
