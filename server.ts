import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { evaluateLook } from "./src/lib/guardrails";
import type { GarmentAttributes, StyleConstraints } from "./src/types";

dotenv.config();

// No __dirname here on purpose. The build bundles this file to CJS, where
// `import.meta` is empty, so `fileURLToPath(import.meta.url)` threw at module
// load and the production server never served a byte. Nothing used the value:
// the one path we construct is `path.join(process.cwd(), "dist")` below.

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
        } as StyleConstraints,
        userPrompt = "",
      } = req.body;

      const ATTRIBUTE_KEYS = [
        "hemline",
        "sleeveLength",
        "neckline",
        "opacity",
        "bottomCategory",
        "pattern",
      ] as const;

      function hasCompleteAttributes(value: unknown): value is GarmentAttributes {
        if (!value || typeof value !== "object") return false;
        const record = value as Record<string, unknown>;
        return ATTRIBUTE_KEYS.every((key) => typeof record[key] === "string");
      }

      // Worst-cased on purpose, not left unchecked. A candidate whose source
      // never stated its attributes gets none of the benefit of the doubt an
      // absent field would otherwise buy it — it fails every active hard
      // guardrail, exactly as a garment that stated them and failed honestly
      // would.
      const UNVERIFIABLE_ATTRIBUTES: GarmentAttributes = {
        hemline: "mini",
        sleeveLength: "sleeveless",
        neckline: "strapless",
        opacity: "sheer",
        bottomCategory: "trousers",
        pattern: "printed",
      };

      // The model's own "compliance_check" is a claim the same model that
      // wrote the garment copy also wrote — it is never trusted as the
      // gate. Every candidate look, model-generated or fallback, is read
      // against the guardrails the same way discovery reads it: from typed
      // attributes, never from parsing the garment description.
      const validate = (candidate: { attributes?: unknown }) =>
        evaluateLook(
          {
            attributes: hasCompleteAttributes(candidate.attributes)
              ? candidate.attributes
              : UNVERIFIABLE_ATTRIBUTES,
            colorPalette: [],
          },
          constraints,
        );

      const ai = getAiClient();

      if (!ai) {
        // Safe rich fallback if API key is not present or pending configuration.
        const fallback = {
          look_title: `${occasion} Executive Suite`,
          occasion,
          top_garment: "Modest Silk Crepe High-Neck Blouse with Fitted Cuffs",
          bottom_garment: constraints.noTrousers
            ? "Pleated Silk-Chiffon Ankle-Length Column Skirt"
            : "Structured Wool-Crepe Wide-Leg High-Waist Trousers",
          capsule_synergy: "Pairs elegantly with monochrome trench coats and cashmere shawls.",
          attributes: {
            hemline: "floor",
            sleeveLength: "long",
            neckline: "high",
            opacity: "opaque",
            bottomCategory: constraints.noTrousers ? "skirt" : "trousers",
            pattern: "solid",
          } as GarmentAttributes,
        };
        const fallbackCheck = validate(fallback);
        if (!fallbackCheck.passesHard) {
          return res.status(422).json({
            error: "Could not compose a look that honours your guardrails.",
            missed: fallbackCheck.hardMissed,
          });
        }
        return res.json(fallback);
      }

      const systemInstruction = `You are the backend intelligence for "You've Got Style," an elite AI styling assistant for time-poor professionals in the Middle East.

Your goal is to evaluate a user's measurements and their "Style Like You" constraints to generate highly curated, occasion-specific clothing recommendations.

BEHAVIORAL RULES:
1. Strict adherence to constraints: If a user specifies "modest wear" or "no trousers," or "sleeves below the elbow," you must NEVER recommend items that violate this.
2. Capsule mentality: Recommend items that can be mixed and matched with luxury staple wardrobes.
3. Premium quality: Focus on business-professional, smart-casual, and high-quality aesthetics (e.g. Chanel, Loro Piana, Khaite, Zimmermann).
4. Structural honesty: "attributes" is read by code to verify compliance, not by a person to enjoy — it must precisely and honestly describe the same garments named in top_garment/bottom_garment. A mismatch between the prose and the attributes is treated as a failure, not as flavour text.`;

      const buildPrompt = (retryNote?: string) => `User Height: ${heightCm}cm. Occasion: "${occasion}".
Constraints: Modest Wear = ${constraints.modestWear}, Sleeves Below Elbow = ${constraints.sleevesBelowElbow}, No Trousers = ${constraints.noTrousers}, Hemline Below Knee = ${constraints.hemlineBelowKnee}, No Neon = ${constraints.noNeonColors}, No Loud Prints = ${constraints.noLoudPrints}.${
        constraints.maxPriceAED !== undefined
          ? ` The customer prefers not to spend more than AED ${constraints.maxPriceAED}.`
          : ""
      }
Additional user request: "${userPrompt}".
Please generate a curated luxury look that complies 100% with these guardrails.${
        retryNote ? ` ${retryNote}` : ""
      }`;

      const responseSchema = {
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
          attributes: {
            type: Type.OBJECT,
            description:
              "Discrete structural facts about the garments — the fields guardrails are actually verified against. Every field is required and must agree with top_garment/bottom_garment.",
            properties: {
              hemline: {
                type: Type.STRING,
                enum: ["mini", "knee", "midi", "maxi", "floor"],
                description:
                  "Where the lowest edge of the outfit sits. Full-length trousers count as 'floor'.",
              },
              sleeveLength: {
                type: Type.STRING,
                enum: ["sleeveless", "short", "elbow", "three-quarter", "long"],
                description: "How far the sleeve extends down the arm.",
              },
              neckline: {
                type: Type.STRING,
                enum: ["high", "crew", "scoop", "v-neck", "plunge", "off-shoulder", "halter", "strapless"],
                description: "The neckline shape.",
              },
              opacity: {
                type: Type.STRING,
                enum: ["opaque", "semi-sheer", "sheer"],
                description: "Fabric opacity.",
              },
              bottomCategory: {
                type: Type.STRING,
                enum: ["trousers", "skirt", "dress", "jumpsuit"],
                description: "The garment category of the lower body / overall silhouette.",
              },
              pattern: {
                type: Type.STRING,
                enum: ["solid", "textured", "printed"],
                description: "Whether the fabric carries a visible print.",
              },
            },
            required: ["hemline", "sleeveLength", "neckline", "opacity", "bottomCategory", "pattern"],
          },
        },
        required: [
          "look_title",
          "occasion",
          "top_garment",
          "bottom_garment",
          "compliance_check",
          "attributes",
        ],
      };

      const generate = async (retryNote?: string) => {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: buildPrompt(retryNote),
          config: { systemInstruction, responseMimeType: "application/json", responseSchema },
        });
        return JSON.parse(response.text || "{}");
      };

      let parsedData = await generate();
      let check = validate(parsedData);

      // One retry, with the violated rules spelled out, gives the model a
      // real chance before this fails closed — but the retry's output is
      // held to exactly the same check, not waved through because it is a
      // second attempt.
      if (!check.passesHard) {
        parsedData = await generate(
          `The previous attempt broke these guardrails: ${check.hardMissed.join("; ")}. Regenerate a look that avoids all of them.`,
        );
        check = validate(parsedData);
      }

      if (!check.passesHard) {
        return res.status(422).json({
          error: "Could not compose a look that honours your guardrails.",
          missed: check.hardMissed,
        });
      }

      res.json(parsedData);
    } catch (err: any) {
      console.error("Style recommendation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate styling recommendation" });
    }
  });

  // 4. Digital Twin Virtual Try-On Image Generation ("Nano Banana")
  app.post("/api/generate-tryon", async (req, res) => {
    try {
      const {
        prompt = "Full body studio portrait of an elegant woman wearing luxury modest high-fashion attire",
        userPhotoBase64,
      } = req.body;

      const ai = getAiClient();

      if (!ai) {
        return res.json({
          success: false,
          error: "Try-on rendering is not configured (GEMINI_API_KEY missing).",
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
        model: "gemini-3.1-flash-image",
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K",
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
          success: false,
          error: "The model did not return an image.",
        });
      }
    } catch (err: any) {
      // err.message is not sent to the client — it can carry vendor/model
      // detail (YGS-6: no stack traces, no model names in user-facing
      // copy). It is still logged here for operators.
      console.error("Try-on generation error:", err);
      res.json({
        success: false,
        error: "Try-on generation failed.",
      });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[You've Got Style] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
