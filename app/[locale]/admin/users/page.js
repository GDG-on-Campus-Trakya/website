"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";
import { adminCopy } from "@/utils/adminCopy";
import { formatLocalizedDate } from "@/utils/localeUtils";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminProtection from "@/components/AdminProtection";
import { Check, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import { useConfirm } from "@/components/ConfirmProvider";

const COPY = {
  tr: {
    pageTitle: "Kullanıcılar",
    pageSubtitle: "Siteye kayıtlı herkes, en yeni en üstte.",
    totalUsers: "Toplam",
    wantsEmails: "E-posta almak isteyen",
    thisMonth: "Bu ay katılan",
    search: "Ad ya da e-posta ara",
    noMatches: (q) => `"${q}" ile eşleşen kullanıcı yok.`,
    editUser: "Kullanıcıyı düzenle",
    addUser: "Kullanıcı ekle",
    userName: "Ad soyad",
    userNamePlaceholder: "",
    emailAddress: "E-posta",
    emailPlaceholder: "",
    wantsEmailsLabel: "E-posta bildirimleri almak istiyor",
    wantsEmailsHelp: "Etkinlik duyuruları ve önemli güncellemeler.",
    updateUserBtn: "Kaydet",
    addUserBtn: "Ekle",
    cancelBtn: "Vazgeç",
    allUsers: (n) => `Kullanıcılar (${n})`,
    noUsers: "Henüz kullanıcı yok",
    noUsersHelp: "Kullanıcılar siteye kayıt oldukça burada görünür.",
    receivingEmail: "E-posta alıyor",
    notReceivingEmail: "E-posta almıyor",
    registrationDate: (d) => `Katıldı: ${d}`,
    unknownDate: "tarih yok",
    userAdded: "Kullanıcı eklendi.",
    userAddError: "Kullanıcı eklenemedi. Yeniden dene.",
    userUpdated: "Kullanıcı güncellendi.",
    userUpdateError: "Kullanıcı güncellenemedi. Yeniden dene.",
    confirmDeleteUser:
      "Bu kullanıcı ve etkinlik kayıtları silinsin mi? Bu geri alınamaz.",
    userDeleted: "Kullanıcı ve kayıtları silindi.",
    userDeleteError: "Kullanıcı silinemedi. Yeniden dene.",
  },
  en: {
    pageTitle: "Users",
    pageSubtitle: "Everyone registered on the site, newest first.",
    totalUsers: "Total",
    wantsEmails: "Want e-mails",
    thisMonth: "Joined this month",
    search: "Search by name or e-mail",
    noMatches: (q) => `No user matches "${q}".`,
    editUser: "Edit user",
    addUser: "Add user",
    userName: "Full name",
    userNamePlaceholder: "",
    emailAddress: "E-mail",
    emailPlaceholder: "",
    wantsEmailsLabel: "Wants e-mail notifications",
    wantsEmailsHelp: "Event announcements and important updates.",
    updateUserBtn: "Save",
    addUserBtn: "Add",
    cancelBtn: "Cancel",
    allUsers: (n) => `Users (${n})`,
    noUsers: "No users yet",
    noUsersHelp: "Users appear here as they sign up on the site.",
    receivingEmail: "Gets e-mails",
    notReceivingEmail: "No e-mails",
    registrationDate: (d) => `Joined ${d}`,
    unknownDate: "no date",
    userAdded: "User added.",
    userAddError: "The user was not added. Try again.",
    userUpdated: "User updated.",
    userUpdateError: "The user was not updated. Try again.",
    confirmDeleteUser:
      "Delete this user and their event registrations? This cannot be undone.",
    userDeleted: "User and registrations deleted.",
    userDeleteError: "The user was not deleted. Try again.",
  },
};

// createdAt is a Timestamp on newer documents and a string on older ones; one Date for both.
const joinedAtOf = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export default function AdminUsersPage() {
  const confirm = useConfirm();
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);

  const [usersList, setUsersList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userFormData, setUserFormData] = useState({
    firestoreId: "",
    name: "",
    email: "",
    wantsToGetEmails: false,
    createdAt: "",
  });

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsersList(
        usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            firestoreId: doc.id,
            ...data,
            joinedAt: joinedAtOf(data.createdAt),
          };
        })
      );
    } catch (error) {
      logger.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef(null);
  const isEditing = !!userFormData.firestoreId;

  const formatJoined = (date) =>
    date
      ? formatLocalizedDate(date, locale, { day: "numeric", month: "short", year: "numeric" })
      : copy.unknownDate;

  const visibleUsers = useMemo(() => {
    const fold = (value) => (value || "").toLocaleLowerCase("tr");
    const needle = fold(search.trim());
    return usersList
      .filter((usr) => !needle || fold(usr.name).includes(needle) || fold(usr.email).includes(needle))
      .sort((x, y) => (y.joinedAt?.getTime() ?? 0) - (x.joinedAt?.getTime() ?? 0));
  }, [usersList, search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setUserFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setUserFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Reset the form
  const resetUserForm = () => {
    setShowForm(false);
    setUserFormData({
      firestoreId: "",
      name: "",
      email: "",
      wantsToGetEmails: false,
      createdAt: "",
    });
  };

  // Create a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        name: userFormData.name,
        email: userFormData.email,
        wantsToGetEmails: userFormData.wantsToGetEmails,
        createdAt: Timestamp.now(), // Use Timestamp instead of ISO string
      };
      const docRef = await addDoc(collection(db, "users"), newUser);
      setUsersList((prev) => [
        ...prev,
        {
          firestoreId: docRef.id,
          ...newUser,
          joinedAt: newUser.createdAt.toDate(),
        },
      ]);
      resetUserForm();
      toast.success(copy.userAdded);
    } catch (error) {
      logger.error("Error adding user:", error);
      toast.error(copy.userAddError);
    }
  };

  // Populate form for editing
  const handleEditUser = (userDoc) => {
    setUserFormData(userDoc);
    setShowForm(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", userFormData.firestoreId);
      const updateData = {
        name: userFormData.name,
        email: userFormData.email,
        wantsToGetEmails: userFormData.wantsToGetEmails,
        // Only update createdAt if it's empty or invalid
        ...((!userFormData.createdAt || userFormData.createdAt === "") && {
          createdAt: Timestamp.now(),
        }),
      };

      await setDoc(userRef, updateData, { merge: true });

      setUsersList((prev) =>
        prev.map((usr) =>
          usr.firestoreId === userFormData.firestoreId
            ? {
                ...usr,
                ...updateData,
                joinedAt:
                  updateData.createdAt instanceof Timestamp
                    ? updateData.createdAt.toDate()
                    : usr.joinedAt,
              }
            : usr
        )
      );
      resetUserForm();
      toast.success(copy.userUpdated);
    } catch (error) {
      logger.error("Error updating user:", error);
      toast.error(copy.userUpdateError);
    }
  };

  // Delete user
  const handleDeleteUser = async (firestoreId) => {
    if (!(await confirm(copy.confirmDeleteUser, { destructive: true }))) return;

    try {
      // First, get all registrations for this user
      const registrationsRef = collection(db, "registrations");
      const registrationsQuery = query(
        registrationsRef,
        where("userId", "==", firestoreId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);

      // Delete all registrations in a batch
      const batch = writeBatch(db);

      // Add user document to batch delete
      batch.delete(doc(db, "users", firestoreId));

      // Add all registrations to batch delete
      registrationsSnapshot.docs.forEach((registration) => {
        batch.delete(doc(db, "registrations", registration.id));
      });

      // Commit the batch
      await batch.commit();

      setUsersList((prev) =>
        prev.filter((user) => user.firestoreId !== firestoreId)
      );
      toast.success(copy.userDeleted);
    } catch (error) {
      logger.error("Error deleting user:", error);
      toast.error(copy.userDeleteError);
    }
  };

  return (
    <AdminProtection>
      <div>
        <PageHeader
          title={copy.pageTitle}
          description={copy.pageSubtitle}
          actions={
            !showForm && (
              <Button type="button" variant="outline" onClick={() => setShowForm(true)}>
                <Plus aria-hidden="true" />
                {copy.addUser}
              </Button>
            )
          }
        />

        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Stat label={copy.totalUsers} value={usersList.length} />
          <Stat
            label={copy.wantsEmails}
            value={usersList.filter((u) => u.wantsToGetEmails).length}
          />
          <Stat
            label={copy.thisMonth}
            value={
              usersList.filter((u) => {
                const now = new Date();
                return (
                  u.joinedAt &&
                  u.joinedAt.getMonth() === now.getMonth() &&
                  u.joinedAt.getFullYear() === now.getFullYear()
                );
              }).length
            }
          />
        </dl>

        {/* Add / edit form, shown on demand above the list */}
        {showForm && (
          <div ref={formRef} className="scroll-mt-6">
            <Section title={isEditing ? copy.editUser : copy.addUser}>
              <form
                onSubmit={isEditing ? handleUpdateUser : handleAddUser}
                className="max-w-2xl space-y-4"
              >
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  <Field id="user-name" label={copy.userName}>
                    <Input
                      type="text"
                      name="name"
                      placeholder={copy.userNamePlaceholder}
                      value={userFormData.name}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                  <Field id="user-email" label={copy.emailAddress}>
                    <Input
                      type="email"
                      name="email"
                      placeholder={copy.emailPlaceholder}
                      value={userFormData.email}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="wantsToGetEmails"
                      checked={userFormData.wantsToGetEmails}
                      onChange={handleChange}
                      id="wantsEmails"
                      className="h-5 w-5 shrink-0 rounded-sm border border-input accent-brand"
                    />
                    <label
                      htmlFor="wantsEmails"
                      className="cursor-pointer select-none text-sm font-medium"
                    >
                      {copy.wantsEmailsLabel}
                    </label>
                  </div>
                  <p className="ml-8 mt-1 text-sm text-muted-foreground">
                    {copy.wantsEmailsHelp}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit">
                    {isEditing ? copy.updateUserBtn : copy.addUserBtn}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetUserForm}>
                    {copy.cancelBtn}
                  </Button>
                </div>
              </form>
            </Section>
          </div>
        )}

        {/* Display / Manage Users */}
        <Section title={copy.allUsers(usersList.length)}>
          {usersList.length > 0 && (
            <div className="relative mb-4 max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.search}
                aria-label={copy.search}
                className="pl-10"
              />
            </div>
          )}
          {usersList.length === 0 ? (
            <EmptyState
              title={copy.noUsers}
              description={copy.noUsersHelp}
            />
          ) : visibleUsers.length === 0 ? (
            <p className="border-y border-rule py-6 text-sm text-muted-foreground">
              {copy.noMatches(search.trim())}
            </p>
          ) : (
            <ul className="border-t border-rule">
              {visibleUsers.map((usr) => (
                <li
                  key={usr.firestoreId}
                  className="flex flex-col gap-4 border-b border-rule py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-3 font-display font-bold text-ink">
                      {(usr.name || usr.email || "?").charAt(0).toLocaleUpperCase("tr")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="min-w-0 break-words text-base font-bold">
                          {usr.name}
                        </h3>
                        {usr.wantsToGetEmails ? (
                          <Badge variant="success">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            {copy.receivingEmail}
                          </Badge>
                        ) : (
                          <Badge variant="neutral">{copy.notReceivingEmail}</Badge>
                        )}
                      </div>
                      <p className="break-all text-sm text-ink-2">{usr.email}</p>
                      <p className="font-outlier text-xs text-muted-foreground">
                        {copy.registrationDate(formatJoined(usr.joinedAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(usr)}
                    >
                      {a.edit}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(usr.firestoreId)}
                    >
                      {a.delete}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <ToastContainer theme="light" />
      </div>
    </AdminProtection>
  );
}
