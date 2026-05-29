"use client";

/* ──────────────────────────────────────────────────────────────
   MyPace Audio Engine
   All sounds are synthesized on the fly via Web Audio API — no
   asset files needed. Three "sound themes" tweak the timbre.
   ────────────────────────────────────────────────────────────── */

import type { MetronomeSound, SoundTheme } from "@/store/timer-store";

type Volumes = {
  master: number;
  timer: number;
  metronome: number;
  ui: number;
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timerBus: GainNode | null = null;
  private metroBus: GainNode | null = null;
  private uiBus: GainNode | null = null;
  private theme: SoundTheme = "minimal";
  private vols: Volumes = { master: 0.8, timer: 1, metronome: 0.6, ui: 0.5 };

  /** Must be called from a user-gesture handler (button click) to unlock audio. */
  unlock() {
    if (typeof window === "undefined") return;
    if (this.ctx) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.timerBus = this.ctx.createGain();
    this.metroBus = this.ctx.createGain();
    this.uiBus = this.ctx.createGain();
    this.timerBus.connect(this.masterGain);
    this.metroBus.connect(this.masterGain);
    this.uiBus.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.applyVolumes();
  }

  setTheme(theme: SoundTheme) {
    this.theme = theme;
  }

  setVolumes(v: Partial<Volumes>) {
    this.vols = { ...this.vols, ...v };
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterGain || !this.timerBus || !this.metroBus || !this.uiBus) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.vols.master, t, 0.02);
    this.timerBus.gain.setTargetAtTime(this.vols.timer, t, 0.02);
    this.metroBus.gain.setTargetAtTime(this.vols.metronome, t, 0.02);
    this.uiBus.gain.setTargetAtTime(this.vols.ui, t, 0.02);
  }

  /** Sine pluck with exponential decay. */
  private pluck(
    bus: GainNode,
    {
      freq,
      duration,
      type = "sine",
      attack = 0.005,
      peak = 0.6,
      detune = 0,
      delay = 0,
    }: {
      freq: number;
      duration: number;
      type?: OscillatorType;
      attack?: number;
      peak?: number;
      detune?: number;
      delay?: number;
    },
  ) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** Filtered noise burst (for hi-hat / wood block "snap"). */
  private noiseBurst(
    bus: GainNode,
    {
      duration = 0.08,
      peak = 0.4,
      freq = 4000,
      q = 6,
      delay = 0,
    }: {
      duration?: number;
      peak?: number;
      freq?: number;
      q?: number;
      delay?: number;
    } = {},
  ) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  /* Per-theme timbre. The melodic identity of each cue stays the same;
     the theme reshapes oscillator type, pitch, loudness and decay so the
     three sound packs feel distinct. */
  private timbre(): {
    osc: OscillatorType;
    pitch: number;
    peakMul: number;
    durMul: number;
    punch: boolean;
  } {
    switch (this.theme) {
      case "gym-pro":
        return { osc: "sawtooth", pitch: 1, peakMul: 1.2, durMul: 0.8, punch: true };
      case "zen":
        return { osc: "triangle", pitch: 0.75, peakMul: 0.65, durMul: 1.7, punch: false };
      default: // minimal
        return { osc: "sine", pitch: 1, peakMul: 1, durMul: 1, punch: false };
    }
  }

  // ─── Public sound API ────────────────────────────────────────

  countdown(n: 1 | 2 | 3) {
    if (!this.timerBus) return;
    const t = this.timbre();
    // Rising tone: 1 = highest
    const base = 660;
    const freq = (base + (3 - n) * 220) * t.pitch; // n=3 → 660, n=2 → 880, n=1 → 1100
    this.pluck(this.timerBus, {
      freq,
      duration: 0.18 * t.durMul,
      type: t.osc,
      peak: 0.55 * t.peakMul,
    });
  }

  roundStart() {
    if (!this.timerBus) return;
    const t = this.timbre();
    if (t.punch) {
      this.noiseBurst(this.timerBus, { duration: 0.06, peak: 0.3, freq: 3000, q: 1.2 });
    }
    // Bright two-tone chime
    this.pluck(this.timerBus, {
      freq: 880 * t.pitch,
      duration: 0.32 * t.durMul,
      type: t.osc,
      peak: 0.5 * t.peakMul,
    });
    this.pluck(this.timerBus, {
      freq: 1320 * t.pitch,
      duration: 0.42 * t.durMul,
      type: t.osc,
      peak: 0.4 * t.peakMul,
      delay: 0.08,
    });
  }

  roundEnd() {
    if (!this.timerBus) return;
    const t = this.timbre();
    this.pluck(this.timerBus, {
      freq: 660 * t.pitch,
      duration: 0.4 * t.durMul,
      type: t.osc,
      peak: 0.4 * t.peakMul,
    });
    this.pluck(this.timerBus, {
      freq: 440 * t.pitch,
      duration: 0.5 * t.durMul,
      type: t.osc,
      peak: 0.35 * t.peakMul,
      delay: 0.05,
    });
  }

  restStart() {
    if (!this.timerBus) return;
    const t = this.timbre();
    this.pluck(this.timerBus, {
      freq: 392 * t.pitch,
      duration: 0.6 * t.durMul,
      // Rest is always mellow; gym-pro's saw would be harsh here.
      type: this.theme === "gym-pro" ? "square" : "triangle",
      peak: 0.4 * t.peakMul,
    });
  }

  workoutComplete() {
    if (!this.timerBus) return;
    const t = this.timbre();
    // C major arpeggio + bell
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) =>
      this.pluck(this.timerBus!, {
        freq: f * t.pitch,
        duration: 0.8 * t.durMul,
        type: t.osc,
        peak: 0.5 * t.peakMul,
        delay: i * 0.12,
      }),
    );
    this.noiseBurst(this.timerBus, {
      duration: 0.6,
      peak: t.punch ? 0.22 : 0.15,
      freq: 6000,
      delay: 0.48,
    });
  }

  metronomeTick(sound: MetronomeSound, accent = false) {
    if (!this.metroBus) return;
    const peak = accent ? 0.6 : 0.42;
    if (sound === "wood") {
      this.pluck(this.metroBus, {
        freq: accent ? 880 : 660,
        duration: 0.06,
        type: "square",
        peak: peak * 0.5,
      });
      this.noiseBurst(this.metroBus, {
        duration: 0.04,
        peak: peak * 0.5,
        freq: 1800,
        q: 8,
      });
    } else if (sound === "hihat") {
      this.noiseBurst(this.metroBus, {
        duration: 0.05,
        peak,
        freq: 8000,
        q: 1.5,
      });
    } else {
      // click
      this.pluck(this.metroBus, {
        freq: accent ? 2000 : 1500,
        duration: 0.025,
        type: "square",
        peak: peak * 0.8,
      });
    }
  }

  /** Play a short sample of a sound pack (for the settings preview). */
  previewTheme(theme: SoundTheme) {
    this.unlock();
    this.setTheme(theme);
    this.roundStart();
  }

  uiTap() {
    if (!this.uiBus) return;
    this.pluck(this.uiBus, {
      freq: 1200,
      duration: 0.04,
      type: "sine",
      peak: 0.18,
    });
  }

  uiSuccess() {
    if (!this.uiBus) return;
    this.pluck(this.uiBus, { freq: 880, duration: 0.18, peak: 0.3 });
    this.pluck(this.uiBus, {
      freq: 1320,
      duration: 0.22,
      peak: 0.25,
      delay: 0.06,
    });
  }
}

export const audio = new AudioEngine();

/* Korean voice guide via Web Speech API. Free, no API needed. */
export function speak(text: string, enabled = true) {
  if (!enabled) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.05;
    u.pitch = 1;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore unsupported environments
  }
}
