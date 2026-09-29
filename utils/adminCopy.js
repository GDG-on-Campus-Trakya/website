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
//   if (!confirm(a.confirmDelete(user.name))) return;

const STRINGS = {
  tr: {
    // Access / loading guards (every guarded admin page)
    loading: "Yükleniyor...",
    accessDenied: "Erişim Reddedildi",
    accessDeniedToast: "Bu sayfaya erişim yetkiniz yok!",
    loginRequired: "Giriş yapmalısınız!",

    // Navigation
    backToAdmin: "Admin Paneline Dön",

    // Generic action labels
    save: "Kaydet",
    saving: "Kaydediliyor...",
    cancel: "İptal",
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
    errorOccurred: "Bir hata oluştu!",
  },
  en: {
    loading: "Loading...",
    accessDenied: "Access Denied",
    accessDeniedToast: "You don't have permission to access this page!",
    loginRequired: "You need to sign in!",

    backToAdmin: "Back to Admin Panel",

    save: "Save",
    saving: "Saving...",
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

    errorOccurred: "An error occurred!",
  },
};

const HELPERS = {
  tr: {
    confirmDelete: (name) =>
      name
        ? `"${name}" öğesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
        : "Silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
  },
  en: {
    confirmDelete: (name) =>
      name
        ? `Are you sure you want to delete "${name}"? This action cannot be undone.`
        : "Are you sure you want to delete this? This action cannot be undone.",
  },
};

export function adminCopy(locale) {
  const lang = locale === "en" ? "en" : "tr";
  return { ...STRINGS[lang], ...HELPERS[lang] };
}

export default adminCopy;
