"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  Heart,
  Download,
  Trash2,
  Send,
  Loader2,
  Dumbbell,
  Timer as TimerIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTimerStore } from "@/store/timer-store";
import {
  addComment,
  deletePost,
  subscribeComments,
  subscribeMyLike,
  toggleLike,
} from "@/lib/community";
import type { CommunityPost, PostComment } from "@/lib/types";
import { formatDuration, cn } from "@/lib/utils";

export function PostDetailModal({
  post,
  onClose,
}: {
  post: CommunityPost;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const importRoutine = useTimerStore((s) => s.importRoutine);

  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [busyLike, setBusyLike] = useState(false);
  const [imported, setImported] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = subscribeComments(post.id, setComments);
    return unsub;
  }, [post.id]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyLike(post.id, user.uid, setLiked);
    return unsub;
  }, [post.id, user]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isOwner = user?.uid === post.authorId;

  async function onToggleLike() {
    if (!user || busyLike) return;
    setBusyLike(true);
    try {
      await toggleLike(post.id, user.uid);
    } catch (err) {
      console.error("[community] toggleLike failed:", err);
    } finally {
      setBusyLike(false);
    }
  }

  async function onPostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || posting) return;
    const text = commentText.trim();
    if (!text) return;
    setPosting(true);
    try {
      await addComment({
        postId: post.id,
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? "익명",
        authorPhotoURL: user.photoURL ?? null,
        text,
      });
      setCommentText("");
    } catch (err) {
      console.error("[community] addComment failed:", err);
    } finally {
      setPosting(false);
    }
  }

  function onImport() {
    importRoutine(post.routine);
    setImported(true);
    setTimeout(() => setImported(false), 2000);
  }

  async function onDelete() {
    if (!confirm("이 게시물을 삭제하시겠어요?")) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      onClose();
    } catch (err) {
      console.error("[community] deletePost failed:", err);
      setDeleting(false);
    }
  }

  const totalSec = post.routine.totalDurationSec * post.routine.repeat;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[88dvh] bg-surface-1 border border-border-subtle sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 z-20 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-foreground hover:bg-black/60 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto overscroll-contain">
        {post.youtubeId && (
          <div className="relative aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${post.youtubeId}`}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        )}

        <div className="px-5 sm:px-8 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-6">
          <header className="flex items-start gap-3">
            <Avatar
              photo={post.authorPhotoURL}
              name={post.authorName}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">{post.authorName}</p>
              <p className="text-[11px] text-foreground-dim">
                {new Date(post.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                aria-label="삭제"
                className="h-9 w-9 rounded-full hover:bg-surface-2 text-foreground-dim hover:text-danger transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            )}
          </header>

          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              {post.title}
            </h2>
            {post.description && (
              <p className="mt-3 text-[14px] text-foreground-muted leading-relaxed whitespace-pre-wrap">
                {post.description}
              </p>
            )}
          </div>

          <RoutinePreview routine={post.routine} totalSec={totalSec} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={onImport}
              disabled={!user}
              title={!user ? "로그인이 필요합니다" : undefined}
            >
              <Download size={15} />
              {imported ? "내 루틴에 추가됨" : "내 루틴으로 가져오기"}
            </Button>
            <button
              type="button"
              onClick={onToggleLike}
              disabled={!user || busyLike}
              className={cn(
                "h-11 inline-flex items-center gap-2 px-4 rounded-full border text-[13px] transition-colors",
                liked
                  ? "bg-accent/15 border-accent/40 text-accent"
                  : "border-border-subtle text-foreground-muted hover:border-border-strong",
                !user && "opacity-50 cursor-not-allowed",
              )}
            >
              <Heart
                size={14}
                className={liked ? "fill-accent" : undefined}
              />
              <span>{post.likeCount}</span>
            </button>
          </div>

          <section className="border-t border-border-subtle pt-5">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim mb-3">
              댓글 {post.commentCount}
            </h3>
            <ul className="flex flex-col gap-3">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5">
                  <Avatar
                    photo={c.authorPhotoURL}
                    name={c.authorName}
                    size={26}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px]">
                      <span className="font-medium">{c.authorName}</span>
                      <span className="ml-2 text-foreground-dim">
                        {formatRelative(c.createdAt)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-foreground whitespace-pre-wrap break-words">
                      {c.text}
                    </p>
                  </div>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-[12px] text-foreground-dim">
                  아직 댓글이 없어요. 첫 댓글을 남겨보세요.
                </li>
              )}
            </ul>

            {user ? (
              <form
                onSubmit={onPostComment}
                className="mt-4 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글 달기..."
                  maxLength={500}
                  className="flex-1 h-11 bg-surface-2 border border-border-subtle rounded-full px-4 text-[13px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || posting}
                  aria-label="전송"
                  className="h-11 w-11 rounded-full bg-accent text-background flex items-center justify-center disabled:opacity-40 transition-opacity"
                >
                  {posting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-[12px] text-foreground-dim">
                로그인하면 댓글을 작성할 수 있어요.
              </p>
            )}
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}

function RoutinePreview({
  routine,
  totalSec,
}: {
  routine: CommunityPost["routine"];
  totalSec: number;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-2/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[12px] text-foreground-muted">
          <Dumbbell size={13} className="text-accent" />
          {routine.name}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-foreground-muted">
          <TimerIcon size={13} className="text-accent" />
          {formatDuration(totalSec)}
          {routine.repeat > 1 && (
            <span className="text-foreground-dim">· {routine.repeat}회 반복</span>
          )}
        </div>
      </div>
      <ol className="flex flex-col gap-1.5">
        {routine.rounds.map((r, idx) => (
          <li
            key={r.id}
            className="flex items-center gap-3 px-3 h-10 rounded-xl bg-surface-1 border border-border-subtle/60 text-[13px]"
          >
            <span className="w-5 text-[11px] text-foreground-dim tabular-nums">
              {idx + 1}
            </span>
            <span
              className={cn(
                "inline-flex items-center justify-center px-2 h-6 rounded-full text-[10px] uppercase tracking-wider",
                r.type === "work" && "bg-accent/15 text-accent",
                r.type === "rest" && "bg-surface-3 text-foreground-muted",
                r.type === "prepare" && "bg-surface-3 text-foreground-muted",
              )}
            >
              {r.type === "work" ? "Work" : r.type === "rest" ? "Rest" : "Prep"}
            </span>
            <span className="flex-1 truncate">{r.name}</span>
            <span className="text-foreground-dim tabular-nums">
              {r.durationSec}s
            </span>
            {r.bpm && (
              <span className="text-foreground-dim tabular-nums text-[11px]">
                {r.bpm}bpm
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
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
  return `${day}일 전`;
}
