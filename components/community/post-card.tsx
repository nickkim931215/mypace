"use client";

import Image from "next/image";
import { Heart, MessageCircle, Play, Dumbbell } from "lucide-react";
import type { CommunityPost } from "@/lib/types";
import { youtubeThumbnail } from "@/lib/community";
import { BODY_PART_LABEL, type BodyPart } from "@/lib/ai-recommend";
import { formatDuration } from "@/lib/utils";
import { useProfileName } from "@/hooks/use-profile-name";
import { LevelName } from "@/components/community/level-name";
import { LevelBadge } from "@/components/community/level-badge";
import { useLocale } from "@/lib/i18n";

export function PostCard({
  post,
  onOpen,
}: {
  post: CommunityPost;
  onOpen: (id: string) => void;
}) {
  const { locale } = useLocale();
  const routine = post.routine;
  const totalSec = routine ? routine.totalDurationSec * routine.repeat : 0;
  const workRounds =
    routine?.rounds.filter((r) => r.type === "work").length ?? 0;
  const authorName = useProfileName(post.authorId, post.authorName);

  return (
    <button
      type="button"
      onClick={() => onOpen(post.id)}
      className="card-premium w-full text-left p-3 flex items-center gap-3 hover:border-border-strong transition-colors"
    >
      {/* Thumbnail / icon */}
      <div className="relative h-16 w-16 sm:h-[68px] sm:w-[68px] shrink-0 rounded-xl overflow-hidden bg-surface-2">
        {post.youtubeId ? (
          <>
            <Image
              src={youtubeThumbnail(post.youtubeId)}
              alt=""
              fill
              sizes="68px"
              className="object-cover"
              unoptimized
            />
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-black/70 backdrop-blur flex items-center justify-center">
              <Play size={8} className="text-accent fill-accent" />
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-foreground-dim">
            <Dumbbell size={20} />
          </div>
        )}
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

        <h3 className="text-[14px] sm:text-[15px] font-semibold tracking-tight truncate">
          {post.title}
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-foreground-dim">
          {post.bodyParts.slice(0, 3).map((p) => (
            <span
              key={p}
              className="inline-flex items-center h-5 px-2 rounded-full bg-accent/12 text-accent font-medium"
            >
              {BODY_PART_LABEL[p as BodyPart] ?? p}
            </span>
          ))}
          <span className="tabular-nums">{formatDuration(totalSec, locale)}</span>
          <span>·</span>
          <span>
            {locale === "en"
              ? `${workRounds} ${workRounds === 1 ? "round" : "rounds"}`
              : `${workRounds}라운드`}
          </span>
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
