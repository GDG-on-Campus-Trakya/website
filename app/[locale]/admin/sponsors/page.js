"use client";
// admin/sponsors/page.js
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminSponsorsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sponsor state
  const [sponsors, setSponsors] = useState([]);

  // Auto-refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Sponsor form data and editing
  const [sponsorFormData, setSponsorFormData] = useState({
    firestoreId: "",
    name: "",
    img_url: "",
    website_url: "",
  });

  const router = useRouter();

  // Check if the user is admin
  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setIsAdmin(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        logger.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  // Fetch sponsors
  const fetchSponsors = async () => {
    try {
      const sponsorSnapshot = await getDocs(collection(db, "sponsors"));
      setSponsors(
        sponsorSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      logger.error("Error fetching sponsors:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSponsors();
    }
  }, [isAdmin, refreshKey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Handle input changes for sponsor form
  const handleSponsorChange = (e) => {
    const { name, value } = e.target;
    setSponsorFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset sponsor form
  const resetSponsorForm = () => {
    setSponsorFormData({
      firestoreId: "",
      name: "",
      img_url: "",
      website_url: "",
    });
  };

  // Add a new sponsor
  const handleAddSponsor = async (e) => {
    e.preventDefault();
    try {
      const newSponsor = {
        name: sponsorFormData.name,
        img_url: sponsorFormData.img_url,
        website_url: sponsorFormData.website_url,
      };
      const docRef = await addDoc(collection(db, "sponsors"), newSponsor);
      setSponsors((prev) => [
        ...prev,
        { firestoreId: docRef.id, ...newSponsor },
      ]);
      resetSponsorForm();
      toast.success("Sponsor başarıyla eklendi!");
    } catch (error) {
      logger.error("Error adding sponsor:", error);
      toast.error("Sponsor eklenirken bir hata oluştu!");
    }
  };

  // Edit an existing sponsor
  const handleEditSponsor = (sponsor) => {
    setSponsorFormData(sponsor);
  };

  // Update an existing sponsor
  const handleUpdateSponsor = async (e) => {
    e.preventDefault();
    try {
      const sponsorRef = doc(db, "sponsors", sponsorFormData.firestoreId);
      await setDoc(
        sponsorRef,
        {
          name: sponsorFormData.name,
          img_url: sponsorFormData.img_url,
          website_url: sponsorFormData.website_url,
        },
        { merge: true }
      );
      setSponsors((prev) =>
        prev.map((s) =>
          s.firestoreId === sponsorFormData.firestoreId
            ? { ...s, ...sponsorFormData }
            : s
        )
      );
      resetSponsorForm();
      toast.success("Sponsor başarıyla güncellendi!");
    } catch (error) {
      logger.error("Error updating sponsor:", error);
      toast.error("Sponsor güncellenirken bir hata oluştu!");
    }
  };

  // Delete sponsor
  const handleDeleteSponsor = async (firestoreId) => {
    if (
      !confirm(
        "Bu sponsoru silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "sponsors", firestoreId));
      setSponsors((prev) =>
        prev.filter((sponsor) => sponsor.firestoreId !== firestoreId)
      );
      toast.success("Sponsor başarıyla silindi!");
    } catch (error) {
      logger.error("Error deleting sponsor:", error);
      toast.error("Sponsor silinirken bir hata oluştu!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-200">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  const isEditing = !!sponsorFormData.firestoreId;

  return (
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
          Admin Paneline Geri Dön
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Sponsor Yönetimi
          </h1>
          <div className="h-1 bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 rounded-full"></div>
        </div>
        <p className="text-gray-300 mt-4 text-lg">
          Tüm sponsorları görüntüleyin ve yönetin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">
                Toplam Sponsor
              </p>
              <p className="text-3xl font-bold text-green-400">
                {sponsors.length}
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
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6m0 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6m16 0V6a2 2 0 00-2-2H4a2 2 0 00-2 2v0m16 0h2m-2 0h2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">
                Aktif Sponsorlar
              </p>
              <p className="text-3xl font-bold text-teal-400">
                {sponsors.filter((s) => s.website_url && s.img_url).length}
              </p>
            </div>
            <div className="p-3 bg-teal-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Bu Ay Eklenen</p>
              <p className="text-3xl font-bold text-blue-400">0</p>
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor Form */}
      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg mr-3">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l5.5-3.5L16 21z"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            {isEditing ? "Sponsor Düzenle" : "Yeni Sponsor Ekle"}
          </h2>
        </div>

        <form
          onSubmit={isEditing ? handleUpdateSponsor : handleAddSponsor}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Sponsor Adı *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Sponsor adını girin..."
              value={sponsorFormData.name}
              onChange={handleSponsorChange}
              required
              className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Logo URL *
              </label>
              <input
                type="url"
                name="img_url"
                placeholder="https://example.com/logo.png"
                value={sponsorFormData.img_url}
                onChange={handleSponsorChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                name="website_url"
                placeholder="https://sponsor-website.com"
                value={sponsorFormData.website_url}
                onChange={handleSponsorChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Preview */}
          {sponsorFormData.img_url && (
            <div className="bg-gray-700/40 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-200 mb-3">
                Logo Önizlemesi:
              </p>
              <div className="flex items-center space-x-4">
                <img
                  src={sponsorFormData.img_url}
                  alt="Sponsor Logo Preview"
                  className="w-16 h-16 object-contain bg-gray-800 rounded-lg border border-gray-600"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div>
                  <p className="font-medium text-gray-100">
                    {sponsorFormData.name || "Sponsor Adı"}
                  </p>
                  <p className="text-sm text-gray-300">
                    {sponsorFormData.website_url || "Website URL"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                isEditing
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
              }`}
            >
              {isEditing ? "Sponsor Güncelle" : "Sponsor Ekle"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetSponsorForm}
                className="flex-1 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-semibold text-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                İptal Et
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Manage Sponsors */}
      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg mr-3">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l5.5-3.5L16 21z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
              Tüm Sponsorlar ({sponsors.length})
            </h2>
          </div>
        </div>

        {sponsors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full flex items-center justify-center mb-4">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l5.5-3.5L16 21z"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-400 mb-2">
              Henüz sponsor bulunmuyor
            </p>
            <p className="text-sm text-gray-400">
              İlk sponsoru eklemek için yukarıdaki formu kullanın
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.firestoreId}
                className="bg-gray-700/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-xl border border-gray-600 flex items-center justify-center overflow-hidden">
                    {sponsor.img_url ? (
                      <img
                        src={sponsor.img_url}
                        alt={sponsor.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full bg-gradient-to-r from-green-400 to-teal-400 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {sponsor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-100 mb-1">
                      {sponsor.name}
                    </h3>
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-800 underline break-all"
                    >
                      {sponsor.website_url}
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditSponsor(sponsor)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteSponsor(sponsor.firestoreId)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
