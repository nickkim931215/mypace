import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  BODY_PART_LABEL,
  EQUIPMENT_LABEL,
  INTENSITY_LABEL,
  buildPrompt,
  mockRecommendation,
  parseRecommendation,
  type RecommendInput,
} from "@/lib/ai-recommend";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let input: RecommendInput;
  try {
    input = (await req.json()) as RecommendInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate presence, types, AND enum membership. The downstream
  // mockRecommendation/buildPrompt index label maps by these values, so an
  // unknown key (e.g. a raw Korean label) would crash the function with a
  // bare 500 instead of falling back gracefully. Reject early with a 400.
  if (
    !input?.bodyPart ||
    !input?.intensity ||
    !Array.isArray(input?.equipment) ||
    !Number.isFinite(input?.minutes) ||
    !(input.bodyPart in BODY_PART_LABEL) ||
    !(input.intensity in INTENSITY_LABEL) ||
    !input.equipment.every((e) => e in EQUIPMENT_LABEL)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  // No key → return mock so the UI flow still works end-to-end.
  if (!apiKey) {
    const mock = mockRecommendation(input);
    return NextResponse.json(mock);
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(input);

  // gemini-2.5-flash intermittently returns 503 UNAVAILABLE ("high demand") or
  // 429 RESOURCE_EXHAUSTED. These are transient server-side overloads, not key
  // errors — retry a few times with exponential backoff + jitter before giving
  // up and falling back to mock. Non-transient errors break out immediately.
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });
      const text = response.text ?? "";
      const result = parseRecommendation(text, input);
      return NextResponse.json(result);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const transient = /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(msg);
      if (!transient || attempt === MAX_ATTEMPTS) break;
      // ~400ms, ~800ms backoff with a little jitter to avoid thundering herd
      const delay = 400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  console.error("[recommend] Gemini call failed:", lastErr);
  // Graceful fallback to mock so the user still gets something
  const fallback = mockRecommendation(input);
  return NextResponse.json({
    ...fallback,
    source: "mock" as const,
    _error: lastErr instanceof Error ? lastErr.message : "AI 호출 실패",
  });
}
