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
