import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Helper to convert 24kHz 16-bit Mono PCM to standard WAV
function pcmToWavBuffer(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Lazy initialization of GoogleGenAI
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing. Please configure it in the Settings > Secrets panel."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Text-to-Speech generation endpoint
app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      voiceName = "Kore",
      style = "normal",
      tone = "",
      mode = "single",
      speakers = [],
    } = req.body;

    if (!text && (!speakers || speakers.length === 0)) {
      return res.status(400).json({ error: "Text or dialogue lines are required." });
    }

    const ai = getGenAIClient();

    let response;
    let effectiveVoice = voiceName;

    if (mode === "multi" && Array.isArray(speakers) && speakers.length >= 2) {
      const speaker1 = speakers[0];
      const speaker2 = speakers[1];

      const conversationLines = speakers
        .map((s: { speaker: string; text: string }) => `${s.speaker}: ${s.text}`)
        .join("\n");

      const prompt = `TTS the following conversation between ${speaker1.speaker} and ${speaker2.speaker}:\n${conversationLines}`;

      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1.speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker1.voiceName || "Kore" },
                  },
                },
                {
                  speaker: speaker2.speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker2.voiceName || "Puck" },
                  },
                },
              ],
            },
          },
        },
      });
    } else {
      // Single speaker
      let promptText = text.trim();
      const modifiers: string[] = [];
      if (style && style !== "normal") modifiers.push(style);
      if (tone && tone !== "normal") modifiers.push(tone);

      if (modifiers.length > 0) {
        promptText = `Say in a ${modifiers.join(" and ")} tone: ${promptText}`;
      }

      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: effectiveVoice },
            },
          },
        },
      });
    }

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const rawBase64 = part?.inlineData?.data;
    const returnedMimeType = part?.inlineData?.mimeType || "audio/pcm;rate=24000";

    if (!rawBase64) {
      return res.status(502).json({
        error: "No audio stream returned from Gemini TTS engine.",
      });
    }

    // Convert PCM to standard WAV format
    const pcmBuffer = Buffer.from(rawBase64, "base64");
    const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString("base64");
    const durationSeconds = pcmBuffer.length / (24000 * 2); // 24kHz * 2 bytes per sample (16-bit mono)

    return res.json({
      audioDataUrl: `data:audio/wav;base64,${wavBase64}`,
      duration: durationSeconds,
      sampleRate: 24000,
      format: "wav",
      voiceName: effectiveVoice,
      style,
      textLength: text ? text.length : 0,
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate speech audio.",
    });
  }
});

// Creative AI Script Generator
app.post("/api/generate-script", async (req, res) => {
  try {
    const { category = "meditation", prompt = "" } = req.body;
    const ai = getGenAIClient();

    const categoryInstructions: Record<string, string> = {
      meditation: "Write a calm, soothing 2-sentence mindfulness meditation script.",
      story: "Write a compelling, dramatic opening hook for a fantasy audiobook.",
      news: "Write a crisp, authoritative 2-sentence breaking tech news bulletin.",
      commercial: "Write a high-energy, persuasive 2-sentence radio commercial script.",
      podcast: "Write a warm, charismatic podcast introduction welcoming listeners to Episode 1.",
      sci_fi: "Write an atmospheric sci-fi spaceship navigation alert message.",
      quote: "Provide an inspiring, philosophical quote on human curiosity and ambition.",
    };

    const instruction =
      categoryInstructions[category] ||
      `Write a short, engaging 2-3 sentence speech script based on: ${prompt || category}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: instruction,
      config: {
        systemInstruction:
          "You are a professional voiceover scriptwriter. Return ONLY the speech script text itself. No quotation marks, no stage directions, no formatting headers.",
      },
    });

    const scriptText = response.text?.trim() || "";
    return res.json({ script: scriptText });
  } catch (error: any) {
    console.error("Script generation error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate script.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
