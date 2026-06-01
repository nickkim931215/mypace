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

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(input);
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
    console.error("[recommend] Gemini call failed:", err);
    // Graceful fallback to mock so the user still gets something
    const fallback = mockRecommendation(input);
    return NextResponse.json({
      ...fallback,
      source: "mock" as const,
      _error: err instanceof Error ? err.message : "AI 호출 실패",
    });
  }
}
