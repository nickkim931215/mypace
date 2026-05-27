"use client";

import { create } from "zustand";

export type SyncStatus =
  | "idle"
  | "loading"
  | "syncing"
  | "synced"
  | "offline"
  | "error";

interface SyncStore {
  status: SyncStatus;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  setStatus: (status: SyncStatus, errorMessage?: string | null) => void;
  markSynced: () => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: "idle",
  lastSyncedAt: null,
  errorMessage: null,
  setStatus: (status, errorMessage = null) =>
    set({ status, errorMessage: status === "error" ? errorMessage : null }),
  markSynced: () =>
    set({ status: "synced", lastSyncedAt: Date.now(), errorMessage: null }),
}));
