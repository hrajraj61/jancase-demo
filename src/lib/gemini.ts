import type { AIAnalysis, ReportPayload, SentimentLabel } from "@/lib/types";

const GEMINI_MODEL = "gemini-2.5-flash";

export const FALLBACK_ANALYSIS: AIAnalysis = {
  category: "General",
  severity: 0.5,
  sentimentLabel: "neutral",
  sentimentScore: 0,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSentimentLabel(value: string): SentimentLabel {
  if (value === "angry" || value === "happy") {
    return value;
  }

  return "neutral";
}

function sanitizeAnalysis(value: Record<string, unknown>): AIAnalysis {
  return {
    category: typeof value.category === "string" && value.category.trim() ? value.category.trim() : "General",
    severity: clamp(Number(value.severity ?? 0.5), 0, 1),
    sentimentLabel: normalizeSentimentLabel(String(value.sentimentLabel ?? "neutral").toLowerCase()),
    sentimentScore: clamp(Number(value.sentimentScore ?? 0), -1, 1),
  };
}

function extractJsonObject(raw: string) {
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Gemini did not return JSON.");
  }

  return JSON.parse(match[0]) as Record<string, unknown>;
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeCivicIssue(payload: ReportPayload): Promise<AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return FALLBACK_ANALYSIS;
  }

  const prompt = [
    "Analyze this civic issue.",
    "",
    `Image URL: ${payload.imageUrl ?? "None"}`,
    `Description: ${payload.description ?? "None"}`,
    "",
    "Return JSON only in this exact shape:",
    '{"category":"Waste | Roads | Water | Electricity | Other","severity":0,"sentimentLabel":"angry | neutral | happy","sentimentScore":0}',
  ].join("\n");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Gemini response missing text.");
      }

      return sanitizeAnalysis(extractJsonObject(text));
    } catch (error) {
      if (attempt === 4) {
        console.error("Gemini analysis failed, using fallback.", error);
        return FALLBACK_ANALYSIS;
      }

      await wait(250 * 2 ** attempt);
    }
  }

  return FALLBACK_ANALYSIS;
}
