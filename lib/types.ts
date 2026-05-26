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
}

export interface CommunityPost {
  id: string;
  title: string;
  description: string;
  routineId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  likes: number;
  bookmarks: number;
  bodyParts: string[];
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
