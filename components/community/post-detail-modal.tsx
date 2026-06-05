"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  Heart,
  Download,
  Trash2,
  Pencil,
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
  deleteComment,
  deletePost,
  subscribeComments,
  subscribeMyLike,
  toggleLike,
  updatePost,
} from "@/lib/community";
import { BODY_PART_LABEL, type BodyPart } from "@/lib/ai-recommend";
import { useProfileName } from "@/hooks/use-profile-name";
import { RecordCalendarCard } from "./record-calendar-card";
import type { CommunityPost, PostComment } from "@/lib/types";
import { formatDuration, cn } from "@/lib/utils";

const BODY_PARTS = Object.keys(BODY_PART_LABEL) as BodyPart[];

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
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  // Inline post-edit state (owner only).
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editDesc, setEditDesc] = useState(post.description);
  const [editYoutube, setEditYoutube] = useState(post.youtubeUrl ?? "");
  const [editBodyParts, setEditBodyParts] = useState<BodyPart[]>(
    (post.bodyParts as BodyPart[]) ?? [],
  );
  const [saving, setSaving] = useState(false);

  // Reply state — which top-level comment's reply box is open.
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyPosting, setReplyPosting] = useState(false);

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

  const authorName = user?.displayName ?? user?.email ?? "익명";

  // Live display names (reflect the author's current nickname, not the snapshot
  // stored on the post/comment at write time).
  const postAuthorName = useProfileName(post.authorId, post.authorName);
  const replyTarget = comments.find((c) => c.id === replyOpenId) ?? null;
  const replyTargetName = useProfileName(
    replyTarget?.authorId,
    replyTarget?.authorName ?? "",
  );

  async function onToggleLike() {
    if (!user || busyLike) return;
    setBusyLike(true);
    try {
      await toggleLike(post.id, user.uid, {
        postTitle: post.title,
        recipientId: post.authorId,
        actorName: authorName,
        actorPhotoURL: user.photoURL ?? null,
      });
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
        postTitle: post.title,
        authorId: user.uid,
        authorName,
        authorPhotoURL: user.photoURL ?? null,
        text,
        recipientId: post.authorId,
      });
      setCommentText("");
    } catch (err) {
      console.error("[community] addComment failed:", err);
    } finally {
      setPosting(false);
    }
  }

  async function submitReply(parent: PostComment) {
    if (!user || replyPosting) return;
    const text = replyText.trim();
    if (!text) return;
    setReplyPosting(true);
    try {
      await addComment({
        postId: post.id,
        postTitle: post.title,
        authorId: user.uid,
        authorName,
        authorPhotoURL: user.photoURL ?? null,
        text,
        parentId: parent.id,
        recipientId: parent.authorId,
      });
      setReplyText("");
      setReplyOpenId(null);
    } catch (err) {
      console.error("[community] reply failed:", err);
    } finally {
      setReplyPosting(false);
    }
  }

  function onImport() {
    if (!post.routine) return;
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

  function startEdit() {
    setEditTitle(post.title);
    setEditDesc(post.description);
    setEditYoutube(post.youtubeUrl ?? "");
    setEditBodyParts((post.bodyParts as BodyPart[]) ?? []);
    setEditing(true);
  }

  function toggleEditBodyPart(part: BodyPart) {
    setEditBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part],
    );
  }

  async function onSaveEdit() {
    const title = editTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      await updatePost(post.id, {
        title,
        description: editDesc,
        youtubeUrl: editYoutube.trim() || null,
        bodyParts: editBodyParts,
      });
      setEditing(false);
    } catch (err) {
      console.error("[community] updatePost failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteComment(commentId: string) {
    if (deletingCommentId) return;
    if (!confirm("이 댓글을 삭제할까요?")) return;
    setDeletingCommentId(commentId);
    try {
      await deleteComment(post.id, commentId);
    } catch (err) {
      console.error("[community] deleteComment failed:", err);
    } finally {
      setDeletingCommentId(null);
    }
  }

  const isRecord = post.kind === "record";
  const totalSec = post.routine
    ? post.routine.totalDurationSec * post.routine.repeat
    : 0;

  // Group comments into one level of threads. `comments` arrives ordered by
  // createdAt asc, so both top-level and replies stay chronological.
  const topLevelComments = comments.filter((c) => !c.parentId);
  const repliesByParent = new Map<string, PostComment[]>();
  for (const c of comments) {
    if (!c.parentId) continue;
    const arr = repliesByParent.get(c.parentId) ?? [];
    arr.push(c);
    repliesByParent.set(c.parentId, arr);
  }

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
              name={postAuthorName}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">{postAuthorName}</p>
              <p className="text-[11px] text-foreground-dim">
                {new Date(post.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
            {isOwner && !editing && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={startEdit}
                  aria-label="수정"
                  className="h-9 w-9 rounded-full hover:bg-surface-2 text-foreground-dim hover:text-foreground transition-colors flex items-center justify-center"
                >
                  <Pencil size={15} />
                </button>
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
              </div>
            )}
          </header>

          {editing ? (
            <div className="flex flex-col gap-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목"
                maxLength={80}
                className="w-full h-11 bg-surface-2 border border-border-subtle rounded-xl px-4 text-[15px] font-medium focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="설명 (선택)"
                maxLength={1000}
                rows={4}
                className="w-full bg-surface-2 border border-border-subtle rounded-xl px-4 py-3 text-[14px] leading-relaxed resize-y focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
              />
              {!isRecord && (
                <>
                  <input
                    value={editYoutube}
                    onChange={(e) => setEditYoutube(e.target.value)}
                    placeholder="YouTube URL (선택)"
                    className="w-full h-11 bg-surface-2 border border-border-subtle rounded-xl px-4 text-[13px] focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BODY_PARTS.map((part) => {
                      const on = editBodyParts.includes(part);
                      return (
                        <button
                          key={part}
                          type="button"
                          onClick={() => toggleEditBodyPart(part)}
                          className={cn(
                            "h-8 px-3 rounded-full border text-[12px] transition-colors",
                            on
                              ? "border-accent/50 bg-accent/15 text-accent"
                              : "border-border-subtle bg-surface-2 text-foreground-muted hover:border-border-strong",
                          )}
                        >
                          {BODY_PART_LABEL[part]}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onSaveEdit}
                  disabled={!editTitle.trim() || saving}
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  저장
                </Button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="h-11 px-4 rounded-full text-[13px] text-foreground-muted hover:text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                {post.title}
              </h2>
              {post.bodyParts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.bodyParts.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center h-6 px-2.5 rounded-full bg-accent/12 text-accent text-[11px] font-medium"
                    >
                      {BODY_PART_LABEL[p as BodyPart] ?? p}
                    </span>
                  ))}
                </div>
              )}
              {post.description && (
                <p className="mt-3 text-[14px] text-foreground-muted leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              )}
            </div>
          )}

          {isRecord && post.record ? (
            <RecordCalendarCard record={post.record} />
          ) : (
            post.routine && (
              <RoutinePreview routine={post.routine} totalSec={totalSec} />
            )
          )}

          <div className="flex flex-wrap items-center gap-3">
            {!isRecord && post.routine && (
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
            )}
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
            <ul className="flex flex-col gap-4">
              {topLevelComments.map((c) => {
                const replies = repliesByParent.get(c.id) ?? [];
                return (
                  <li key={c.id} className="flex flex-col gap-2">
                    <CommentRow
                      comment={c}
                      canDelete={user?.uid === c.authorId}
                      deleting={deletingCommentId === c.id}
                      onDelete={() => onDeleteComment(c.id)}
                    />

                    {(replies.length > 0 || replyOpenId === c.id) && (
                      <div className="ml-3 pl-5 border-l border-border-subtle flex flex-col gap-3">
                        {replies.map((r) => (
                          <CommentRow
                            key={r.id}
                            comment={r}
                            small
                            canDelete={user?.uid === r.authorId}
                            deleting={deletingCommentId === r.id}
                            onDelete={() => onDeleteComment(r.id)}
                          />
                        ))}
                        {replyOpenId === c.id && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              void submitReply(c);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`${replyTargetName}님에게 답글...`}
                              maxLength={500}
                              className="flex-1 h-9 bg-surface-2 border border-border-subtle rounded-full px-3.5 text-[12px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
                            />
                            <button
                              type="submit"
                              disabled={!replyText.trim() || replyPosting}
                              aria-label="답글 전송"
                              className="h-9 w-9 rounded-full bg-accent text-background flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
                            >
                              {replyPosting ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Send size={13} />
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {user && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyText("");
                          setReplyOpenId((id) => (id === c.id ? null : c.id));
                        }}
                        className="self-start ml-9 text-[11px] text-foreground-dim hover:text-foreground transition-colors"
                      >
                        {replyOpenId === c.id ? "취소" : "답글"}
                      </button>
                    )}
                  </li>
                );
              })}
              {topLevelComments.length === 0 && (
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
  routine: NonNullable<CommunityPost["routine"]>;
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

function CommentRow({
  comment: c,
  canDelete,
  deleting,
  onDelete,
  small,
}: {
  comment: PostComment;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  small?: boolean;
}) {
  const name = useProfileName(c.authorId, c.authorName);
  return (
    <div className="group flex items-start gap-2.5">
      <Avatar photo={c.authorPhotoURL} name={name} size={small ? 22 : 26} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px]">
          <span className="font-medium">{name}</span>
          <span className="ml-2 text-foreground-dim">
            {formatRelative(c.createdAt)}
          </span>
        </p>
        <p
          className={cn(
            "mt-0.5 text-foreground whitespace-pre-wrap break-words",
            small ? "text-[12px]" : "text-[13px]",
          )}
        >
          {c.text}
        </p>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="댓글 삭제"
          className="shrink-0 h-7 w-7 rounded-full text-foreground-dim hover:text-danger hover:bg-danger/10 transition-colors flex items-center justify-center disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
        >
          {deleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      )}
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
