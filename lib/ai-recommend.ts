import type { Round } from "@/lib/types";

export type BodyPart =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "legs"
  | "full";

export type Intensity = "easy" | "medium" | "hard";

export type Equipment = "bodyweight" | "dumbbell" | "mat";

export interface RecommendInput {
  bodyPart: BodyPart;
  minutes: number;
  intensity: Intensity;
  equipment: Equipment[];
}

export interface RecommendResult {
  name: string;
  description: string;
  rounds: Round[];
  source: "ai" | "mock";
}

export const BODY_PART_LABEL: Record<BodyPart, string> = {
  chest: "가슴",
  back: "등",
  shoulders: "어깨",
  arms: "팔",
  core: "복부",
  legs: "하체",
  full: "전신",
};

export const INTENSITY_LABEL: Record<Intensity, string> = {
  easy: "초급",
  medium: "중급",
  hard: "고급",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  bodyweight: "맨몸",
  dumbbell: "덤벨",
  mat: "매트",
};

/** Prompt fed to Gemini. Forces strict JSON output. */
export function buildPrompt(input: RecommendInput) {
  const part = BODY_PART_LABEL[input.bodyPart];
  const intensity = INTENSITY_LABEL[input.intensity];
  const equipment = input.equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ");
  const totalSec = input.minutes * 60;
  const workSec =
    input.intensity === "easy" ? 30 : input.intensity === "medium" ? 40 : 45;
  return `당신은 전문 피트니스 트레이너입니다. 다음 조건에 맞는 홈 인터벌 운동 루틴을 만들어 주세요.

목표 부위: ${part}
총 시간: 약 ${input.minutes}분 (${totalSec}초, ±15초 허용)
강도: ${intensity}
보유 기구: ${equipment || "없음"}

설계 규칙:
- 첫 라운드는 "준비" (type: "prepare"), 10초 정적 워밍업.
- 이후 운동(work) 라운드와 휴식(rest) 라운드를 번갈아 배치.
- work 라운드 기본 길이: ${workSec}초.
- rest 라운드 길이: 15~25초.
- 동일 운동 이름 반복 가능. 하지만 다양성 있게 4~7가지 동작 사용.
- 점프/러닝/유산소 동작은 bpm 120~160. 코어/플랭크/스트레칭은 bpm 80~100. 정적 보유 동작은 bpm null.
- 운동 이름은 한국어 자연어로 (예: "버피", "마운틴 클라이머", "덤벨 컬"). 영어 그대로 쓰지 말 것.
- 합계가 ${totalSec}초에 최대한 가깝게.
- 보유 기구가 "맨몸"만이면 덤벨 등 다른 기구를 요구하는 동작은 넣지 말 것.

응답 형식 (이외 텍스트 없이 JSON만 출력):
{
  "name": "루틴 이름 (한국어, 18자 이내)",
  "description": "한 줄 설명 (한국어, 50자 이내)",
  "rounds": [
    { "name": "운동 이름", "type": "prepare" | "work" | "rest", "durationSec": 숫자, "bpm": 숫자 또는 null }
  ]
}`;
}

/** Deterministic, hand-crafted fallback when Gemini is not configured or fails. */
export function mockRecommendation(input: RecommendInput): RecommendResult {
  const uid = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const workSec =
    input.intensity === "easy" ? 30 : input.intensity === "medium" ? 40 : 45;
  const restSec = input.intensity === "easy" ? 25 : 20;

  const exercises: Record<BodyPart, { name: string; bpm: number | null }[]> = {
    chest: [
      { name: "푸쉬업", bpm: 110 },
      { name: "다이아몬드 푸쉬업", bpm: 95 },
      { name: "인클라인 푸쉬업", bpm: 100 },
      { name: "체스트 플라이 (덤벨)", bpm: 90 },
    ],
    back: [
      { name: "슈퍼맨", bpm: 90 },
      { name: "리버스 스노우엔젤", bpm: 80 },
      { name: "원암 로우 (덤벨)", bpm: 90 },
      { name: "Y-T-W 레이즈", bpm: 80 },
    ],
    shoulders: [
      { name: "파이크 푸쉬업", bpm: 95 },
      { name: "사이드 레터럴 (덤벨)", bpm: 95 },
      { name: "숄더 탭", bpm: 110 },
      { name: "프론트 레이즈", bpm: 90 },
    ],
    arms: [
      { name: "다이아몬드 푸쉬업", bpm: 95 },
      { name: "트라이셉 딥", bpm: 100 },
      { name: "덤벨 컬", bpm: 90 },
      { name: "해머 컬", bpm: 90 },
    ],
    core: [
      { name: "플랭크", bpm: 80 },
      { name: "크런치", bpm: 85 },
      { name: "마운틴 클라이머", bpm: 140 },
      { name: "사이드 플랭크", bpm: 80 },
      { name: "레그 레이즈", bpm: 90 },
    ],
    legs: [
      { name: "스쿼트", bpm: 100 },
      { name: "런지", bpm: 95 },
      { name: "점프 스쿼트", bpm: 140 },
      { name: "글루트 브릿지", bpm: 90 },
      { name: "카프 레이즈", bpm: 110 },
    ],
    full: [
      { name: "버피", bpm: 130 },
      { name: "마운틴 클라이머", bpm: 140 },
      { name: "점프 스쿼트", bpm: 140 },
      { name: "푸쉬업", bpm: 110 },
      { name: "플랭크", bpm: 80 },
      { name: "런지", bpm: 95 },
    ],
  };

  // Filter by equipment
  const pool = exercises[input.bodyPart].filter((e) => {
    if (e.name.includes("덤벨") && !input.equipment.includes("dumbbell")) return false;
    return true;
  });

  const totalSec = input.minutes * 60;
  const rounds: Round[] = [
    { id: uid(), name: "준비", type: "prepare", durationSec: 10 },
  ];
  let used = 10;
  let i = 0;
  while (used < totalSec - 10) {
    const ex = pool[i % pool.length];
    const wDur = Math.min(workSec, totalSec - used);
    if (wDur < 15) break;
    rounds.push({
      id: uid(),
      name: ex.name,
      type: "work",
      durationSec: wDur,
      bpm: ex.bpm ?? undefined,
    });
    used += wDur;
    if (used >= totalSec - 5) break;
    const rDur = Math.min(restSec, totalSec - used);
    if (rDur < 10) break;
    rounds.push({
      id: uid(),
      name: "휴식",
      type: "rest",
      durationSec: rDur,
    });
    used += rDur;
    i++;
  }

  return {
    name: `${BODY_PART_LABEL[input.bodyPart]} ${input.minutes}분 (${INTENSITY_LABEL[input.intensity]})`,
    description: `${BODY_PART_LABEL[input.bodyPart]} 부위 집중 인터벌. AI 추천 데모 모드.`,
    rounds,
    source: "mock",
  };
}

/** Parse Gemini's JSON response into our Round[] shape. */
export function parseRecommendation(
  text: string,
  input: RecommendInput,
): RecommendResult {
  const uid = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  // Strip code fences if Gemini added them
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  // Heuristic: extract JSON object substring
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1) cleaned = cleaned.slice(first, last + 1);

  const parsed = JSON.parse(cleaned) as {
    name: string;
    description: string;
    rounds: {
      name: string;
      type: "work" | "rest" | "prepare";
      durationSec: number;
      bpm?: number | null;
    }[];
  };

  if (!Array.isArray(parsed.rounds) || parsed.rounds.length === 0) {
    throw new Error("Invalid response: no rounds");
  }

  return {
    name: String(parsed.name ?? `${BODY_PART_LABEL[input.bodyPart]} 추천`).slice(0, 24),
    description: String(parsed.description ?? "").slice(0, 80),
    rounds: parsed.rounds.map((r) => ({
      id: uid(),
      name: String(r.name).slice(0, 24),
      type: r.type === "rest" || r.type === "prepare" ? r.type : "work",
      durationSec: Math.max(5, Math.min(600, Math.floor(Number(r.durationSec) || 30))),
      bpm:
        r.bpm == null
          ? undefined
          : Math.max(40, Math.min(220, Math.floor(Number(r.bpm)))),
    })),
    source: "ai",
  };
}
