"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";
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
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";

export default function AdminUsersPage() {

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
            // Convert Timestamp to string when displaying
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toLocaleString()
                : data.createdAt,
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

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const isEditing = !!userFormData.firestoreId;

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
          createdAt: newUser.createdAt.toDate().toLocaleString(), // Convert for display
        },
      ]);
      resetUserForm();
      toast.success("Kullanıcı başarıyla eklendi!");
    } catch (error) {
      logger.error("Error adding user:", error);
      toast.error("Kullanıcı eklenirken bir hata oluştu!");
    }
  };

  // Populate form for editing
  const handleEditUser = (userDoc) => {
    setUserFormData(userDoc);
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
                createdAt:
                  updateData.createdAt instanceof Timestamp
                    ? updateData.createdAt.toDate().toLocaleString()
                    : usr.createdAt,
              }
            : usr
        )
      );
      resetUserForm();
      toast.success("Kullanıcı başarıyla güncellendi!");
    } catch (error) {
      logger.error("Error updating user:", error);
      toast.error("Kullanıcı güncellenirken bir hata oluştu!");
    }
  };

  // Delete user
  const handleDeleteUser = async (firestoreId) => {
    if (
      !confirm(
        "Bu kullanıcıyı ve tüm ilgili kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    )
      return;

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
      toast.success("Kullanıcı ve ilgili kayıtları başarıyla silindi!");
    } catch (error) {
      logger.error("Error deleting user:", error);
      toast.error("Kullanıcı silinirken bir hata oluştu!");
    }
  };

  return (
    <AdminProtection>
      <div>
        <PageHeader
          title="Kullanıcı Yönetimi"
          description="Tüm kullanıcıları görüntüleyin ve yönetin"
        />

        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Stat label="Toplam Kullanıcı" value={usersList.length} />
          <Stat
            label="Email Almak İsteyen"
            value={usersList.filter((u) => u.wantsToGetEmails).length}
          />
          <Stat
            label="Bu Ay Kayıt"
            value={
              usersList.filter((u) => {
                const createdAt = u.createdAt;
                if (!createdAt) return false;
                const userDate =
                  typeof createdAt === "string"
                    ? new Date(createdAt)
                    : createdAt;
                const now = new Date();
                return (
                  userDate.getMonth() === now.getMonth() &&
                  userDate.getFullYear() === now.getFullYear()
                );
              }).length
            }
          />
        </dl>

        {/* Add / Edit User Form */}
        <Section title={isEditing ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}>
          <form
            onSubmit={isEditing ? handleUpdateUser : handleAddUser}
            className="max-w-2xl space-y-4"
          >
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field id="user-name" label="Kullanıcı Adı *">
                <Input
                  type="text"
                  name="name"
                  placeholder="Kullanıcı adını girin..."
                  value={userFormData.name}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field id="user-email" label="Email Adresi *">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email adresini girin..."
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
                  Email bildirimleri almak istiyor
                </label>
              </div>
              <p className="ml-8 mt-1 text-sm text-muted-foreground">
                Etkinlik duyuruları ve önemli güncellemeler için
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit">
                {isEditing ? "Kullanıcı Güncelle" : "Kullanıcı Ekle"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetUserForm}>
                  İptal Et
                </Button>
              )}
            </div>
          </form>
        </Section>

        {/* Display / Manage Users */}
        <Section title={`Tüm Kullanıcılar (${usersList.length})`}>
          {usersList.length === 0 ? (
            <EmptyState
              title="Henüz kullanıcı bulunmuyor"
              description="İlk kullanıcıyı eklemek için yukarıdaki formu kullanın"
            />
          ) : (
            <ul className="border-t border-rule">
              {usersList.map((usr) => (
                <li
                  key={usr.firestoreId}
                  className="flex flex-col gap-4 border-b border-rule py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-3 font-display font-bold text-ink">
                      {usr.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="min-w-0 break-words text-base font-bold">
                          {usr.name}
                        </h3>
                        {usr.wantsToGetEmails ? (
                          <Badge variant="success">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Email Alıyor
                          </Badge>
                        ) : (
                          <Badge variant="error">
                            <X className="h-3 w-3" aria-hidden="true" />
                            Email Almıyor
                          </Badge>
                        )}
                      </div>
                      <p className="break-all text-sm text-ink-2">{usr.email}</p>
                      <p className="font-outlier text-xs text-muted-foreground">
                        Kayıt Tarihi: {usr.createdAt}
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
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(usr.firestoreId)}
                    >
                      Sil
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
