import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/firebase/config";

// ---------------------------------------------------------------------------
// Public, cross-user profile.
//
// `authorName` is snapshot-copied onto each post/comment/notification at write
// time, but that snapshot goes stale the moment someone renames. So display
// names are looked up LIVE from /profiles/{uid} at render time (see
// hooks/use-profile-name), with the stored snapshot only used as a fallback
// while the profile doc loads / for un-seeded legacy authors.
//
// Nicknames are unique. We can't enforce that on a field directly in Firestore,
// so we use a /usernames/{key} registry where the doc id IS the (normalized)
// nickname. Claiming a name = creating that doc; Firestore's create rule only
// fires when the doc doesn't already exist, which makes the claim atomic even
// under a race. See firestore.rules.
// ---------------------------------------------------------------------------

export interface Profile {
  uid: string;
  nickname: string;
  nicknameLower: string; // == nicknameKey(nickname); mirrors the /usernames doc id
  photoURL: string | null;
  updatedAt: number;
  // Public gamified level (1..6), mirrored from the user's private workout
  // count so it can show next to their nickname in the community. Optional —
  // legacy/unseeded profiles read as "no level yet" (treated as level 1).
  level?: number;
}

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 16;

// Letters (incl. Korean), digits, spaces, _ . - — and nothing that would break
// a Firestore doc id ("/") or look like whitespace padding.
const NICKNAME_RE =
  /^[가-힣㄰-㆏ a-zA-Z0-9_.\-]+$/;

export class NicknameTakenError extends Error {
  constructor() {
    super("이미 사용 중인 닉네임이에요.");
    this.name = "NicknameTakenError";
  }
}

export class NicknameInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NicknameInvalidError";
  }
}

// Display form: trimmed, inner whitespace collapsed to single spaces.
export function cleanNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

// Uniqueness key: case-insensitive, whitespace-insensitive. "Nick Kim",
// "nick  kim" and "NICKKIM" all collide — that's intentional.
export function nicknameKey(nickname: string): string {
  return cleanNickname(nickname).toLowerCase().replace(/\s+/g, "");
}

// Throws NicknameInvalidError with a Korean message if not acceptable.
export function assertValidNickname(nickname: string): void {
  const clean = cleanNickname(nickname);
  if (clean.length < NICKNAME_MIN) {
    throw new NicknameInvalidError(`닉네임은 ${NICKNAME_MIN}자 이상이어야 해요.`);
  }
  if (clean.length > NICKNAME_MAX) {
    throw new NicknameInvalidError(`닉네임은 ${NICKNAME_MAX}자 이하여야 해요.`);
  }
  if (!NICKNAME_RE.test(clean)) {
    throw new NicknameInvalidError(
      "한글·영문·숫자와 _ . - 만 사용할 수 있어요.",
    );
  }
}

function profileRef(uid: string) {
  return doc(getDb(), "profiles", uid);
}
function usernameRef(key: string) {
  return doc(getDb(), "usernames", key);
}

export async function getProfile(uid: string): Promise<Profile | null> {
  if (!isFirebaseConfigured()) return null;
  const snap = await getDoc(profileRef(uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

// Live subscription to one user's profile. Returns an unsubscribe fn.
export function subscribeProfile(
  uid: string,
  cb: (profile: Profile | null) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    profileRef(uid),
    (snap) => cb(snap.exists() ? (snap.data() as Profile) : null),
    () => cb(null),
  );
}

// Is `nickname` free for `uid` to take? (Their own current name reads as free.)
export async function isNicknameAvailable(
  nickname: string,
  uid: string,
): Promise<boolean> {
  const key = nicknameKey(nickname);
  const snap = await getDoc(usernameRef(key));
  return !snap.exists() || snap.data().uid === uid;
}

// Strip a raw display name down to allowed nickname chars, for seeding from a
// Google account name / email. Falls back to "사용자" if nothing survives.
function deriveBase(raw: string | null | undefined): string {
  const cleaned = cleanNickname(raw ?? "")
    .split("")
    .filter((ch) => NICKNAME_RE.test(ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  const base = cleaned.slice(0, NICKNAME_MAX);
  return base.length >= NICKNAME_MIN ? base : "사용자";
}

// Build the i-th candidate ("민수", "민수2", "민수3", …) keeping it ≤ MAX.
function candidateAt(base: string, i: number): string {
  if (i === 0) return base;
  const suffix = String(i + 1);
  const room = NICKNAME_MAX - suffix.length;
  return `${base.slice(0, room)}${suffix}`;
}

// Dedupes concurrent/repeat ensureProfile calls for the same uid within a
// session — onAuthStateChanged can fire more than once, and two seed
// transactions racing would double-claim usernames.
const ensureInFlight = new Map<string, Promise<string | null>>();

// Ensure /profiles/{uid} exists, seeding a UNIQUE nickname from the Google
// display name on first sign-in. No-op if already seeded. Safe to call on every
// sign-in. Returns the profile's nickname.
export function ensureProfile(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Promise<string | null> {
  const pending = ensureInFlight.get(user.uid);
  if (pending) return pending;
  const run = ensureProfileInner(user).finally(() => {
    ensureInFlight.delete(user.uid);
  });
  ensureInFlight.set(user.uid, run);
  return run;
}

async function ensureProfileInner(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  const existing = await getDoc(profileRef(user.uid));
  if (existing.exists()) return (existing.data() as Profile).nickname;

  const base = deriveBase(user.displayName ?? user.email?.split("@")[0]);
  const db = getDb();

  for (let i = 0; i < 60; i++) {
    const candidate = candidateAt(base, i);
    const key = nicknameKey(candidate);
    try {
      await runTransaction(db, async (tx) => {
        const taken = await tx.get(usernameRef(key));
        if (taken.exists()) {
          // Someone else holds it → try the next candidate. If WE already hold
          // it (a prior partial seed), reuse it — don't re-set (that's an
          // update, which the rules forbid).
          if (taken.data().uid !== user.uid) throw new NicknameTakenError();
        } else {
          tx.set(usernameRef(key), { uid: user.uid });
        }
        tx.set(profileRef(user.uid), {
          uid: user.uid,
          nickname: candidate,
          nicknameLower: key,
          photoURL: user.photoURL ?? null,
          updatedAt: Date.now(),
        } satisfies Profile);
      });
      return candidate;
    } catch (err) {
      if (err instanceof NicknameTakenError) continue; // collision → try next
      throw err;
    }
  }
  // Pathological fallback: suffix with a slice of the uid (always unique).
  const fallback = `${base.slice(0, 10)}_${user.uid.slice(0, 5)}`;
  const key = nicknameKey(fallback);
  await runTransaction(db, async (tx) => {
    tx.set(usernameRef(key), { uid: user.uid });
    tx.set(profileRef(user.uid), {
      uid: user.uid,
      nickname: fallback,
      nicknameLower: key,
      photoURL: user.photoURL ?? null,
      updatedAt: Date.now(),
    } satisfies Profile);
  });
  return fallback;
}

// Change a user's nickname. Atomically: verifies the new key is free, claims
// it, releases the old one, and updates the profile. Throws NicknameTakenError
// if someone else holds it, or NicknameInvalidError if malformed.
export async function setNickname(uid: string, raw: string): Promise<string> {
  assertValidNickname(raw);
  const nickname = cleanNickname(raw);
  const key = nicknameKey(nickname);
  const db = getDb();

  await runTransaction(db, async (tx) => {
    const prof = await tx.get(profileRef(uid));
    const oldKey = prof.exists()
      ? (prof.data() as Profile).nicknameLower
      : null;
    const photoURL = prof.exists()
      ? ((prof.data() as Profile).photoURL ?? null)
      : null;
    // Carry the level forward — this full-doc set would otherwise wipe it.
    const level = prof.exists() ? (prof.data() as Profile).level : undefined;

    // Same key (e.g. only changed casing/spacing) — no registry swap needed.
    if (oldKey === key) {
      tx.set(profileRef(uid), {
        uid,
        nickname,
        nicknameLower: key,
        photoURL,
        updatedAt: Date.now(),
        ...(level !== undefined ? { level } : {}),
      } satisfies Profile);
      return;
    }

    const taken = await tx.get(usernameRef(key));
    if (taken.exists() && taken.data().uid !== uid) {
      throw new NicknameTakenError();
    }

    tx.set(usernameRef(key), { uid });
    if (oldKey) tx.delete(usernameRef(oldKey));
    tx.set(profileRef(uid), {
      uid,
      nickname,
      nicknameLower: key,
      photoURL,
      updatedAt: Date.now(),
      ...(level !== undefined ? { level } : {}),
    } satisfies Profile);
  });

  return nickname;
}

// Best-effort: mirror the user's current level (1..6) onto their PUBLIC profile
// so it can show next to their nickname in the community. Only patches the
// `level` field of an existing profile — never creates the doc (that would skip
// the unique-nickname seeding in ensureProfile). Silently no-ops if the profile
// isn't seeded yet or we're offline; the next workout will retry.
export async function syncProfileLevel(
  uid: string,
  level: number,
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  try {
    await updateDoc(profileRef(uid), { level });
    return true;
  } catch {
    /* profile not seeded yet / offline — retried on the next level change */
    return false;
  }
}
