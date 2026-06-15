"use client";

import { Heart, MessageCircle, Trophy, Flame } from "lucide-react";
import type { CommunityPost } from "@/lib/types";
import { useProfileName } from "@/hooks/use-profile-name";
import { LevelName } from "@/components/community/level-name";
import { LevelBadge } from "@/components/community/level-badge";

export function RecordPostCard({
  post,
  onOpen,
}: {
  post: CommunityPost;
  onOpen: (id: string) => void;
}) {
  const record = post.record;
  const authorName = useProfileName(post.authorId, post.authorName);
  if (!record) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(post.id)}
      className="card-premium w-full text-left p-3 flex items-center gap-3 hover:border-border-strong transition-colors"
    >
      {/* Streak tile (stands in for the routine thumbnail) */}
      <div className="relative h-16 w-16 sm:h-[68px] sm:w-[68px] shrink-0 rounded-xl overflow-hidden bg-accent/12 flex flex-col items-center justify-center text-accent">
        <Flame size={18} className={record.streak > 0 ? "fill-accent/30" : undefined} />
        <span className="font-display text-[17px] font-semibold tracking-tight tabular-nums leading-none mt-1">
          {record.streak}
        </span>
        <span className="text-[9px] text-accent/80 mt-0.5">연속일</span>
      </div>

      {/* Summary */}
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <LevelName
            uid={post.authorId}
            name={authorName}
            className="text-[11px] font-medium text-foreground-muted truncate"
          />
          <LevelBadge uid={post.authorId} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-accent/12 text-accent text-[10px] font-medium shrink-0">
            <Trophy size={10} />
            기록
          </span>
          <h3 className="text-[14px] sm:text-[15px] font-semibold tracking-tight truncate">
            {post.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-foreground-dim">
          <span className="tabular-nums">{record.monthLabel}</span>
          <span>·</span>
          <span className="tabular-nums">이번 주 {record.weekCount}회</span>
          <span>·</span>
          <span className="tabular-nums">누적 {record.totalCount}회</span>
        </div>

        {post.description && (
          <p className="text-[12px] text-foreground-muted leading-snug line-clamp-1">
            {post.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="shrink-0 flex flex-col items-end gap-1 text-[11px] text-foreground-muted self-stretch justify-center">
        <span className="inline-flex items-center gap-1">
          <Heart size={12} />
          {post.likeCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle size={12} />
          {post.commentCount}
        </span>
      </div>
    </button>
  );
}
