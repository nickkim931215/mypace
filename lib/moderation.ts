import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/firebase/config";

// ---------------------------------------------------------------------------
// UGC moderation: reporting + blocking.
//
// Required by Google Play's User-Generated Content policy — any app where users
// can post / comment must let other users (a) report objectionable content and
// (b) block the people who post it.
//
//  • Reports  → /reports/{autoId}, write-only from clients. Reviewed by the app
//               owner in the Firebase console (there's no in-app admin role).
//  • Blocks   → /users/{uid}/blocks/{blockedUid}, private to the owner. The
//               block is enforced client-side: blocked authors' posts/comments
//               are filtered out of the feed, threads, and search.
// ---------------------------------------------------------------------------

export type ReportTargetType = "post" | "comment" | "user";

export type ReportReason =
  | "spam"
  | "harassment"
  | "sexual"
  | "violence"
  | "misinfo"
  | "other";

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: "spam", label: "스팸 / 광고" },
  { key: "harassment", label: "괴롭힘 / 혐오 발언" },
  { key: "sexual", label: "음란물 / 선정성" },
  { key: "violence", label: "폭력 / 위험한 행동" },
  { key: "misinfo", label: "허위 정보" },
  { key: "other", label: "기타" },
];

export interface SubmitReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  // The reported content's author (or the reported user themself), for the
  // reviewer's convenience. Null when unknown.
  authorId: string | null;
  // Parent post id when reporting a comment, for context. Omitted otherwise.
  postId?: string | null;
  reason: ReportReason;
  detail?: string;
}

export async function submitReport(input: SubmitReportInput): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await addDoc(collection(getDb(), "reports"), {
    reporterId: input.reporterId,
    targetType: input.targetType,
    targetId: input.targetId,
    authorId: input.authorId ?? null,
    postId: input.postId ?? null,
    reason: input.reason,
    detail: (input.detail ?? "").trim().slice(0, 500),
    status: "open",
    createdAt: serverTimestamp(),
  });
}

// ── blocks ────────────────────────────────────────────────────────────────

function blockRef(myUid: string, blockedUid: string) {
  return doc(getDb(), "users", myUid, "blocks", blockedUid);
}

export async function blockUser(
  myUid: string,
  blockedUid: string,
): Promise<void> {
  if (myUid === blockedUid) return; // can't block yourself
  await setDoc(blockRef(myUid, blockedUid), { createdAt: serverTimestamp() });
}

export async function unblockUser(
  myUid: string,
  blockedUid: string,
): Promise<void> {
  await deleteDoc(blockRef(myUid, blockedUid));
}

// Live set of uids the given user has blocked. Doc id IS the blocked uid, so the
// id list is the blocklist — no field reads needed.
export function subscribeBlockedIds(
  myUid: string,
  cb: (ids: string[]) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    collection(getDb(), "users", myUid, "blocks"),
    (s) => cb(s.docs.map((d) => d.id)),
    (err) => {
      console.error("[moderation] subscribeBlockedIds error:", err);
      cb([]);
    },
  );
}
