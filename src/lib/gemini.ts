import type { AIAnalysis, ReportPayload, SentimentLabel } from "@/lib/types";

const GEMINI_MODEL = "gemini-2.5-flash";

export const FALLBACK_ANALYSIS: AIAnalysis = {
  category: "General",
  severity: 0.5,
  sentimentLabel: "neutral",
  sentimentScore: 0,
  summary: "Citizen issue requires review.",
  actionRequired: "Inspect the site and assign a municipal response team.",
  department: "Municipal Operations",
  priorityLabel: "Medium",
  visualSummary: "No reliable visual interpretation available.",
  confidence: 0.45,
  keySignals: ["manual review"],
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

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return FALLBACK_ANALYSIS.keySignals;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  return normalized.length > 0 ? normalized : FALLBACK_ANALYSIS.keySignals;
}

function sanitizeAnalysis(value: Record<string, unknown>): AIAnalysis {
  return {
    category: normalizeString(value.category, "General"),
    severity: clamp(Number(value.severity ?? 0.5), 0, 1),
    sentimentLabel: normalizeSentimentLabel(String(value.sentimentLabel ?? "neutral").toLowerCase()),
    sentimentScore: clamp(Number(value.sentimentScore ?? 0), -1, 1),
    summary: normalizeString(value.summary, FALLBACK_ANALYSIS.summary),
    actionRequired: normalizeString(value.actionRequired, FALLBACK_ANALYSIS.actionRequired),
    department: normalizeString(value.department, FALLBACK_ANALYSIS.department),
    priorityLabel: normalizeString(value.priorityLabel, FALLBACK_ANALYSIS.priorityLabel),
    visualSummary: normalizeString(value.visualSummary, FALLBACK_ANALYSIS.visualSummary),
    confidence: clamp(Number(value.confidence ?? FALLBACK_ANALYSIS.confidence), 0, 1),
    keySignals: normalizeStringArray(value.keySignals),
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
    "Analyze this civic complaint from Hazaribagh and infer from both the description and the image URL if available.",
    "",
    `Image URL: ${payload.imageUrl ?? "None"}`,
    `Description: ${payload.description ?? "None"}`,
    "",
    "Return JSON only in this exact shape:",
    '{"category":"Waste | Roads | Water | Electricity | Other | General","severity":0.5,"sentimentLabel":"angry | neutral | happy","sentimentScore":0,"summary":"short summary in under 14 words","actionRequired":"first municipal action","department":"owning team or department","priorityLabel":"High | Medium | Low","visualSummary":"what the image seems to show or lack","confidence":0.5,"keySignals":["signal 1","signal 2"]}',
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
