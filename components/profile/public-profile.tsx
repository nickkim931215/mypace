"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeProfile,
  AGE_RANGE_LABEL,
  GENDER_LABEL,
  type Profile,
} from "@/lib/profile";
import { getFollowCounts, type FollowCounts } from "@/lib/follow";
import { FollowButton } from "@/components/community/follow-button";
import { LevelBadge } from "@/components/community/level-badge";

// Public, read-only profile for any user, reached from a nickname tap. Shows
// identity (avatar + nickname + level/칭호), self-declared demographics, follow
// counts, and a follow button. Live-subscribed so renames/level-ups reflect.
export function PublicProfile({ uid }: { uid: string }) {
  const { user } = useAuth();
  const me = user?.uid ?? null;
  const isMe = me === uid;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [counts, setCounts] = useState<FollowCounts | null>(null);
  const [countSeq, setCountSeq] = useState(0);

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
          존재하지 않는 사용자예요.
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
                {AGE_RANGE_LABEL[profile.ageRange]}
              </span>
            )}
            {profile.gender && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-surface-2 text-[12px] font-medium text-foreground-muted">
                {GENDER_LABEL[profile.gender]}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-5 flex items-center gap-8">
          <Stat label="팔로워" value={counts?.followers} />
          <Stat label="팔로잉" value={counts?.following} />
        </div>

        {/* Action */}
        <div className="mt-6 w-full max-w-[260px]">
          {isMe ? (
            <Link
              href="/profile"
              className="inline-flex w-full items-center justify-center h-10 rounded-full bg-surface-2 text-[13px] font-medium text-foreground-muted hover:text-foreground border border-border-subtle transition-colors"
            >
              내 프로필 편집
            </Link>
          ) : (
            <FollowButton
              targetUid={uid}
              className="w-full"
              onChange={() => setCountSeq((n) => n + 1)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function BackLink() {
  return (
    <Link
      href="/community"
      className="inline-flex items-center gap-1.5 text-[13px] text-foreground-dim hover:text-foreground transition-colors"
    >
      <ArrowLeft size={15} /> 커뮤니티
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
