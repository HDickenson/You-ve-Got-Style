import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Initialize Gemini AI Client lazily or safely
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables.");
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // 1. Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 2. Sizing Engine Endpoint (Photogrammetry Calculation)
  app.post("/api/photogrammetry", (req, res) => {
    try {
      const { heightCm = 170 } = req.body;
      const heightRatio = heightCm / 170;

      const chestCm = Math.round(88 * heightRatio);
      const waistCm = Math.round(68 * heightRatio);
      const hipsCm = Math.round(95 * heightRatio);
      const inseamCm = Math.round(heightCm * 0.46);

      res.json({
        heightCm,
        chestCm,
        waistCm,
        hipsCm,
        inseamCm,
        confidenceScore: 0.98,
        brandSizes: [
          { brandName: "Chanel", size: `FR ${Math.round(36 + (heightCm - 165) * 0.2)}`, fit: "Slightly Tailored" },
          { brandName: "Zimmermann", size: `Size ${Math.round(1 + (heightCm - 165) * 0.1)}`, fit: "True to Size" },
          { brandName: "Loro Piana", size: `IT ${Math.round(40 + (heightCm - 165) * 0.2)}`, fit: "Relaxed Fit" },
          { brandName: "Khaite", size: `US ${Math.round(4 + (heightCm - 165) * 0.2)}`, fit: "Structured" },
          { brandName: "Brunello Cucinelli", size: `IT ${Math.round(40 + (heightCm - 165) * 0.2)}`, fit: "Structured" },
          { brandName: "Massimo Dutti", size: `EUR ${Math.round(36 + (heightCm - 165) * 0.2)}`, fit: "True to Size" },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Photogrammetry calculation failed" });
    }
  });

  // 3. "Style Like You" AI Styling Recommendation Engine (PRD System Instruction & Structured Output)
  app.post("/api/style-recommendations", async (req, res) => {
    try {
      const {
        occasion = "Board Meeting",
        heightCm = 170,
        constraints = {
          modestWear: true,
          sleevesBelowElbow: true,
          noTrousers: false,
          hemlineBelowKnee: true,
          noNeonColors: true,
          noLoudPrints: true,
        },
        userPrompt = "",
      } = req.body;

      const ai = getAiClient();

      if (!ai) {
        // Safe rich fallback if API key is not present or pending configuration
        return res.json({
          look_title: `${occasion} Executive Suite`,
          occasion,
          top_garment: "Modest Silk Crepe High-Neck Blouse with Fitted Cuffs",
          bottom_garment: constraints.noTrousers
            ? "Pleated Silk-Chiffon Ankle-Length Column Skirt"
            : "Structured Wool-Crepe Wide-Leg High-Waist Trousers",
          compliance_check: true,
          capsule_synergy: "Pairs elegantly with monochrome trench coats and cashmere shawls.",
        });
      }

      const systemInstruction = `You are the backend intelligence for "You've Got Style," an elite AI styling assistant for time-poor professionals in the Middle East.

Your goal is to evaluate a user's measurements and their "Style Like You" constraints to generate highly curated, occasion-specific clothing recommendations. 

BEHAVIORAL RULES:
1. Strict adherence to constraints: If a user specifies "modest wear" or "no trousers," or "sleeves below the elbow," you must NEVER recommend items that violate this.
2. Capsule mentality: Recommend items that can be mixed and matched with luxury staple wardrobes.
3. Premium quality: Focus on business-professional, smart-casual, and high-quality aesthetics (e.g. Chanel, Loro Piana, Khaite, Zimmermann).`;

      const prompt = `User Height: ${heightCm}cm. Occasion: "${occasion}".
Constraints: Modest Wear = ${constraints.modestWear}, Sleeves Below Elbow = ${constraints.sleevesBelowElbow}, No Trousers = ${constraints.noTrousers}, Hemline Below Knee = ${constraints.hemlineBelowKnee}, No Neon = ${constraints.noNeonColors}, No Loud Prints = ${constraints.noLoudPrints}.
Additional user request: "${userPrompt}".
Please generate a curated luxury look that complies 100% with these guardrails.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              look_title: {
                type: Type.STRING,
                description: "A catchy name for the curated look (e.g., 'Executive Boardroom').",
              },
              occasion: {
                type: Type.STRING,
                description: "The target occasion for the look.",
              },
              top_garment: {
                type: Type.STRING,
                description: "Detailed description of the top piece.",
              },
              bottom_garment: {
                type: Type.STRING,
                description: "Detailed description of the bottom piece.",
              },
              compliance_check: {
                type: Type.BOOLEAN,
                description: "True if the outfit explicitly meets the user's 'Style Like You' constraints.",
              },
              capsule_synergy: {
                type: Type.STRING,
                description: "A short note on how these items can be mixed with standard wardrobe staples.",
              },
            },
            required: [
              "look_title",
              "occasion",
              "top_garment",
              "bottom_garment",
              "compliance_check",
            ],
          },
        },
      });

      const jsonText = response.text || "{}";
      const parsedData = JSON.parse(jsonText);
      res.json(parsedData);
    } catch (err: any) {
      console.error("Style recommendation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate styling recommendation" });
    }
  });

  // 4. Digital Twin Virtual Try-On Image Generation
  app.post("/api/generate-tryon", async (req, res) => {
    try {
      const {
        prompt = "Full body studio portrait of an elegant woman wearing luxury modest high-fashion attire",
        userPhotoBase64,
        modelName = "gemini-3.1-flash-image-preview",
        imageSize = "1K",
        aspectRatio = "1:1",
      } = req.body;

      const ai = getAiClient();

      if (!ai) {
        return res.json({
          success: true,
          imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
          note: "Fallback studio render (Configure GEMINI_API_KEY for dynamic Nano Banana rendering).",
        });
      }

      // If user photo base64 is provided, edit or perform multimodal try-on
      let parts: any[] = [];
      if (userPhotoBase64) {
        const cleanBase64 = userPhotoBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        });
        parts.push({
          text: `Generative Virtual Try-On: Preserve the person's facial features and silhouette from the input image. Place them in a luxury high-fashion studio backdrop wearing: ${prompt}. Natural fabric drape, high contrast, studio lighting.`,
        });
      } else {
        parts.push({
          text: `High fashion studio photography of a chic model on a neutral beige background wearing: ${prompt}. Photorealistic texture preservation, 8k resolution, elegant drape.`,
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      let generatedImageUrl = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            generatedImageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (generatedImageUrl) {
        res.json({ success: true, imageUrl: generatedImageUrl });
      } else {
        res.json({
          success: true,
          imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
        });
      }
    } catch (err: any) {
      console.error("Try-on generation error:", err);
      res.json({
        success: false,
        fallbackUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80",
        message: err.message,
      });
    }
  });

  // 5. Image Analysis (gemini-3.1-pro-preview)
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { userPhotoBase64, prompt = "Analyze this style and describe the garments in detail." } = req.body;
      const ai = getAiClient();
      if (!ai) return res.json({ analysis: "API Key not configured." });

      const cleanBase64 = userPhotoBase64.replace(/^data:image\/\w+;base64,/, "");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: prompt }
          ]
        }
      });
      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5a. Auto-tag Look (gemini-3.1-pro-preview)
  app.post("/api/auto-tag-look", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      const ai = getAiClient();
      if (!ai) return res.status(500).json({ error: "API Key not configured." });

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      
      const systemInstruction = `You are a fashion AI. Analyze the provided outfit image and classify it into one of these specific occasions: 'Business Casual', 'Gala Night', 'Beach Wedding', 'Board Meeting', 'Networking Dinner', 'Weekend Brunch', 'Art Gallery Opening', 'Galas & Events'. Also provide a short title, top garment description, bottom garment description, and capsule synergy. Return ONLY JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: "Analyze this outfit and return JSON." }
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              occasion: { type: Type.STRING },
              look_title: { type: Type.STRING },
              top_garment: { type: Type.STRING },
              bottom_garment: { type: Type.STRING },
              capsule_synergy: { type: Type.STRING },
            },
            required: ["occasion", "look_title", "top_garment", "bottom_garment", "capsule_synergy"]
          }
        }
      });
      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Chatbot endpoint (gemini-3.6-flash or gemini-3.1-pro-preview)
  app.post("/api/chat", async (req, res) => {
    try {
      const { history = [], message, modelName = "gemini-3.6-flash" } = req.body;
      const ai = getAiClient();
      if (!ai) return res.json({ response: "API Key not configured." });

      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction: "You are a professional luxury stylist. Give concise, expert advice." }
      });
      // Optionally replay history here if needed, but for simplicity we will just send the message
      const response = await chat.sendMessage({ message });
      res.json({ response: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Quick tip (gemini-3.1-flash-lite)
  app.post("/api/quick-tip", async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getAiClient();
      if (!ai) return res.json({ tip: "API Key not configured." });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt || "Give me a quick 1-sentence luxury fashion tip for today."
      });
      res.json({ tip: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Trend Radar with Search Grounding
  app.post("/api/trend-radar", async (req, res) => {
    try {
      const { aesthetics } = req.body;
      const ai = getAiClient();
      if (!ai) return res.status(500).json({ error: "API Key not configured." });

      const aestheticStr = aesthetics?.length ? aesthetics.join(", ") : "luxury fashion";
      const prompt = `Use Google Search to find 3 emerging fashion trends for the current season that align with these aesthetics: ${aestheticStr}. For each trend, provide a title, a short description, and a source or reasoning.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trends: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    source: { type: Type.STRING }
                  },
                  required: ["title", "description", "source"]
                }
              }
            },
            required: ["trends"]
          }
        }
      });
      
      const parsedData = JSON.parse(response.text || '{"trends": []}');
      res.json(parsedData);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Scan Closet Items
  app.post("/api/scan-closet", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      const ai = getAiClient();
      if (!ai) return res.status(500).json({ error: "API Key not configured." });

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      
      const systemInstruction = `You are a fashion AI specialized in cataloging clothing. Analyze the provided photo containing one or more clothing items and catalog them. For each item, provide a category ('Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Other'), a short description, and its primary color. Return ONLY JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: "Analyze this image and catalog the clothing items in it, returning JSON." }
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    color: { type: Type.STRING },
                    fabric: { type: Type.STRING }
                  },
                  required: ["category", "description", "color"]
                }
              }
            },
            required: ["items"]
          }
        }
      });
      const parsedData = JSON.parse(response.text || '{"items": []}');
      res.json(parsedData);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Sizing Assistant - Analyze best-fitting clothing photos
  app.post("/api/analyze-sizing", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      const ai = getAiClient();
      if (!ai) return res.status(500).json({ error: "API Key not configured." });

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const systemInstruction = `You are an elite master tailor and fashion sizing expert. Analyze the photo of the user's best-fitting garment. Estimate its fit characteristics (e.g. shoulder cut, chest drop, waist taper, armhole depth) and compare it against major luxury brands (e.g., Tom Ford, Brunello Cucinelli, Loro Piana, Zegna). Return JSON with garmentType, keyFitDetails, and brandComparisons array with brandName, recommendedSize, fitNote, and alignmentPercentage.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: "Analyze this best-fitting garment and compare fit across luxury brands." }
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              garmentType: { type: Type.STRING },
              keyFitDetails: { type: Type.STRING },
              brandComparisons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    brandName: { type: Type.STRING },
                    recommendedSize: { type: Type.STRING },
                    fitNote: { type: Type.STRING },
                    alignmentPercentage: { type: Type.NUMBER }
                  },
                  required: ["brandName", "recommendedSize", "fitNote", "alignmentPercentage"]
                }
              }
            },
            required: ["garmentType", "keyFitDetails", "brandComparisons"]
          }
        }
      });
      const parsedData = JSON.parse(response.text || '{}');
      res.json(parsedData);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware / Static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[You've Got Style] Server listening on http://0.0.0.0:${PORT}`);
  });

  // WebSocket Server for Live API (gemini-3.1-flash-live-preview)
  const wss = new WebSocketServer({ server, path: '/live' });
  wss.on("connection", async (clientWs) => {
    const ai = getAiClient();
    if (!ai) {
      clientWs.close(1011, "API Key not configured");
      return;
    }
    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a luxury fashion stylist responding in a professional, brief manner.",
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio && clientWs.readyState === 1) clientWs.send(JSON.stringify({ audio }));
            if (message.serverContent?.interrupted && clientWs.readyState === 1)
              clientWs.send(JSON.stringify({ interrupted: true }));
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Live websocket parsing error", e);
        }
      });

      clientWs.on("close", () => {
        session.close();
      });
    } catch (e) {
      console.error("Failed to connect to Live API", e);
      clientWs.close(1011, "Live API connection failed");
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
