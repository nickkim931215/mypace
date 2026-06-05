"use client";

/* ──────────────────────────────────────────────────────────────
   MyPace Music Player
   ────────────────────────────────────────────────────────────────
   Plays BGM / "hype" tracks via a single HTMLAudioElement (NOT the
   Web Audio graph). This is deliberate:
     • survives screen-lock / backgrounding on mobile, where Web Audio
       gets suspended;
     • integrates with the OS lock-screen via the MediaSession API,
       showing the track title and a "next" control.
   Files are served from the app's own `public/` folder (track.src is a
   "/music/…" URL). A shuffled playlist plays continuously; when one
   track ends the next begins, looping (and reshuffling) until stopped.
   ────────────────────────────────────────────────────────────── */

import type { MusicTrack } from "./music-tracks";

export type MusicStatus =
  | "idle" // nothing loaded
  | "ready" // playlist loaded, not playing
  | "loading" // resolving / buffering a track
  | "playing"
  | "paused"
  | "empty"; // playlist has no (playable) tracks yet

export interface MusicPlayerState {
  status: MusicStatus;
  current: MusicTrack | null;
}

type Listener = (state: MusicPlayerState) => void;

function shuffle(n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

class MusicPlayer {
  private el: HTMLAudioElement | null = null;
  private playlist: MusicTrack[] = [];
  private order: number[] = [];
  private pos = 0;
  private fails = 0; // consecutive failed tracks (guards against spin)
  private master = 0.8;
  private music = 0.7;
  private listeners = new Set<Listener>();
  private state: MusicPlayerState = { status: "idle", current: null };

  private ensureEl() {
    if (this.el || typeof window === "undefined") return;
    this.el = new Audio();
    this.el.preload = "auto";
    this.el.addEventListener("ended", () => this.next());
    this.applyVolume();
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    l(this.state);
    return () => {
      this.listeners.delete(l);
    };
  }

  private set(patch: Partial<MusicPlayerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  setVolumes(master: number, music: number) {
    this.master = master;
    this.music = music;
    this.applyVolume();
  }

  private applyVolume() {
    if (this.el) {
      this.el.volume = Math.min(1, Math.max(0, this.master * this.music));
    }
  }

  /** Load a flavor's playlist. Shuffles. Optionally start playing at once. */
  async load(playlist: MusicTrack[], autoplay: boolean) {
    this.ensureEl();
    this.playlist = playlist;
    this.fails = 0;
    if (!playlist.length) {
      this.stop();
      this.set({ status: "empty", current: null });
      return;
    }
    this.order = shuffle(playlist.length);
    this.pos = 0;
    if (autoplay) {
      await this.playCurrent();
    } else {
      this.set({ status: "ready", current: playlist[this.order[0]] });
    }
  }

  private async playCurrent() {
    if (!this.el || !this.playlist.length) return;
    const track = this.playlist[this.order[this.pos]];
    this.set({ status: "loading", current: track });
    try {
      this.el.src = track.src;
      await this.el.play();
      this.fails = 0;
      this.set({ status: "playing", current: track });
      this.updateMediaSession(track);
    } catch {
      // Track missing/unplayable (e.g. not uploaded yet). Skip to the next,
      // but give up once we've tried the whole list to avoid an infinite loop.
      this.fails += 1;
      if (this.fails >= this.playlist.length) {
        this.set({ status: "empty", current: null });
        return;
      }
      this.advance();
      await this.playCurrent();
    }
  }

  private advance() {
    this.pos += 1;
    if (this.pos >= this.order.length) {
      this.pos = 0;
      this.order = shuffle(this.playlist.length); // fresh shuffle each loop
    }
  }

  /** Skip to the next track immediately. */
  next() {
    if (!this.playlist.length) return;
    this.fails = 0;
    this.advance();
    void this.playCurrent();
  }

  /** Resume (or start) playback of the current track. */
  resume() {
    if (!this.el || !this.playlist.length) return;
    if (this.state.status === "playing") return;
    if (this.el.src) {
      this.el.play().catch(() => this.next());
      this.set({ status: "playing" });
    } else {
      void this.playCurrent();
    }
  }

  pause() {
    if (!this.el) return;
    this.el.pause();
    if (this.state.status === "playing" || this.state.status === "loading") {
      this.set({ status: "paused" });
    }
  }

  stop() {
    if (this.el) {
      this.el.pause();
      this.el.removeAttribute("src");
    }
    if (this.state.status !== "empty") {
      this.set({ status: "idle", current: null });
    }
  }

  private updateMediaSession(track: MusicTrack) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist ?? "MyPace",
        album: "MyPace 동기부여",
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => this.next());
      navigator.mediaSession.setActionHandler("play", () => this.resume());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
    } catch {
      // Some browsers reject unsupported action handlers — non-fatal.
    }
  }
}

export const musicPlayer = new MusicPlayer();
