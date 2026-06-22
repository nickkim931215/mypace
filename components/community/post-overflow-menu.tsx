"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Flag, Ban, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { blockUser } from "@/lib/moderation";
import { ReportDialog } from "./report-dialog";
import { useT } from "@/lib/i18n";

// Overflow (⋯) menu on someone else's post: report the post or block its
// author. Renders nothing for the post's owner or signed-out users. Blocking
// calls onBlocked so the parent can close the now-hidden post.
export function PostOverflowMenu({
  postId,
  authorId,
  authorName,
  onBlocked,
}: {
  postId: string;
  authorId: string;
  authorName: string;
  onBlocked?: () => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const me = user?.uid ?? null;
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!me || me === authorId) return null;

  async function onBlock() {
    if (!me || blocking) return;
    if (
      !confirm(
        t(
          `${authorName}님을 차단할까요?\n차단하면 이 사용자의 게시물과 댓글이 더 이상 보이지 않아요.`,
          `Block ${authorName}?\nYou'll no longer see this user's posts or comments.`,
        ),
      )
    )
      return;
    setBlocking(true);
    try {
      await blockUser(me, authorId);
      setOpen(false);
      onBlocked?.();
    } catch (err) {
      console.error("[moderation] blockUser failed:", err);
      setBlocking(false);
    }
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={t("더보기", "More")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-9 rounded-full hover:bg-surface-2 text-foreground-dim hover:text-foreground transition-colors flex items-center justify-center"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 w-44 rounded-2xl border border-border-subtle bg-surface-1 p-1.5 shadow-2xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setReporting(true);
            }}
            className="flex w-full items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-foreground-muted hover:bg-surface-2 hover:text-foreground transition-colors"
          >
            <Flag size={14} />
            {t("게시물 신고", "Report post")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onBlock}
            disabled={blocking}
            className="flex w-full items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
          >
            {blocking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Ban size={14} />
            )}
            {t("사용자 차단", "Block user")}
          </button>
        </div>
      )}

      {reporting && (
        <ReportDialog
          targetType="post"
          targetId={postId}
          authorId={authorId}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
