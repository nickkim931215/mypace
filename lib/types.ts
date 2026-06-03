export type RoundType = "work" | "rest" | "prepare";

export interface Round {
  id: string;
  name: string;
  type: RoundType;
  durationSec: number;
  bpm?: number;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  rounds: Round[];
  repeat: number;
  totalDurationSec: number;
  createdAt: number;
  updatedAt: number;
  authorId?: string;
  isPublic?: boolean;
  tags?: string[];
  // User's own star rating for this routine (1–5), set after completing a run.
  rating?: number;
  // How many times this routine's run finished, and when last completed.
  completedCount?: number;
  lastCompletedAt?: number;
}

// One private "I finished this routine" event. Append-only log per user;
// powers the date-based history calendar + streak. Synced inside the user doc.
export interface WorkoutCompletion {
  id: string;
  routineId: string;
  routineName: string;
  completedAt: number; // ms epoch
  durationSec: number; // planned total for the routine (rounds × repeat)
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  title: string;
  description: string;
  youtubeUrl: string | null;
  // Stored alongside youtubeUrl for fast thumb/embed rendering without re-parsing on the client.
  youtubeId: string | null;
  // Target body parts (BodyPart keys, e.g. "core"/"legs"). Optional — older
  // posts predate this field. Powers the compact card summary.
  bodyParts: string[];
  routine: Routine;
  likeCount: number;
  commentCount: number;
  createdAt: number;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  // null/absent = top-level comment; otherwise the id of the comment this is a
  // reply to (one level of threading).
  parentId: string | null;
  createdAt: number;
}

// In-app notification delivered to a post/comment author when someone interacts
// with their content. Stored at /users/{recipientUid}/notifications/{id}.
export type NotificationType = "like" | "comment" | "reply";

export interface AppNotification {
  id: string;
  type: NotificationType;
  postId: string;
  postTitle: string;
  actorId: string;
  actorName: string;
  actorPhotoURL: string | null;
  // Comment/reply body preview ("" for likes).
  preview: string;
  read: boolean;
  createdAt: number;
}

export interface AdBanner {
  slot: 1 | 2 | 3 | 4;
  active: boolean;
  youtubeUrl?: string;
  channelName?: string;
  thumbnailUrl?: string;
  advertiserId?: string;
  startsAt?: number;
  endsAt?: number;
}
