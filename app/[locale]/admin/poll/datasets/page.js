"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import {
  createDataset,
  uploadDatasetImage,
  getAllDatasets,
  updateDataset,
  deleteDataset
} from "@/utils/datasetUtils";

export default function DatasetsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);

  // Create dataset state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [items, setItems] = useState([]);
  const [currentItemName, setCurrentItemName] = useState("");
  const [currentItemDescription, setCurrentItemDescription] = useState("");
  const [currentItemImage, setCurrentItemImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creatingDataset, setCreatingDataset] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const data = await getAllDatasets();
      setDatasets(data);
    } catch (error) {
      logger.error("Error loading datasets:", error);
      toast.error("Veri setleri yüklenirken hata oluştu!");
    }
    setLoadingDatasets(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Sadece resim dosyaları yüklenebilir!");
      return;
    }

    setCurrentItemImage(file);
  };

  const handleAddItem = () => {
    if (!currentItemName.trim()) {
      toast.error("Öğe adı gerekli!");
      return;
    }

    if (!currentItemImage) {
      toast.error("Resim gerekli!");
      return;
    }

    const newItem = {
      id: `item_${Date.now()}`,
      name: currentItemName.trim(),
      description: currentItemDescription.trim(),
      imageFile: currentItemImage
    };

    setItems([...items, newItem]);
    setCurrentItemName("");
    setCurrentItemDescription("");
    setCurrentItemImage(null);

    // Reset file input
    const fileInput = document.getElementById("item-image-input");
    if (fileInput) fileInput.value = "";

    toast.success("Öğe eklendi!");
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    toast.info("Öğe kaldırıldı");
  };

  const handleCreateDataset = async () => {
    if (!datasetName.trim()) {
      toast.error("Veri seti adı gerekli!");
      return;
    }

    if (items.length < 8) {
      toast.error("En az 8 öğe eklemelisiniz!");
      return;
    }

    setCreatingDataset(true);

    try {
      // First create dataset without images
      const datasetId = await createDataset({
        name: datasetName.trim(),
        description: datasetDescription.trim(),
        items: [],
        createdBy: user.uid,
        createdByName: user.displayName || user.email
      });

      // Upload images and create items with URLs
      const itemsWithUrls = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        toast.info(`Resim yükleniyor ${i + 1}/${items.length}...`);

        const imageUrl = await uploadDatasetImage(item.imageFile, datasetId);

        itemsWithUrls.push({
          id: item.id,
          name: item.name,
          description: item.description,
          imageUrl
        });
      }

      // Update dataset with items
      await updateDataset(datasetId, { items: itemsWithUrls });

      toast.success("Veri seti oluşturuldu!");
      setShowCreateModal(false);
      resetForm();
      loadDatasets();
    } catch (error) {
      logger.error("Error creating dataset:", error);
      toast.error("Veri seti oluşturulurken hata oluştu!");
    }

    setCreatingDataset(false);
  };

  const handleDeleteDataset = async (datasetId) => {
    if (!confirm("Bu veri setini silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteDataset(datasetId);
      toast.success("Veri seti silindi!");
      loadDatasets();
    } catch (error) {
      logger.error("Error deleting dataset:", error);
      toast.error("Veri seti silinirken hata oluştu!");
    }
  };

  const resetForm = () => {
    setDatasetName("");
    setDatasetDescription("");
    setItems([]);
    setCurrentItemName("");
    setCurrentItemDescription("");
    setCurrentItemImage(null);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const bgClass = darkMode ? "bg-gray-900" : "bg-gray-50";
  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textSecondaryClass = darkMode ? "text-gray-400" : "text-gray-600";
  const borderClass = darkMode ? "border-gray-700" : "border-gray-300";

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Header */}
      <div className={`${cardBgClass} border-b ${borderClass} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${textClass}`}>Veri Setleri</h1>
              <p className={`${textSecondaryClass} text-sm sm:text-base mt-1`}>
                Poll veri setlerinizi yönetin
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 sm:p-3 rounded-lg ${cardBgClass} border ${borderClass} hover:opacity-80`}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button
                onClick={() => router.push("/admin/poll")}
                className={`px-4 py-2 rounded-lg ${cardBgClass} border ${borderClass} ${textClass} hover:opacity-80 text-sm sm:text-base`}
              >
                ← Poll Yönetimi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-base sm:text-lg"
          >
            + Yeni Veri Seti Oluştur
          </button>
        </div>

        {/* Datasets Grid */}
        {loadingDatasets ? (
          <div className="text-center py-12">
            <p className={textClass}>Veri setleri yükleniyor...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className={`${cardBgClass} rounded-xl p-12 border ${borderClass} text-center`}>
            <div className="text-4xl sm:text-6xl mb-4">📁</div>
            <p className={`${textSecondaryClass} text-sm sm:text-base`}>
              Henüz veri seti yok. Hemen bir tane oluşturun!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`${cardBgClass} rounded-xl p-6 border ${borderClass} hover:border-purple-500 transition-colors`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${textClass} mb-1`}>
                      {dataset.name}
                    </h3>
                    <p className={`${textSecondaryClass} text-sm`}>
                      {dataset.description || "Açıklama yok"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className={textSecondaryClass}>Öğe Sayısı:</span>
                    <span className={textClass}>{dataset.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={textSecondaryClass}>Oluşturan:</span>
                    <span className={`${textClass} truncate ml-2`}>
                      {dataset.createdByName || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Preview Images */}
                {dataset.items && dataset.items.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {dataset.items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="aspect-square relative rounded overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/poll/datasets/edit/${dataset.id}`)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteDataset(dataset.id)}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dataset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBgClass} rounded-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${textClass}`}>Yeni Veri Seti Oluştur</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className={`p-2 rounded-lg hover:bg-gray-700 ${textClass}`}
              >
                ✕
              </button>
            </div>

            {/* Dataset Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block ${textClass} mb-2 font-semibold`}>
                  Veri Seti Adı *
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                  placeholder="Örn: En İyi Futbolcular"
                />
              </div>

              <div>
                <label className={`block ${textClass} mb-2 font-semibold`}>
                  Açıklama
                </label>
                <textarea
                  value={datasetDescription}
                  onChange={(e) => setDatasetDescription(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                  rows={3}
                  placeholder="Veri seti hakkında kısa açıklama"
                />
              </div>
            </div>

            {/* Add Item Section */}
            <div className={`border ${borderClass} rounded-xl p-4 mb-6`}>
              <h3 className={`text-lg font-bold ${textClass} mb-4`}>Öğe Ekle</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block ${textClass} mb-2`}>Öğe Adı *</label>
                  <input
                    type="text"
                    value={currentItemName}
                    onChange={(e) => setCurrentItemName(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                    placeholder="Örn: Lionel Messi"
                  />
                </div>

                <div>
                  <label className={`block ${textClass} mb-2`}>Açıklama</label>
                  <input
                    type="text"
                    value={currentItemDescription}
                    onChange={(e) => setCurrentItemDescription(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                    placeholder="Örn: 8 Ballon d'Or"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className={`block ${textClass} mb-2`}>Resim *</label>
                <input
                  id="item-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={`w-full ${textClass}`}
                />
                {currentItemImage && (
                  <p className={`${textSecondaryClass} text-sm mt-2`}>
                    ✓ {currentItemImage.name}
                  </p>
                )}
              </div>

              <button
                onClick={handleAddItem}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Öğe Ekle
              </button>
            </div>

            {/* Items List */}
            <div className="mb-6">
              <h3 className={`text-lg font-bold ${textClass} mb-4`}>
                Eklenen Öğeler ({items.length})
              </h3>

              {items.length === 0 ? (
                <p className={`${textSecondaryClass} text-sm text-center py-8`}>
                  Henüz öğe eklenmedi. En az 8 öğe eklemelisiniz.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`border ${borderClass} rounded-lg p-3 relative`}
                    >
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                      <div className="aspect-square relative rounded overflow-hidden mb-2">
                        <img
                          src={URL.createObjectURL(item.imageFile)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className={`${textClass} font-semibold text-sm truncate`}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className={`${textSecondaryClass} text-xs truncate`}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className={`flex-1 py-3 rounded-lg border ${borderClass} ${textClass} hover:opacity-80 font-semibold`}
              >
                İptal
              </button>
              <button
                onClick={handleCreateDataset}
                disabled={items.length < 8 || creatingDataset}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingDataset ? "Oluşturuluyor..." : "Veri Seti Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme={darkMode ? "dark" : "light"}
      />
    </div>
  );
}
