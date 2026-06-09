import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/firebase/config";

// ---------------------------------------------------------------------------
// Follow graph.
//
// One doc per relationship at /follows/{followerId__followeeId} =
// { followerId, followeeId, createdAt }. A single collection (not paired
// following/followers subcollections) means a follow/unfollow is ONE write and
// the rules stay trivial: you may only create/delete a doc whose followerId is
// you. Counts come from count() aggregation queries; the "who do I follow" set
// for the feed comes from a live where(followerId == me) subscription.
// ---------------------------------------------------------------------------

// Firebase uids are URL-safe base64-ish and never contain "__", so this is a
// collision-free composite id.
export function followKey(followerId: string, followeeId: string): string {
  return `${followerId}__${followeeId}`;
}

function followsCol() {
  return collection(getDb(), "follows");
}
function followRef(followerId: string, followeeId: string) {
  return doc(getDb(), "follows", followKey(followerId, followeeId));
}

export async function isFollowing(
  followerId: string,
  followeeId: string,
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const snap = await getDoc(followRef(followerId, followeeId));
  return snap.exists();
}

// Live "am I following this person" — drives the follow button state so it
// reflects actions taken on another device/tab.
export function subscribeIsFollowing(
  followerId: string,
  followeeId: string,
  cb: (following: boolean) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    cb(false);
    return () => {};
  }
  return onSnapshot(
    followRef(followerId, followeeId),
    (snap) => cb(snap.exists()),
    () => cb(false),
  );
}

export async function follow(
  followerId: string,
  followeeId: string,
): Promise<void> {
  if (followerId === followeeId) return; // can't follow yourself
  await setDoc(followRef(followerId, followeeId), {
    followerId,
    followeeId,
    createdAt: serverTimestamp(),
  });
}

export async function unfollow(
  followerId: string,
  followeeId: string,
): Promise<void> {
  await deleteDoc(followRef(followerId, followeeId));
}

// Live set of uids the given user follows. Powers the 팔로잉 feed filter and
// updates instantly when you follow/unfollow someone.
export function subscribeFollowing(
  followerId: string,
  cb: (followeeIds: string[]) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    cb([]);
    return () => {};
  }
  const q = query(followsCol(), where("followerId", "==", followerId));
  return onSnapshot(
    q,
    (s) => cb(s.docs.map((d) => d.data().followeeId as string)),
    (err) => {
      console.error("[follow] subscribeFollowing error:", err);
      cb([]);
    },
  );
}

// One-shot: who follows me (for the record-post fan-out notification). Capped
// so a viral user doesn't trigger an unbounded write storm.
export async function getFollowerIds(
  followeeId: string,
  max = 200,
): Promise<string[]> {
  if (!isFirebaseConfigured()) return [];
  const { getDocs, limit } = await import("firebase/firestore");
  const q = query(
    followsCol(),
    where("followeeId", "==", followeeId),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().followerId as string);
}

export interface FollowCounts {
  followers: number;
  following: number;
}

// Aggregation counts. count() queries can't be subscribed live, so callers
// fetch once and refetch after a follow toggle.
export async function getFollowCounts(uid: string): Promise<FollowCounts> {
  if (!isFirebaseConfigured()) return { followers: 0, following: 0 };
  const [followersSnap, followingSnap] = await Promise.all([
    getCountFromServer(query(followsCol(), where("followeeId", "==", uid))),
    getCountFromServer(query(followsCol(), where("followerId", "==", uid))),
  ]);
  return {
    followers: followersSnap.data().count,
    following: followingSnap.data().count,
  };
}
