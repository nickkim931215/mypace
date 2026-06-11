import {
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithPopup,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Query,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/firebase/config";
import type { Profile } from "@/lib/profile";

// Delete every doc a query returns, best-effort (failures on individual docs
// don't abort the rest).
async function deleteAll(q: Query): Promise<void> {
  const snap = await getDocs(q);
  await Promise.allSettled(snap.docs.map((d) => deleteDoc(d.ref)));
}

// Permanently delete a user's account and all their personal data, then remove
// the Firebase Auth account itself. Required by Google Play for any app that
// supports account creation.
//
// Order matters: wipe Firestore data while still authenticated (the rules need
// request.auth), THEN delete the auth account last. Deleting auth first would
// strip the permissions needed to delete the data.
export async function deleteAccount(user: User): Promise<void> {
  if (!isFirebaseConfigured()) throw new Error("Firebase not configured");
  const db = getDb();
  const uid = user.uid;

  // Find the nickname-registry key to release (so the name frees up again).
  const profSnap = await getDoc(doc(db, "profiles", uid));
  const nicknameLower = profSnap.exists()
    ? ((profSnap.data() as Profile).nicknameLower ?? null)
    : null;

  // Bulk content: own posts, follow edges (both directions), notifications.
  await Promise.allSettled([
    deleteAll(query(collection(db, "posts"), where("authorId", "==", uid))),
    deleteAll(query(collection(db, "follows"), where("followerId", "==", uid))),
    deleteAll(query(collection(db, "follows"), where("followeeId", "==", uid))),
    deleteAll(collection(db, "users", uid, "notifications")),
  ]);

  // Singletons: private sync doc (routines + workout history), public profile,
  // and the nickname registry entry.
  await Promise.allSettled([
    deleteDoc(doc(db, "users", uid)),
    deleteDoc(doc(db, "profiles", uid)),
    ...(nicknameLower ? [deleteDoc(doc(db, "usernames", nicknameLower))] : []),
  ]);

  // Finally remove the auth account. If the session is too old, Firebase
  // requires a fresh login first — re-auth via Google popup and retry once.
  try {
    await deleteUser(user);
  } catch (err) {
    if ((err as { code?: string }).code === "auth/requires-recent-login") {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await deleteUser(user);
    } else {
      throw err;
    }
  }
}
