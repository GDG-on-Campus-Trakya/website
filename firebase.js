// firebase.js
// Auth and Firestore, which most pages use together. Storage and the Realtime Database
// come from lib/firebase/storage.js and lib/firebase/database.js, so only the pages
// that use them download those SDKs.
export { auth, googleProvider } from "@/lib/firebase/auth";
export { db } from "@/lib/firebase/firestore";
