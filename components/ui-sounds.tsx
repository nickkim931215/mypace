"use client";

import { useEffect } from "react";
import { audio } from "@/lib/audio";
import { useTimerStore } from "@/store/timer-store";

/**
 * App-wide UI click feedback. A single delegated listener plays a short
 * electronic "tap" on any button / link / toggle so every tap has a tactile
 * sound, without having to wire each component. Add `data-no-sound` to an
 * element (or an ancestor) to opt out — used by the run-screen transport
 * controls, which already emit their own audio cues.
 *
 * Also keeps the audio engine's volumes + sound pack in sync with the store
 * everywhere (not just on the run screen), so UI sounds honor user settings.
 */
export function UiSounds() {
  const masterVolume = useTimerStore((s) => s.masterVolume);
  const timerVolume = useTimerStore((s) => s.timerVolume);
  const metronomeVolume = useTimerStore((s) => s.metronomeVolume);
  const uiVolume = useTimerStore((s) => s.uiVolume);
  const soundTheme = useTimerStore((s) => s.soundTheme);

  useEffect(() => {
    audio.setVolumes({
      master: masterVolume,
      timer: timerVolume,
      metronome: metronomeVolume,
      ui: uiVolume,
    });
    audio.setTheme(soundTheme);
  }, [masterVolume, timerVolume, metronomeVolume, uiVolume, soundTheme]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>(
        'button, a, [role="button"], [role="switch"], summary, label[role="button"]',
      );
      if (!el) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true")
        return;
      if (el.closest("[data-no-sound]")) return;

      // A click is a user gesture, so this is a valid moment to unlock audio.
      audio.unlock();
      audio.uiTap();
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
