// Shared UI strings for the admin panel pages.
//
// Pair this with a page-local COPY object: use `adminCopy(locale)` for the
// generic, high-frequency labels/toasts that repeat across admin pages
// (Save/Delete/Edit, access guards, loading), and keep page-specific text in
// the page's own COPY object.
//
// Usage:
//   import { adminCopy } from "@/utils/adminCopy";
//   const locale = useLocale() === "en" ? "en" : "tr";
//   const a = adminCopy(locale);
//   ...
//   toast.error(a.accessDeniedToast);
//   <button>{a.delete}</button>
//   if (!(await confirm(a.confirmDelete(user.name), { destructive: true }))) return;

const STRINGS = {
  tr: {
    // Access / loading guards (every guarded admin page)
    loading: "Yükleniyor…",
    accessDenied: "Bu sayfaya erişimin yok.",
    accessDeniedToast: "Bu sayfaya erişimin yok.",
    loginRequired: "Önce giriş yap.",

    // Navigation
    backToAdmin: "Yönetim paneline dön",

    // Generic action labels
    save: "Kaydet",
    saving: "Kaydediliyor…",
    cancel: "Vazgeç",
    edit: "Düzenle",
    delete: "Sil",
    remove: "Kaldır",
    create: "Oluştur",
    update: "Güncelle",
    add: "Ekle",
    close: "Kapat",
    search: "Ara",
    active: "Aktif",
    passive: "Pasif",

    // Generic feedback
    errorOccurred: "İşlem tamamlanamadı. Yeniden dene.",
  },
  en: {
    loading: "Loading…",
    accessDenied: "You do not have access to this page.",
    accessDeniedToast: "You do not have access to this page.",
    loginRequired: "Sign in first.",

    backToAdmin: "Back to the admin panel",

    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    remove: "Remove",
    create: "Create",
    update: "Update",
    add: "Add",
    close: "Close",
    search: "Search",
    active: "Active",
    passive: "Inactive",

    errorOccurred: "That did not work. Try again.",
  },
};

const HELPERS = {
  tr: {
    confirmDelete: (name) =>
      name
        ? `"${name}" silinsin mi? Bu geri alınamaz.`
        : "Silinsin mi? Bu geri alınamaz.",
  },
  en: {
    confirmDelete: (name) =>
      name
        ? `Delete "${name}"? This cannot be undone.`
        : "Delete this? This cannot be undone.",
  },
};

export function adminCopy(locale) {
  const lang = locale === "en" ? "en" : "tr";
  return { ...STRINGS[lang], ...HELPERS[lang] };
}

export default adminCopy;
