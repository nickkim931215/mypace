"use client";

import Image from "next/image";
import { Heart, MessageCircle, Play } from "lucide-react";
import type { CommunityPost } from "@/lib/types";
import { youtubeThumbnail } from "@/lib/community";
import { formatDuration } from "@/lib/utils";

export function PostCard({
  post,
  onOpen,
}: {
  post: CommunityPost;
  onOpen: (id: string) => void;
}) {
  const totalSec = post.routine.totalDurationSec * post.routine.repeat;
  const workRounds = post.routine.rounds.filter((r) => r.type === "work").length;
  return (
    <button
      type="button"
      onClick={() => onOpen(post.id)}
      className="card-premium overflow-hidden text-left flex flex-col hover:border-border-strong transition-colors"
    >
      <div className="relative aspect-video bg-surface-2">
        {post.youtubeId ? (
          <>
            <Image
              src={youtubeThumbnail(post.youtubeId)}
              alt=""
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
              unoptimized
            />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 h-6 rounded-full bg-black/70 backdrop-blur text-[11px]">
              <Play size={10} className="text-accent fill-accent" />
              YouTube
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground-dim">
                Routine
              </span>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight px-4 line-clamp-2">
                {post.routine.name}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <Avatar
            photo={post.authorPhotoURL}
            name={post.authorName}
            size={24}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate">{post.authorName}</p>
            <p className="text-[11px] text-foreground-dim">
              {formatRelative(post.createdAt)}
            </p>
          </div>
        </div>

        <h3 className="font-display text-[16px] font-semibold tracking-tight line-clamp-2">
          {post.title}
        </h3>

        {post.description && (
          <p className="text-[13px] text-foreground-muted leading-relaxed line-clamp-2">
            {post.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-foreground-dim">
          <span>{workRounds}개 라운드</span>
          <span>·</span>
          <span>{formatDuration(totalSec)}</span>
        </div>

        <div className="flex items-center gap-4 text-[12px] text-foreground-muted mt-auto pt-1">
          <span className="inline-flex items-center gap-1">
            <Heart size={13} />
            {post.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={13} />
            {post.commentCount}
          </span>
        </div>
      </div>
    </button>
  );
}

function Avatar({
  photo,
  name,
  size,
}: {
  photo: string | null;
  name: string;
  size: number;
}) {
  if (photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        unoptimized
      />
    );
  }
  return (
    <span
      className="rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-semibold shrink-0"
      style={{ width: size, height: size }}
    >
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

function formatRelative(ts: number): string {
  if (!ts) return "방금";
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}
