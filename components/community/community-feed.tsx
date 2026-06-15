"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Users, LogIn, Loader2, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { subscribePosts, getPost } from "@/lib/community";
import { subscribeFollowing } from "@/lib/follow";
import type { CommunityPost, PostKind } from "@/lib/types";

type FeedTab = PostKind | "following";
import { PostCard } from "./post-card";
import { UserSearch } from "./user-search";
import { RecordPostCard } from "./record-post-card";
import { PostDetailModal } from "./post-detail-modal";
import { ShareModal } from "./share-modal";
import { RecordShareModal } from "./record-share-modal";
import { cn } from "@/lib/utils";

export function CommunityFeed() {
  const { state, user, configured, signInGoogle } = useAuth();
  const signedIn = state.status === "signedIn";
  const canLoadFeed = configured && signedIn;
  const myUid = user?.uid ?? null;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  // Only start in the "loading" state when we're actually going to subscribe.
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // A post opened from a notification deep-link that isn't in the recent feed.
  const [extraPost, setExtraPost] = useState<CommunityPost | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [recordShareOpen, setRecordShareOpen] = useState(false);
  const [tab, setTab] = useState<FeedTab>("routine");
  // uids the current user follows — drives the 팔로잉 tab.
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!canLoadFeed) return;
    const unsub = subscribePosts(
      (next) => {
        setPosts(next);
        setLoaded(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoaded(true);
      },
    );
    return unsub;
  }, [canLoadFeed]);

  // Live set of people I follow (for the 팔로잉 tab filter).
  useEffect(() => {
    if (!canLoadFeed || !myUid) return;
    return subscribeFollowing(myUid, setFollowingIds);
  }, [canLoadFeed, myUid]);

  // Deep-link: open a specific post when arriving via /community?post=<id>
  // (e.g. clicking a notification). Read on mount, client-side only.
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("post");
    if (pid) setOpenId(pid);
  }, []);

  // When already on /community, the notification click can't remount us, so it
  // fires a window event we listen for here.
  useEffect(() => {
    function onOpen(e: Event) {
      const id = (e as CustomEvent).detail as string;
      if (id) setOpenId(id);
    }
    window.addEventListener("mypace:open-post", onOpen);
    return () => window.removeEventListener("mypace:open-post", onOpen);
  }, []);

  // Fetch the target post if it isn't already in the loaded feed page.
  useEffect(() => {
    if (!openId || !canLoadFeed) return;
    if (posts.some((p) => p.id === openId)) return;
    let cancelled = false;
    void getPost(openId)
      .then((p) => {
        if (!cancelled) setExtraPost(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [openId, posts, canLoadFeed]);

  const loading = canLoadFeed && !loaded;

  const openPost = openId
    ? posts.find((p) => p.id === openId) ??
      (extraPost?.id === openId ? extraPost : null)
    : null;

  function closePost() {
    setOpenId(null);
    setExtraPost(null);
    if (window.location.search) {
      window.history.replaceState(null, "", "/community");
    }
  }

  if (!configured) {
    return (
      <EmptyState
        title="Firebase 설정이 필요해요"
        description="커뮤니티는 Firestore 위에서 동작합니다. .env.local 에 Firebase 키를 채워주세요."
      />
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex justify-center py-32">
        <Loader2 size={20} className="animate-spin text-foreground-dim" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="card-premium px-8 py-16 flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-full bg-accent/15 text-accent flex items-center justify-center">
          <Users size={24} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          로그인하고 커뮤니티 둘러보기
        </h2>
        <p className="mt-2 text-foreground-muted text-[14px] max-w-md leading-relaxed">
          다른 사람들이 만든 인터벌 루틴을 보고, 마음에 드는 건 한 번에 내 라이브러리로 가져올 수 있어요.
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-7"
          onClick={() => void signInGoogle()}
        >
          <LogIn size={15} />
          Google 로 로그인
        </Button>
      </div>
    );
  }

  const routinePosts = posts.filter((p) => p.kind !== "record");
  const recordPosts = posts.filter((p) => p.kind === "record");
  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);
  const followingPosts = posts.filter((p) => followingSet.has(p.authorId));
  const isRecord = tab === "record";
  const isFollowing = tab === "following";
  const visible = isFollowing
    ? followingPosts
    : isRecord
      ? recordPosts
      : routinePosts;

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-surface-2 border border-border-subtle w-fit mb-5">
        <TabButton active={tab === "routine"} onClick={() => setTab("routine")}>
          루틴 {routinePosts.length > 0 && `(${routinePosts.length})`}
        </TabButton>
        <TabButton active={isRecord} onClick={() => setTab("record")}>
          기록 {recordPosts.length > 0 && `(${recordPosts.length})`}
        </TabButton>
        <TabButton active={isFollowing} onClick={() => setTab("following")}>
          팔로잉 {followingPosts.length > 0 && `(${followingPosts.length})`}
        </TabButton>
      </div>

      <div className="flex items-center justify-between gap-3 mb-6">
        <p className="text-[13px] text-foreground-muted">
          {loading
            ? "불러오는 중..."
            : isFollowing
              ? "내가 팔로우한 사람들의 새 소식이에요."
              : isRecord
                ? "다른 사람들의 운동 기록을 구경하고 응원해요."
                : "마음에 드는 루틴은 한 번에 내 라이브러리로 가져오세요."}
        </p>
        {isFollowing ? null : isRecord ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => setRecordShareOpen(true)}
          >
            <Trophy size={15} />
            <span className="hidden sm:inline">기록 자랑하기</span>
            <span className="sm:hidden">자랑</span>
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={() => setShareOpen(true)}>
            <Plus size={15} />
            <span className="hidden sm:inline">루틴 공유하기</span>
            <span className="sm:hidden">공유</span>
          </Button>
        )}
      </div>

      {isFollowing && (
        <div className="mb-5">
          <UserSearch />
        </div>
      )}

      {error && (
        <div className="card-premium px-5 py-4 mb-6 text-[13px] text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={20} className="animate-spin text-foreground-dim" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={isFollowing ? "follow" : "users"}
          title={
            isFollowing
              ? followingIds.length === 0
                ? "아직 팔로우한 사람이 없어요"
                : "팔로우한 사람들의 새 글이 없어요"
              : isRecord
                ? "아직 공유된 기록이 없어요"
                : "아직 비어있어요"
          }
          description={
            isFollowing
              ? "게시글을 열어 작성자를 팔로우하면 여기에 모여요."
              : isRecord
                ? "가장 먼저 내 운동 기록을 자랑해보세요."
                : "가장 먼저 루틴을 공유해보세요."
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {visible.map((p) =>
            p.kind === "record" ? (
              <RecordPostCard key={p.id} post={p} onOpen={setOpenId} />
            ) : (
              <PostCard key={p.id} post={p} onOpen={setOpenId} />
            ),
          )}
        </div>
      )}

      {openPost && <PostDetailModal post={openPost} onClose={closePost} />}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      {recordShareOpen && (
        <RecordShareModal onClose={() => setRecordShareOpen(false)} />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-4 rounded-full text-[13px] font-medium transition-colors",
        active
          ? "bg-accent text-background"
          : "text-foreground-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({
  title,
  description,
  icon = "users",
}: {
  title: string;
  description: string;
  icon?: "users" | "follow";
}) {
  const Icon = icon === "follow" ? UserPlus : Users;
  return (
    <div className="card-premium px-8 py-16 flex flex-col items-center text-center">
      <div className="h-14 w-14 rounded-full bg-surface-2 text-foreground-dim flex items-center justify-center">
        <Icon size={22} />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-[13px] text-foreground-muted max-w-md leading-relaxed">
        {description}
      </p>
    </div>
  );
}
