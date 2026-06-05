"use client";

import { useEffect, useRef } from "react";
import { audio } from "@/lib/audio";
import { musicPlayer } from "@/lib/music-player";
import { bgmTracksFor, tracksFor, type MusicTrack } from "@/lib/music-tracks";
import type { AudioMode, BgmMood, HypeFlavor } from "@/store/timer-store";

interface Options {
  audioMode: AudioMode;
  bgmMood: BgmMood;
  hypeFlavor: HypeFlavor;
  /** Timer engine status — only "running" should produce music. */
  status: string;
  masterVolume: number;
  musicVolume: number;
}

/** What the current settings want playing, independent of run state. */
type Source =
  | { kind: "files"; tracks: MusicTrack[] } // hype, or BGM once uploaded
  | { kind: "synth"; mood: BgmMood } // BGM fallback before any upload
  | { kind: "none" };

function desiredSource(
  audioMode: AudioMode,
  bgmMood: BgmMood,
  hypeFlavor: HypeFlavor,
): Source {
  if (audioMode === "hype") return { kind: "files", tracks: tracksFor(hypeFlavor) };
  if (audioMode === "bgm") {
    const tracks = bgmTracksFor(bgmMood);
    return tracks.length
      ? { kind: "files", tracks }
      : { kind: "synth", mood: bgmMood };
  }
  return { kind: "none" };
}

/**
 * Drives the non-metronome audio (instrumental BGM + hype tracks) off the
 * workout's run state. Metronome ticking is handled in the AudioPanel (it
 * needs per-round BPM). Exactly one source is active at a time.
 */
export function useWorkoutAudio({
  audioMode,
  bgmMood,
  hypeFlavor,
  status,
  masterVolume,
  musicVolume,
}: Options) {
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Keep music volumes in sync (both the synth bus and the <audio> element).
  useEffect(() => {
    audio.setVolumes({ music: musicVolume });
    musicPlayer.setVolumes(masterVolume, musicVolume);
  }, [masterVolume, musicVolume]);

  // Build / tear down the source whenever the mode, mood, or flavor changes.
  useEffect(() => {
    const src = desiredSource(audioMode, bgmMood, hypeFlavor);
    const running = statusRef.current === "running";
    if (src.kind === "files") {
      audio.stopBgm();
      void musicPlayer.load(src.tracks, running);
    } else if (src.kind === "synth") {
      musicPlayer.stop();
      audio.stopBgm();
      if (running) audio.startBgm(src.mood);
    } else {
      musicPlayer.stop();
      audio.stopBgm();
    }
  }, [audioMode, bgmMood, hypeFlavor]);

  // Follow play/pause with the run state.
  useEffect(() => {
    const src = desiredSource(audioMode, bgmMood, hypeFlavor);
    if (src.kind === "files") {
      if (status === "running") musicPlayer.resume();
      else if (status === "paused") musicPlayer.pause();
      else musicPlayer.stop(); // idle / finished
    } else if (src.kind === "synth") {
      if (status === "running") audio.startBgm(src.mood); // guarded: no-op if already on
      else audio.stopBgm();
    } else {
      musicPlayer.stop();
      audio.stopBgm();
    }
  }, [audioMode, bgmMood, hypeFlavor, status]);

  // Safety net: silence everything when the screen unmounts.
  useEffect(() => {
    return () => {
      audio.stopBgm();
      musicPlayer.stop();
    };
  }, []);
}
