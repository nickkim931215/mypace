"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import {
  searchProfilesByNickname,
  AGE_RANGE_LABEL,
  GENDER_LABEL,
  type Profile,
} from "@/lib/profile";
import { getFollowCounts, type FollowCounts } from "@/lib/follow";
import { useAuth } from "@/lib/auth-context";
import { useBlockedIds } from "@/hooks/use-blocked-ids";
import { FollowButton } from "./follow-button";
import { LevelBadge } from "./level-badge";
import { useT, type TranslateFn } from "@/lib/i18n";

// Search users by nickname and follow them straight from the results. Debounced
// prefix search against the public /profiles index. Each result shows level,
// age/gender, and follower/following counts; tapping the row opens the public
// profile. Used in the 팔로잉 tab and on the profile page (친구찾기).
export function UserSearch({ title }: { title?: string }) {
  const t = useT();
  const { user } = useAuth();
  const me = user?.uid ?? null;
  const blockedIds = useBlockedIds();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const mySeq = ++seq.current;
    const t = setTimeout(() => {
      searchProfilesByNickname(q, 12)
        .then((list) => {
          if (mySeq !== seq.current) return; // a newer query superseded us
          setResults(list);
          setLoading(false);
        })
        .catch(() => {
          if (mySeq !== seq.current) return;
          setResults([]);
          setLoading(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="card-premium p-4">
      {title && (
        <h3 className="mb-3 px-1 text-[14px] font-semibold tracking-tight">
          {title}
        </h3>
      )}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-dim"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("닉네임으로 사용자 검색", "Search users by nickname")}
          className="w-full h-11 bg-surface-2 border border-border-subtle rounded-xl pl-10 pr-9 text-[14px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
        />
        {loading && (
          <Loader2
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-foreground-dim"
          />
        )}
      </div>

      {results &&
        (() => {
          const visible = results.filter((p) => !blockedIds.has(p.uid));
          return (
            <div className="mt-3 flex flex-col gap-0.5">
              {visible.length === 0 ? (
                <p className="px-1 py-3 text-center text-[13px] text-foreground-dim">
                  {t("일치하는 사용자가 없어요.", "No matching users.")}
                </p>
              ) : (
                visible.map((p) => (
                  <ResultRow key={p.uid} profile={p} me={me} t={t} />
                ))
              )}
            </div>
          );
        })()}
    </div>
  );
}

function ResultRow({
  profile: p,
  me,
  t,
}: {
  profile: Profile;
  me: string | null;
  t: TranslateFn;
}) {
  const [counts, setCounts] = useState<FollowCounts | null>(null);

  useEffect(() => {
    let alive = true;
    getFollowCounts(p.uid)
      .then((c) => alive && setCounts(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [p.uid]);

  const demo = [
    p.ageRange ? AGE_RANGE_LABEL[p.ageRange] : null,
    p.gender ? GENDER_LABEL[p.gender] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2">
      <Link href={`/u/${p.uid}`} className="min-w-0 flex-1 flex items-center gap-3">
        {p.photoURL ? (
          <Image
            src={p.photoURL}
            alt=""
            width={40}
            height={40}
            className="rounded-full object-cover shrink-0"
            unoptimized
          />
        ) : (
          <span className="h-10 w-10 shrink-0 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[14px] font-semibold">
            {(p.nickname || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-medium">
              {p.nickname}
            </span>
            <LevelBadge uid={p.uid} />
          </div>
          <div className="mt-0.5 text-[11px] text-foreground-dim truncate">
            {demo && <span>{demo} · </span>}
            {t("팔로워", "Followers")}{" "}
            <span className="text-foreground-muted tabular-nums">
              {counts?.followers ?? "—"}
            </span>
            {"  ·  "}
            {t("팔로잉", "Following")}{" "}
            <span className="text-foreground-muted tabular-nums">
              {counts?.following ?? "—"}
            </span>
          </div>
        </div>
      </Link>
      {me === p.uid ? (
        <span className="shrink-0 pr-1 text-[12px] text-foreground-dim">{t("나", "You")}</span>
      ) : (
        <FollowButton targetUid={p.uid} size="sm" />
      )}
    </div>
  );
}
