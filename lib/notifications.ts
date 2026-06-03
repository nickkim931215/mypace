import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/firebase/config";
import type { AppNotification, NotificationType } from "@/lib/types";

function notifsCol(uid: string) {
  return collection(getDb(), "users", uid, "notifications");
}

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  postId: string;
  postTitle: string;
  actorId: string;
  actorName: string;
  actorPhotoURL: string | null;
  preview?: string;
}

// Write a notification into the recipient's subcollection. No-ops when the actor
// is the recipient (don't notify yourself). Best-effort: callers fire-and-forget
// so a notification write never blocks or fails the underlying action.
export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  if (input.recipientId === input.actorId) return;
  await addDoc(notifsCol(input.recipientId), {
    type: input.type,
    postId: input.postId,
    postTitle: input.postTitle.slice(0, 120),
    actorId: input.actorId,
    actorName: input.actorName,
    actorPhotoURL: input.actorPhotoURL,
    preview: (input.preview ?? "").slice(0, 120),
    read: false,
    createdAt: serverTimestamp(),
  });
}

function fromDoc(
  snap: QueryDocumentSnapshot<DocumentData>,
): AppNotification {
  const d = snap.data();
  return {
    id: snap.id,
    type: d.type,
    postId: d.postId ?? "",
    postTitle: d.postTitle ?? "",
    actorId: d.actorId ?? "",
    actorName: d.actorName ?? "익명",
    actorPhotoURL: d.actorPhotoURL ?? null,
    preview: d.preview ?? "",
    read: d.read === true,
    createdAt:
      typeof d.createdAt === "number"
        ? d.createdAt
        : d.createdAt?.toMillis?.() ?? 0,
  };
}

export function subscribeNotifications(
  uid: string,
  onChange: (items: AppNotification[]) => void,
  onError?: (err: Error) => void,
  pageSize = 30,
): Unsubscribe {
  const q = query(
    notifsCol(uid),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );
  return onSnapshot(
    q,
    (s) => onChange(s.docs.map(fromDoc)),
    (err) => {
      console.error("[notifications] subscribe error:", err);
      onError?.(err);
    },
  );
}

export async function markNotificationRead(
  uid: string,
  id: string,
): Promise<void> {
  await updateDoc(doc(notifsCol(uid), id), { read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const unread = await getDocs(query(notifsCol(uid), orderBy("createdAt", "desc"), limit(50)));
  const batch = writeBatch(getDb());
  let touched = 0;
  unread.forEach((d) => {
    if (d.data().read !== true) {
      batch.update(d.ref, { read: true });
      touched++;
    }
  });
  if (touched > 0) await batch.commit();
}

export async function deleteNotification(
  uid: string,
  id: string,
): Promise<void> {
  await deleteDoc(doc(notifsCol(uid), id));
}
