"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { searchProfilesByNickname, type Profile } from "@/lib/profile";
import { useAuth } from "@/lib/auth-context";
import { FollowButton } from "./follow-button";
import { LevelBadge } from "./level-badge";

// Search users by nickname and follow them straight from the results. Debounced
// prefix search against the public /profiles index. Lives at the top of the
// 팔로잉 tab so finding new people to follow is one box away from the feed.
export function UserSearch() {
  const { user } = useAuth();
  const me = user?.uid ?? null;
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
    <div className="card-premium p-4 mb-5">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-dim"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="닉네임으로 사용자 검색"
          className="w-full h-11 bg-surface-2 border border-border-subtle rounded-xl pl-10 pr-9 text-[14px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
        />
        {loading && (
          <Loader2
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-foreground-dim"
          />
        )}
      </div>

      {results && (
        <div className="mt-3 flex flex-col gap-0.5">
          {results.length === 0 ? (
            <p className="px-1 py-3 text-center text-[13px] text-foreground-dim">
              일치하는 사용자가 없어요.
            </p>
          ) : (
            results.map((p) => (
              <div
                key={p.uid}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
              >
                {p.photoURL ? (
                  <Image
                    src={p.photoURL}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded-full object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <span className="h-9 w-9 shrink-0 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[13px] font-semibold">
                    {(p.nickname || "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span className="truncate text-[14px] font-medium">
                    {p.nickname}
                  </span>
                  <LevelBadge uid={p.uid} />
                </div>
                {me === p.uid ? (
                  <span className="shrink-0 pr-1 text-[12px] text-foreground-dim">
                    나
                  </span>
                ) : (
                  <FollowButton targetUid={p.uid} size="sm" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
