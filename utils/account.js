import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { checkUserRole } from "./roleUtils";

/**
 * The signed-in user's profile document and admin role, read together. AuthProvider loads this
 * module on demand, so signed-out visitors never download Firestore.
 */
export async function loadAccount(user, locale) {
  const userRef = doc(db, "users", user.uid);
  const [snapshot, role] = await Promise.all([getDoc(userRef), checkUserRole(user.email)]);

  if (snapshot.exists()) {
    return { profile: snapshot.data(), role };
  }

  // No profile document yet (an older account, or the write after sign-up failed). Unverified
  // email sign-ups are left alone: the login page writes those with the name they typed.
  if (!user.emailVerified) {
    return { profile: null, role };
  }

  const profile = {
    name: user.displayName || user.email?.split("@")[0] || "New User",
    email: user.email,
    wantsToGetEmails: true,
    language: locale,
    createdAt: new Date().toISOString()
  };
  await setDoc(userRef, profile, { merge: true });
  return { profile, role };
}
