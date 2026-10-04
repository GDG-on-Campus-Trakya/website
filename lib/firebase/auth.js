import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence
} from "firebase/auth";
import { app } from "./app";

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Set auth persistence for better Safari performance
// IndexedDB is preferred, falls back to localStorage
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence)
    .catch((error) => {
      // If IndexedDB fails (some Safari private mode), try localStorage
      console.warn("IndexedDB persistence failed, falling back to localStorage:", error);
      return setPersistence(auth, browserLocalPersistence);
    })
    .catch((error) => {
      console.error("Auth persistence setup failed:", error);
    });
}
