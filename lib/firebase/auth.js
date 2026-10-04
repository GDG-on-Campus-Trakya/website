import {
  initializeAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence
} from "firebase/auth";
import { app } from "./app";

// No popup resolver here. With one, Firebase loads Google's gapi script and the auth iframe
// on mobile and Safari before it reports the signed-in user, on every page. Popup sign-in
// passes popupResolver() instead. IndexedDB is preferred, localStorage is the fallback
// (Safari private mode).
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence]
});
export const googleProvider = new GoogleAuthProvider();

let PopupResolver = null;

// signInWithPopup builds its resolver from the class it is given. This class hands back one
// shared instance, so the iframe loaded by preparePopupSignIn() is the one the click uses.
// Created on first use: the server build exports no resolver class to extend.
export function popupResolver() {
  if (!PopupResolver) {
    let shared = null;
    PopupResolver = class extends browserPopupRedirectResolver {
      constructor() {
        if (shared) return shared;
        super();
        shared = this;
      }
    };
  }
  return PopupResolver;
}

// Load the auth iframe before the click. signInWithPopup loads it first and only then opens
// the window, and Safari and mobile browsers block a window that opens after a slow load.
export function preparePopupSignIn() {
  const Resolver = popupResolver();
  Promise.resolve()
    .then(() => new Resolver()._initialize(auth))
    .catch(() => {});
}
