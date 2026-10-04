"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COPY = {
  tr: { confirm: "Devam et", destructive: "Sil", cancel: "Vazgeç" },
  en: { confirm: "Continue", destructive: "Delete", cancel: "Cancel" },
};

const ConfirmContext = createContext(null);

/**
 * A promise-based replacement for window.confirm, drawn in the site's own dialog:
 * `if (!(await confirm(message, { destructive: true }))) return;`
 * The native dialog ignores the page language and styling, blocks the tab, and on some
 * phones is suppressed after the first use.
 */
export function ConfirmProvider({ children }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (message, options = {}) =>
      new Promise((resolve) => {
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setRequest({ message, options });
      }),
    []
  );

  const settle = (value) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
  };

  const destructive = Boolean(request?.options.destructive);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={Boolean(request)} onOpenChange={(open) => !open && settle(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="whitespace-pre-line text-lg leading-snug">
              {request?.message}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel onClick={() => settle(false)}>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: destructive ? "destructive" : "default" })}
              onClick={() => settle(true)}
            >
              {request?.options.confirmLabel || (destructive ? copy.destructive : copy.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/** Outside a ConfirmProvider it falls back to the browser's dialog. */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  return confirm ?? ((message) => Promise.resolve(window.confirm(message)));
}
