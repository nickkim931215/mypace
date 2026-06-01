import { NextResponse } from "next/server";

export const runtime = "nodejs";

// TEMPORARY diagnostic — reports presence/shape of env vars WITHOUT leaking
// their values. Delete after confirming the Gemini key is wired up.
function shape(v: string | undefined) {
  if (v == null) return { present: false };
  return {
    present: true,
    length: v.length,
    head: v.slice(0, 4),
    trimmedDiffers: v !== v.trim(),
  };
}

export async function GET() {
  return NextResponse.json({
    GOOGLE_GENERATIVE_AI_API_KEY: shape(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    GEMINI_API_KEY: shape(process.env.GEMINI_API_KEY),
    // which env keys even mention gemini/google (names only, never values)
    relatedKeys: Object.keys(process.env).filter((k) =>
      /GEMINI|GENERATIVE|GOOGLE/i.test(k),
    ),
  });
}
