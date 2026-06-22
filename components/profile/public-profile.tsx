"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, Flag, Ban } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeProfile,
  AGE_RANGE_LABEL,
  AGE_RANGE_LABEL_EN,
  GENDER_LABEL,
  GENDER_LABEL_EN,
  type Profile,
} from "@/lib/profile";
import { getFollowCounts, type FollowCounts } from "@/lib/follow";
import { blockUser, unblockUser } from "@/lib/moderation";
import { useBlockedIds } from "@/hooks/use-blocked-ids";
import { FollowButton } from "@/components/community/follow-button";
import { ReportDialog } from "@/components/community/report-dialog";
import { LevelBadge } from "@/components/community/level-badge";
import { cn } from "@/lib/utils";
import { useT, useLocale } from "@/lib/i18n";

// Public, read-only profile for any user, reached from a nickname tap. Shows
// identity (avatar + nickname + level/칭호), self-declared demographics, follow
// counts, and a follow button. Live-subscribed so renames/level-ups reflect.
export function PublicProfile({ uid }: { uid: string }) {
  const t = useT();
  const { locale } = useLocale();
  const { user } = useAuth();
  const me = user?.uid ?? null;
  const isMe = me === uid;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [counts, setCounts] = useState<FollowCounts | null>(null);
  const [countSeq, setCountSeq] = useState(0);
  const blockedIds = useBlockedIds();

  useEffect(() => {
    setLoaded(false);
    const unsub = subscribeProfile(uid, (p) => {
      setProfile(p);
      setLoaded(true);
    });
    return unsub;
  }, [uid]);

  // Follower/following counts (one-shot aggregation; refetched on follow toggle).
  useEffect(() => {
    let alive = true;
    getFollowCounts(uid)
      .then((c) => alive && setCounts(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [uid, countSeq]);

  if (!loaded) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8 text-foreground-dim">
          <Loader2 size={20} className="animate-spin" />
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <p className="text-[14px] text-foreground-muted">
          {t("존재하지 않는 사용자예요.", "This user doesn't exist.")}
        </p>
        <BackLink />
      </Card>
    );
  }

  const initials = (profile.nickname || "?").trim().slice(0, 1).toUpperCase();

  return (
    <Card>
      <BackLink />

      <div className="mt-4 flex flex-col items-center text-center">
        {profile.photoURL ? (
          <Image
            src={profile.photoURL}
            alt=""
            width={88}
            height={88}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <span className="h-[88px] w-[88px] rounded-full bg-accent/15 text-accent flex items-center justify-center text-3xl font-semibold">
            {initials}
          </span>
        )}

        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {profile.nickname}
          </h2>
          <LevelBadge uid={uid} withTitle />
        </div>

        {(profile.ageRange || profile.gender) && (
          <div className="mt-3 flex items-center gap-1.5">
            {profile.ageRange && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-surface-2 text-[12px] font-medium text-foreground-muted">
                {locale === "en"
                  ? AGE_RANGE_LABEL_EN[profile.ageRange]
                  : AGE_RANGE_LABEL[profile.ageRange]}
              </span>
            )}
            {profile.gender && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-surface-2 text-[12px] font-medium text-foreground-muted">
                {locale === "en"
                  ? GENDER_LABEL_EN[profile.gender]
                  : GENDER_LABEL[profile.gender]}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-5 flex items-center gap-8">
          <Stat label={t("팔로워", "Followers")} value={counts?.followers} />
          <Stat label={t("팔로잉", "Following")} value={counts?.following} />
        </div>

        {/* Action */}
        <div className="mt-6 w-full max-w-[260px]">
          {isMe ? (
            <Link
              href="/profile"
              className="inline-flex w-full items-center justify-center h-10 rounded-full bg-surface-2 text-[13px] font-medium text-foreground-muted hover:text-foreground border border-border-subtle transition-colors"
            >
              {t("내 프로필 편집", "Edit my profile")}
            </Link>
          ) : (
            <FollowButton
              targetUid={uid}
              className="w-full"
              onChange={() => setCountSeq((n) => n + 1)}
            />
          )}
        </div>

        {!isMe && me && (
          <ModerationActions
            myUid={me}
            targetUid={uid}
            targetName={profile.nickname}
            blocked={blockedIds.has(uid)}
          />
        )}
      </div>
    </Card>
  );
}

// Report / block / unblock controls shown on another user's public profile.
// Blocking hides this person's posts and comments everywhere (enforced via the
// blocklist subscription that powers useBlockedIds).
function ModerationActions({
  myUid,
  targetUid,
  targetName,
  blocked,
}: {
  myUid: string;
  targetUid: string;
  targetName: string;
  blocked: boolean;
}) {
  const t = useT();
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onToggleBlock() {
    if (busy) return;
    if (
      !blocked &&
      !confirm(
        t(
          `${targetName}님을 차단할까요?\n차단하면 이 사용자의 게시물과 댓글이 더 이상 보이지 않아요.`,
          `Block ${targetName}?\nYou won't see this user's posts or comments anymore.`,
        ),
      )
    )
      return;
    setBusy(true);
    try {
      if (blocked) await unblockUser(myUid, targetUid);
      else await blockUser(myUid, targetUid);
    } catch (err) {
      console.error("[moderation] block toggle failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setReporting(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12px] text-foreground-dim hover:text-foreground hover:bg-surface-2 transition-colors"
      >
        <Flag size={13} />
        {t("신고", "Report")}
      </button>
      <button
        type="button"
        onClick={onToggleBlock}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12px] transition-colors disabled:opacity-50",
          blocked
            ? "text-foreground-muted hover:text-foreground hover:bg-surface-2"
            : "text-danger hover:bg-danger/10",
        )}
      >
        {busy ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Ban size={13} />
        )}
        {blocked ? t("차단 해제", "Unblock") : t("차단", "Block")}
      </button>

      {reporting && (
        <ReportDialog
          targetType="user"
          targetId={targetUid}
          authorId={targetUid}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}

function BackLink() {
  const t = useT();
  return (
    <Link
      href="/community"
      className="inline-flex items-center gap-1.5 text-[13px] text-foreground-dim hover:text-foreground transition-colors"
    >
      <ArrowLeft size={15} /> {t("커뮤니티", "Community")}
    </Link>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card-premium p-6 sm:p-8">{children}</div>;
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="text-center">
      <p className="text-[20px] font-semibold tabular-nums leading-none">
        {value ?? "—"}
      </p>
      <p className="mt-1.5 text-[12px] text-foreground-dim">{label}</p>
    </div>
  );
}
