import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const envPath = path.join(process.cwd(), ".env");
const envText = fs.readFileSync(envPath, "utf8");
const duplicateKeys = new Map();

for (const rawLine of envText.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const eqIndex = line.indexOf("=");
  const key = line.slice(0, eqIndex).trim();
  duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  let value = line.slice(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

function summarizeDuplicates() {
  return [...duplicateKeys.entries()].filter(([, count]) => count > 1).map(([key, count]) => ({ key, count }));
}

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, message: "Missing GEMINI_API_KEY" };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply with JSON only: {\"status\":\"ok\"}" }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    },
  );

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    message: response.ok ? "Gemini key accepted request." : `Gemini request failed: ${text.slice(0, 300)}`,
  };
}

async function testDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { ok: false, message: "Missing DATABASE_URL" };
  }

  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRawUnsafe("SELECT 1 as ok");
    return { ok: true, message: `Database query succeeded: ${JSON.stringify(result)}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  } finally {
    await prisma.$disconnect();
  }
}

async function testSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    return { ok: false, message: "Missing Supabase URL or publishable key" };
  }

  const authResponse = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const authText = await authResponse.text();

  let storageSummary = "Storage endpoint not tested.";
  try {
    const storageResponse = await fetch(`${url}/storage/v1/bucket`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const storageText = await storageResponse.text();
    storageSummary = `Storage status ${storageResponse.status}: ${storageText.slice(0, 200)}`;
  } catch (error) {
    storageSummary = `Storage request failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    ok: authResponse.ok,
    status: authResponse.status,
    message: `Auth status ${authResponse.status}: ${authText.slice(0, 200)} | ${storageSummary}`,
  };
}

const results = {
  duplicates: summarizeDuplicates(),
  gemini: await testGemini(),
  database: await testDatabase(),
  supabase: await testSupabase(),
};

console.log(JSON.stringify(results, null, 2));
