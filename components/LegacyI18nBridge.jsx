"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { toast } from "react-toastify";
import { translateLegacyText } from "@/utils/legacyTranslations";

const TEXT_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"];

function translateNodeText(node, locale) {
  if (!node || node.nodeType !== Node.TEXT_NODE) {
    return;
  }

  const parentTag = node.parentElement?.tagName;
  if (
    !node.textContent?.trim() ||
    ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parentTag)
  ) {
    return;
  }

  const translated = translateLegacyText(node.textContent, locale);
  if (translated !== node.textContent) {
    node.textContent = translated;
  }
}

function translateAttributes(element, locale) {
  for (const attributeName of TEXT_ATTRIBUTES) {
    const value = element.getAttribute?.(attributeName);
    if (!value) continue;

    const translated = translateLegacyText(value, locale);
    if (translated !== value) {
      element.setAttribute(attributeName, translated);
    }
  }
}

function translateTree(root, locale) {
  if (!root || locale !== "en") {
    return;
  }

  if (root.nodeType === Node.TEXT_NODE) {
    translateNodeText(root, locale);
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateAttributes(root, locale);
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );

  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current.nodeType === Node.TEXT_NODE) {
      translateNodeText(current, locale);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(current, locale);
    }
  }
}

export default function LegacyI18nBridge() {
  const locale = useLocale();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const originalAlert = window.alert.bind(window);
    const originalConfirm = window.confirm.bind(window);
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    const originalToLocaleString = Date.prototype.toLocaleString;
    const toastFns = {
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
    };

    window.alert = (message) =>
      originalAlert(
        typeof message === "string"
          ? translateLegacyText(message, locale)
          : message
      );

    window.confirm = (message) =>
      originalConfirm(
        typeof message === "string"
          ? translateLegacyText(message, locale)
          : message
      );

    Date.prototype.toLocaleDateString = function patchedToLocaleDateString(
      requestedLocale,
      options
    ) {
      const normalizedLocale =
        locale === "en" &&
        (requestedLocale === "tr-TR" || requestedLocale === "tr")
          ? "en-US"
          : requestedLocale;

      return originalToLocaleDateString.call(this, normalizedLocale, options);
    };

    Date.prototype.toLocaleString = function patchedToLocaleString(
      requestedLocale,
      options
    ) {
      const normalizedLocale =
        locale === "en" &&
        (requestedLocale === "tr-TR" || requestedLocale === "tr")
          ? "en-US"
          : requestedLocale;

      return originalToLocaleString.call(this, normalizedLocale, options);
    };

    toast.success = (message, options) =>
      toastFns.success(
        typeof message === "string"
          ? translateLegacyText(message, locale)
          : message,
        options
      );
    toast.error = (message, options) =>
      toastFns.error(
        typeof message === "string"
          ? translateLegacyText(message, locale)
          : message,
        options
      );
    toast.info = (message, options) =>
      toastFns.info(
        typeof message === "string"
          ? translateLegacyText(message, locale)
          : message,
        options
      );
    toast.warning = (message, options) =>
      toastFns.warning(
        typeof message === "string"
          ? translateLegacyText(message, locale)
          : message,
        options
      );

    let frameId = null;
    const queueTranslate = (root = document.body) => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        translateTree(root, locale);
      });
    };

    queueTranslate();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateNodeText(mutation.target, locale);
          continue;
        }

        if (mutation.type === "attributes" && mutation.target) {
          translateAttributes(mutation.target, locale);
          continue;
        }

        mutation.addedNodes.forEach((node) => queueTranslate(node));
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TEXT_ATTRIBUTES,
    });

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      observer.disconnect();
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
      Date.prototype.toLocaleString = originalToLocaleString;
      toast.success = toastFns.success;
      toast.error = toastFns.error;
      toast.info = toastFns.info;
      toast.warning = toastFns.warning;
    };
  }, [locale]);

  return null;
}
