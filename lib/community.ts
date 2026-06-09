import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/firebase/config";
import { createNotification } from "@/lib/notifications";
import { getFollowerIds } from "@/lib/follow";
import type {
  CommunityPost,
  PostComment,
  RecordSnapshot,
  Routine,
} from "@/lib/types";

const POSTS = "posts";

function postsCol() {
  return collection(getDb(), POSTS);
}

function postDoc(id: string) {
  return doc(getDb(), POSTS, id);
}

function commentsCol(postId: string) {
  return collection(getDb(), POSTS, postId, "comments");
}

function likeDoc(postId: string, uid: string) {
  return doc(getDb(), POSTS, postId, "likes", uid);
}

export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Handles: youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/shorts/<id>,
  // youtube.com/embed/<id>.
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export function youtubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function fromDoc(snap: QueryDocumentSnapshot<DocumentData>): CommunityPost {
  const d = snap.data();
  return {
    id: snap.id,
    kind: d.kind === "record" ? "record" : "routine",
    authorId: d.authorId,
    authorName: d.authorName ?? "익명",
    authorPhotoURL: d.authorPhotoURL ?? null,
    title: d.title ?? "",
    description: d.description ?? "",
    youtubeUrl: d.youtubeUrl ?? null,
    youtubeId: d.youtubeId ?? null,
    bodyParts: Array.isArray(d.bodyParts) ? d.bodyParts : [],
    routine: d.routine ? (d.routine as Routine) : undefined,
    record: d.record ? (d.record as RecordSnapshot) : undefined,
    likeCount: typeof d.likeCount === "number" ? d.likeCount : 0,
    commentCount: typeof d.commentCount === "number" ? d.commentCount : 0,
    createdAt:
      typeof d.createdAt === "number"
        ? d.createdAt
        : d.createdAt?.toMillis?.() ?? 0,
  };
}

export function subscribePosts(
  onChange: (posts: CommunityPost[]) => void,
  onError?: (err: Error) => void,
  pageSize = 30,
): Unsubscribe {
  const q = query(postsCol(), orderBy("createdAt", "desc"), limit(pageSize));
  return onSnapshot(
    q,
    (s) => onChange(s.docs.map(fromDoc)),
    (err) => {
      console.error("[community] subscribePosts error:", err);
      onError?.(err);
    },
  );
}

export async function getPost(id: string): Promise<CommunityPost | null> {
  const s = await getDoc(postDoc(id));
  if (!s.exists()) return null;
  return fromDoc(s as QueryDocumentSnapshot<DocumentData>);
}

export interface CreatePostInput {
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  title: string;
  description: string;
  youtubeUrl: string | null;
  bodyParts: string[];
  routine: Routine;
}

export async function createPost(input: CreatePostInput): Promise<string> {
  const youtubeId = input.youtubeUrl
    ? extractYoutubeId(input.youtubeUrl)
    : null;
  const ref = await addDoc(postsCol(), {
    kind: "routine",
    authorId: input.authorId,
    authorName: input.authorName,
    authorPhotoURL: input.authorPhotoURL,
    title: input.title.trim(),
    description: input.description.trim(),
    youtubeUrl: input.youtubeUrl,
    youtubeId,
    bodyParts: input.bodyParts,
    routine: input.routine,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export interface CreateRecordPostInput {
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  title: string;
  description: string;
  record: RecordSnapshot;
}

// Share a workout-history snapshot ("brag") to the community. Uses the same
// /posts collection (so likes/comments/notifications all work unchanged); the
// create rule only checks authorId + zeroed counts, so no rules change needed.
export async function createRecordPost(
  input: CreateRecordPostInput,
): Promise<string> {
  const ref = await addDoc(postsCol(), {
    kind: "record",
    authorId: input.authorId,
    authorName: input.authorName,
    authorPhotoURL: input.authorPhotoURL,
    title: input.title.trim(),
    description: input.description.trim(),
    youtubeUrl: null,
    youtubeId: null,
    bodyParts: [],
    record: input.record,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  // Fire-and-forget: tell this user's followers they posted a workout record
  // ("OO님이 운동을 인증했어요"). Never let a notification failure surface to the
  // sharer — the post itself already succeeded.
  void notifyFollowersOfRecord(ref.id, input).catch(() => {});
  return ref.id;
}

async function notifyFollowersOfRecord(
  postId: string,
  input: CreateRecordPostInput,
): Promise<void> {
  const followerIds = await getFollowerIds(input.authorId);
  if (followerIds.length === 0) return;
  await Promise.allSettled(
    followerIds.map((recipientId) =>
      createNotification({
        recipientId,
        type: "post",
        postId,
        postTitle: input.title.trim(),
        actorId: input.authorId,
        actorName: input.authorName,
        actorPhotoURL: input.authorPhotoURL,
      }),
    ),
  );
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(postDoc(id));
}

export interface UpdatePostInput {
  title: string;
  description: string;
  youtubeUrl: string | null;
  bodyParts: string[];
}

// Author-only edit of the post's text/video/body-part fields. The routine
// itself isn't editable here — re-share if you want to change the workout.
// Firestore rules gate this to the post's author and to these keys only, so
// counts and authorId can't be touched through this path.
export async function updatePost(
  id: string,
  input: UpdatePostInput,
): Promise<void> {
  const youtubeId = input.youtubeUrl
    ? extractYoutubeId(input.youtubeUrl)
    : null;
  await updateDoc(postDoc(id), {
    title: input.title.trim(),
    description: input.description.trim(),
    youtubeUrl: input.youtubeUrl,
    youtubeId,
    bodyParts: input.bodyParts,
  });
}

// ── comments ──────────────────────────────────────────────────────────

function commentFromDoc(
  snap: QueryDocumentSnapshot<DocumentData>,
): PostComment {
  const d = snap.data();
  return {
    id: snap.id,
    authorId: d.authorId,
    authorName: d.authorName ?? "익명",
    authorPhotoURL: d.authorPhotoURL ?? null,
    text: d.text ?? "",
    parentId: d.parentId ?? null,
    createdAt:
      typeof d.createdAt === "number"
        ? d.createdAt
        : d.createdAt?.toMillis?.() ?? 0,
  };
}

export function subscribeComments(
  postId: string,
  onChange: (comments: PostComment[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(commentsCol(postId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (s) => onChange(s.docs.map(commentFromDoc)),
    (err) => {
      console.error("[community] subscribeComments error:", err);
      onError?.(err);
    },
  );
}

export interface AddCommentInput {
  postId: string;
  postTitle: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  // Set for a reply — the comment being replied to.
  parentId?: string | null;
  // Who to notify: the post author for a top-level comment, or the parent
  // comment's author for a reply. Skipped automatically if it equals authorId.
  recipientId: string;
}

export async function addComment(input: AddCommentInput): Promise<void> {
  const trimmed = input.text.trim();
  if (!trimmed) return;
  // Use a transaction so the post's commentCount stays consistent with
  // the actual number of comments visible in the feed cards.
  await runTransaction(getDb(), async (tx) => {
    const ref = doc(commentsCol(input.postId));
    tx.set(ref, {
      authorId: input.authorId,
      authorName: input.authorName,
      authorPhotoURL: input.authorPhotoURL,
      text: trimmed,
      parentId: input.parentId ?? null,
      createdAt: serverTimestamp(),
    });
    tx.update(postDoc(input.postId), { commentCount: increment(1) });
  });

  // Fire-and-forget notification to the post / parent-comment author.
  void createNotification({
    recipientId: input.recipientId,
    type: input.parentId ? "reply" : "comment",
    postId: input.postId,
    postTitle: input.postTitle,
    actorId: input.authorId,
    actorName: input.authorName,
    actorPhotoURL: input.authorPhotoURL,
    preview: trimmed,
  }).catch((e) => console.error("[community] comment notify failed:", e));
}

// Delete one comment and keep the post's commentCount in sync. Firestore rules
// only allow deleting a comment whose authorId matches the caller, so this is
// safe to expose to any signed-in user — non-authors just get permission-denied.
export async function deleteComment(
  postId: string,
  commentId: string,
): Promise<void> {
  await runTransaction(getDb(), async (tx) => {
    tx.delete(doc(commentsCol(postId), commentId));
    tx.update(postDoc(postId), { commentCount: increment(-1) });
  });
}

// ── likes ─────────────────────────────────────────────────────────────

export function subscribeMyLike(
  postId: string,
  uid: string,
  onChange: (liked: boolean) => void,
): Unsubscribe {
  return onSnapshot(
    likeDoc(postId, uid),
    (s) => onChange(s.exists()),
    (err) => console.error("[community] subscribeMyLike error:", err),
  );
}

export interface LikeNotifyMeta {
  postTitle: string;
  recipientId: string;
  actorName: string;
  actorPhotoURL: string | null;
}

export async function toggleLike(
  postId: string,
  uid: string,
  notify?: LikeNotifyMeta,
): Promise<void> {
  let didLike = false;
  await runTransaction(getDb(), async (tx) => {
    const ref = likeDoc(postId, uid);
    const snap = await tx.get(ref);
    if (snap.exists()) {
      tx.delete(ref);
      tx.update(postDoc(postId), { likeCount: increment(-1) });
      didLike = false;
    } else {
      tx.set(ref, { createdAt: serverTimestamp() });
      tx.update(postDoc(postId), { likeCount: increment(1) });
      didLike = true;
    }
  });

  // Only notify on a fresh like (not on unlike), fire-and-forget.
  if (didLike && notify) {
    void createNotification({
      recipientId: notify.recipientId,
      type: "like",
      postId,
      postTitle: notify.postTitle,
      actorId: uid,
      actorName: notify.actorName,
      actorPhotoURL: notify.actorPhotoURL,
    }).catch((e) => console.error("[community] like notify failed:", e));
  }
}

// Re-export so callers don't need to import setDoc directly when seeding.
export { setDoc };
