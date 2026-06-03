"use client";

import { useEffect, useState } from "react";
import { Plus, Users, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { subscribePosts, getPost } from "@/lib/community";
import type { CommunityPost } from "@/lib/types";
import { PostCard } from "./post-card";
import { PostDetailModal } from "./post-detail-modal";
import { ShareModal } from "./share-modal";

export function CommunityFeed() {
  const { state, configured, signInGoogle } = useAuth();
  const signedIn = state.status === "signedIn";
  const canLoadFeed = configured && signedIn;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  // Only start in the "loading" state when we're actually going to subscribe.
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // A post opened from a notification deep-link that isn't in the recent feed.
  const [extraPost, setExtraPost] = useState<CommunityPost | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

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

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">
            모두의 루틴
          </h2>
          <p className="text-[13px] text-foreground-muted">
            {loading
              ? "불러오는 중..."
              : posts.length > 0
                ? `${posts.length}개 루틴 공유됨`
                : "아직 게시물이 없어요. 첫 게시물을 올려보세요."}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShareOpen(true)}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">루틴 공유하기</span>
          <span className="sm:hidden">공유</span>
        </Button>
      </div>

      {error && (
        <div className="card-premium px-5 py-4 mb-6 text-[13px] text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={20} className="animate-spin text-foreground-dim" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="아직 비어있어요"
          description="가장 먼저 루틴을 공유해보세요."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onOpen={setOpenId} />
          ))}
        </div>
      )}

      {openPost && (
        <PostDetailModal post={openPost} onClose={closePost} />
      )}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card-premium px-8 py-16 flex flex-col items-center text-center">
      <div className="h-14 w-14 rounded-full bg-surface-2 text-foreground-dim flex items-center justify-center">
        <Users size={22} />
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
