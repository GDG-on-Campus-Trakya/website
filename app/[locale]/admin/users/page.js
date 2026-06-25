"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";
import { adminCopy } from "@/utils/adminCopy";
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
import { Link } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminProtection from "@/components/AdminProtection";

const COPY = {
  tr: {
    pageTitle: "Kullanıcı Yönetimi",
    pageSubtitle: "Tüm kullanıcıları görüntüleyin ve yönetin",
    totalUsers: "Toplam Kullanıcı",
    wantsEmails: "Email Almak İsteyen",
    thisMonth: "Bu Ay Kayıt",
    editUser: "Kullanıcı Düzenle",
    addUser: "Yeni Kullanıcı Ekle",
    userName: "Kullanıcı Adı *",
    userNamePlaceholder: "Kullanıcı adını girin...",
    emailAddress: "Email Adresi *",
    emailPlaceholder: "Email adresini girin...",
    wantsEmailsLabel: "Email bildirimleri almak istiyor",
    wantsEmailsHelp: "Etkinlik duyuruları ve önemli güncellemeler için",
    updateUserBtn: "Kullanıcı Güncelle",
    addUserBtn: "Kullanıcı Ekle",
    cancelBtn: "İptal Et",
    allUsers: (n) => `Tüm Kullanıcılar (${n})`,
    noUsers: "Henüz kullanıcı bulunmuyor",
    noUsersHelp: "İlk kullanıcıyı eklemek için yukarıdaki formu kullanın",
    receivingEmail: "Email Alıyor",
    notReceivingEmail: "Email Almıyor",
    registrationDate: (d) => `Kayıt Tarihi: ${d}`,
    userAdded: "Kullanıcı başarıyla eklendi!",
    userAddError: "Kullanıcı eklenirken bir hata oluştu!",
    userUpdated: "Kullanıcı başarıyla güncellendi!",
    userUpdateError: "Kullanıcı güncellenirken bir hata oluştu!",
    confirmDeleteUser:
      "Bu kullanıcıyı ve tüm ilgili kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    userDeleted: "Kullanıcı ve ilgili kayıtları başarıyla silindi!",
    userDeleteError: "Kullanıcı silinirken bir hata oluştu!",
  },
  en: {
    pageTitle: "User Management",
    pageSubtitle: "View and manage all users",
    totalUsers: "Total Users",
    wantsEmails: "Wants Emails",
    thisMonth: "Registered This Month",
    editUser: "Edit User",
    addUser: "Add New User",
    userName: "Username *",
    userNamePlaceholder: "Enter the username...",
    emailAddress: "Email Address *",
    emailPlaceholder: "Enter the email address...",
    wantsEmailsLabel: "Wants to receive email notifications",
    wantsEmailsHelp: "For event announcements and important updates",
    updateUserBtn: "Update User",
    addUserBtn: "Add User",
    cancelBtn: "Cancel",
    allUsers: (n) => `All Users (${n})`,
    noUsers: "No users yet",
    noUsersHelp: "Use the form above to add the first user",
    receivingEmail: "Receiving Email",
    notReceivingEmail: "Not Receiving Email",
    registrationDate: (d) => `Registration Date: ${d}`,
    userAdded: "User added successfully!",
    userAddError: "An error occurred while adding the user!",
    userUpdated: "User updated successfully!",
    userUpdateError: "An error occurred while updating the user!",
    confirmDeleteUser:
      "Are you sure you want to delete this user and all related records? This action cannot be undone.",
    userDeleted: "User and related records deleted successfully!",
    userDeleteError: "An error occurred while deleting the user!",
  },
};

export default function AdminUsersPage() {
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
      toast.success(copy.userAdded);
    } catch (error) {
      logger.error("Error adding user:", error);
      toast.error(copy.userAddError);
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
      toast.success(copy.userUpdated);
    } catch (error) {
      logger.error("Error updating user:", error);
      toast.error(copy.userUpdateError);
    }
  };

  // Delete user
  const handleDeleteUser = async (firestoreId) => {
    if (!confirm(copy.confirmDeleteUser)) return;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      {/* Back to Admin Panel Button */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-3 text-sm sm:text-base bg-gray-800/70 backdrop-blur-lg text-gray-200 rounded-2xl hover:bg-gray-700/90 transition-all duration-300 border border-gray-700/50 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {a.backToAdmin}
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            {copy.pageTitle}
          </h1>
          <div className="h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full"></div>
        </div>
        <p className="text-gray-300 mt-4 text-lg">
          {copy.pageSubtitle}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                {copy.totalUsers}
              </p>
              <p className="text-3xl font-bold text-blue-400">
                {usersList.length}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                {copy.wantsEmails}
              </p>
              <p className="text-3xl font-bold text-green-400">
                {usersList.filter((u) => u.wantsToGetEmails).length}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{copy.thisMonth}</p>
              <p className="text-3xl font-bold text-purple-400">
                {
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
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit User Form */}
      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg mr-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            {isEditing ? copy.editUser : copy.addUser}
          </h2>
        </div>

        <form
          onSubmit={isEditing ? handleUpdateUser : handleAddUser}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {copy.userName}
              </label>
              <input
                type="text"
                name="name"
                placeholder={copy.userNamePlaceholder}
                value={userFormData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-100 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {copy.emailAddress}
              </label>
              <input
                type="email"
                name="email"
                placeholder={copy.emailPlaceholder}
                value={userFormData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="bg-gray-700/40 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="wantsToGetEmails"
                checked={userFormData.wantsToGetEmails}
                onChange={handleChange}
                id="wantsEmails"
                className="h-5 w-5 text-blue-600 border-2 border-gray-500 rounded-lg focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor="wantsEmails"
                className="text-gray-200 select-none cursor-pointer font-medium"
              >
                {copy.wantsEmailsLabel}
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-8">
              {copy.wantsEmailsHelp}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                isEditing
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
              }`}
            >
              {isEditing ? copy.updateUserBtn : copy.addUserBtn}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetUserForm}
                className="flex-1 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-semibold text-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {copy.cancelBtn}
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Display / Manage Users */}
      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
              {copy.allUsers(usersList.length)}
            </h2>
          </div>
        </div>

        {usersList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-300 mb-2">
              {copy.noUsers}
            </p>
            <p className="text-sm text-gray-400">
              {copy.noUsersHelp}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {usersList.map((usr) => (
              <div
                key={usr.firestoreId}
                className="bg-gray-700/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {usr.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-100">
                          {usr.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {usr.wantsToGetEmails ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {copy.receivingEmail}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {copy.notReceivingEmail}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 mb-1">{usr.email}</p>
                      <p className="text-xs text-gray-400">
                        {copy.registrationDate(usr.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => handleEditUser(usr)}
                      className="flex-1 lg:flex-none bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                    >
                      {a.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(usr.firestoreId)}
                      className="flex-1 lg:flex-none bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                    >
                      {a.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <ToastContainer theme="dark" />
    </div>
    </AdminProtection>
  );
}
