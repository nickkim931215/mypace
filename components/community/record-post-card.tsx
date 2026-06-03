"use client";

import Image from "next/image";
import { Heart, MessageCircle, Trophy } from "lucide-react";
import type { CommunityPost } from "@/lib/types";
import { RecordCalendarCard } from "./record-calendar-card";

export function RecordPostCard({
  post,
  onOpen,
}: {
  post: CommunityPost;
  onOpen: (id: string) => void;
}) {
  if (!post.record) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(post.id)}
      className="card-premium w-full text-left p-4 flex flex-col gap-3 hover:border-border-strong transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Avatar photo={post.authorPhotoURL} name={post.authorName} size={28} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium truncate">{post.authorName}</p>
          <p className="text-[11px] text-foreground-dim">
            {formatRelative(post.createdAt)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-accent/12 text-accent text-[11px] font-medium shrink-0">
          <Trophy size={11} />
          기록
        </span>
      </div>

      <h3 className="font-display text-[16px] font-semibold tracking-tight line-clamp-2">
        {post.title}
      </h3>

      <RecordCalendarCard record={post.record} />

      <div className="flex items-center gap-4 text-[12px] text-foreground-muted pt-1">
        <span className="inline-flex items-center gap-1">
          <Heart size={13} />
          {post.likeCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle size={13} />
          {post.commentCount}
        </span>
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
  const min = Math.floor((Date.now() - ts) / 60000);
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
