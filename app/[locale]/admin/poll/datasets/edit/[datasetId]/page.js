"use client";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import { adminCopy } from "@/utils/adminCopy";
import {
  uploadDatasetImage,
  updateDataset
} from "@/utils/datasetUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

const COPY = {
  tr: {
    datasetNotFound: "Veri seti bulunamadı!",
    datasetLoadError: "Veri seti yüklenirken hata oluştu!",
    onlyImages: "Sadece resim dosyaları yüklenebilir!",
    itemNameRequired: "Öğe adı gerekli!",
    imageRequired: "Resim gerekli!",
    itemAdded: "Öğe eklendi!",
    itemRemoved: "Öğe kaldırıldı",
    itemUpdated: "Öğe güncellendi!",
    datasetNameRequired: "Veri seti adı gerekli!",
    minItems: "En az 8 öğe olmalı!",
    uploadingImage: (i, total) => `Resim yükleniyor ${i}/${total}...`,
    datasetUpdated: "Veri seti güncellendi!",
    datasetUpdateError: "Veri seti güncellenirken hata oluştu!",
    pageTitle: "Veri Seti Düzenle",
    pageSubtitle: "Veri setini düzenleyin ve güncelleyin",
    datasets: "Veri Setleri",
    datasetNameLabel: "Veri Seti Adı *",
    datasetNamePlaceholder: "Örn: En İyi Futbolcular",
    descriptionLabel: "Açıklama",
    descriptionPlaceholder: "Veri seti hakkında kısa açıklama",
    addItemHeading: "Yeni Öğe Ekle",
    itemNameLabel: "Öğe Adı *",
    itemNamePlaceholder: "Örn: Lionel Messi",
    itemDescriptionPlaceholder: "Örn: 8 Ballon d'Or",
    imageLabel: "Resim *",
    addItemButton: "Öğe Ekle",
    currentItemsHeading: (n) => `Mevcut Öğeler (${n})`,
    noItemsYet: "Henüz öğe yok. En az 8 öğe olmalı.",
    itemNameInputPlaceholder: "Öğe adı",
    updating: "Güncelleniyor...",
    updateDatasetButton: "Veri Setini Güncelle",
  },
  en: {
    datasetNotFound: "Dataset not found!",
    datasetLoadError: "An error occurred while loading the dataset!",
    onlyImages: "Only image files can be uploaded!",
    itemNameRequired: "Item name is required!",
    imageRequired: "Image is required!",
    itemAdded: "Item added!",
    itemRemoved: "Item removed",
    itemUpdated: "Item updated!",
    datasetNameRequired: "Dataset name is required!",
    minItems: "There must be at least 8 items!",
    uploadingImage: (i, total) => `Uploading image ${i}/${total}...`,
    datasetUpdated: "Dataset updated!",
    datasetUpdateError: "An error occurred while updating the dataset!",
    pageTitle: "Edit Dataset",
    pageSubtitle: "Edit and update the dataset",
    datasets: "Datasets",
    datasetNameLabel: "Dataset Name *",
    datasetNamePlaceholder: "e.g.: Best Footballers",
    descriptionLabel: "Description",
    descriptionPlaceholder: "A short description of the dataset",
    addItemHeading: "Add New Item",
    itemNameLabel: "Item Name *",
    itemNamePlaceholder: "e.g.: Lionel Messi",
    itemDescriptionPlaceholder: "e.g.: 8 Ballon d'Or",
    imageLabel: "Image *",
    addItemButton: "Add Item",
    currentItemsHeading: (n) => `Current Items (${n})`,
    noItemsYet: "No items yet. There must be at least 8 items.",
    itemNameInputPlaceholder: "Item name",
    updating: "Updating...",
    updateDatasetButton: "Update Dataset",
  },
};

export default function EditDatasetPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const params = useParams();
  const datasetId = params.datasetId;

  const [darkMode, setDarkMode] = useState(true);
  const [loadingDataset, setLoadingDataset] = useState(true);

  // Dataset state
  const [datasetName, setDatasetName] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [items, setItems] = useState([]);
  const [currentItemName, setCurrentItemName] = useState("");
  const [currentItemDescription, setCurrentItemDescription] = useState("");
  const [currentItemImage, setCurrentItemImage] = useState(null);
  const [updatingDataset, setUpdatingDataset] = useState(false);

  // Edit item state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemImage, setEditItemImage] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && datasetId) {
      loadDataset();
    }
  }, [user, datasetId]);

  const loadDataset = async () => {
    setLoadingDataset(true);
    try {
      const datasetRef = doc(db, "pollDatasets", datasetId);
      const datasetDoc = await getDoc(datasetRef);

      if (!datasetDoc.exists()) {
        toast.error(copy.datasetNotFound);
        router.push("/admin/poll/datasets");
        return;
      }

      const data = datasetDoc.data();
      setDatasetName(data.name || "");
      setDatasetDescription(data.description || "");
      setItems(data.items || []);
    } catch (error) {
      logger.error("Error loading dataset:", error);
      toast.error(copy.datasetLoadError);
    }
    setLoadingDataset(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(copy.onlyImages);
      return;
    }

    setCurrentItemImage(file);
  };

  const handleEditImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(copy.onlyImages);
      return;
    }

    setEditItemImage(file);
  };

  const handleAddItem = () => {
    if (!currentItemName.trim()) {
      toast.error(copy.itemNameRequired);
      return;
    }

    if (!currentItemImage) {
      toast.error(copy.imageRequired);
      return;
    }

    const newItem = {
      id: `item_${Date.now()}`,
      name: currentItemName.trim(),
      description: currentItemDescription.trim(),
      imageFile: currentItemImage,
      imageUrl: null // Will be uploaded on save
    };

    setItems([...items, newItem]);
    setCurrentItemName("");
    setCurrentItemDescription("");
    setCurrentItemImage(null);

    // Reset file input
    const fileInput = document.getElementById("item-image-input");
    if (fileInput) fileInput.value = "";

    toast.success(copy.itemAdded);
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    toast.info(copy.itemRemoved);
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemDescription(item.description || "");
    setEditItemImage(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemName("");
    setEditItemDescription("");
    setEditItemImage(null);
  };

  const handleSaveEdit = () => {
    if (!editItemName.trim()) {
      toast.error(copy.itemNameRequired);
      return;
    }

    setItems(items.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          name: editItemName.trim(),
          description: editItemDescription.trim(),
          imageFile: editItemImage || item.imageFile,
          // Keep existing imageUrl if no new image
          imageUrl: editItemImage ? null : item.imageUrl
        };
      }
      return item;
    }));

    toast.success(copy.itemUpdated);
    handleCancelEdit();
  };

  const handleUpdateDataset = async () => {
    if (!datasetName.trim()) {
      toast.error(copy.datasetNameRequired);
      return;
    }

    if (items.length < 8) {
      toast.error(copy.minItems);
      return;
    }

    setUpdatingDataset(true);

    try {
      // Upload new images if any
      const itemsWithUrls = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let imageUrl = item.imageUrl;

        // If there's a new image file, upload it
        if (item.imageFile && !item.imageUrl) {
          toast.info(copy.uploadingImage(i + 1, items.length));
          imageUrl = await uploadDatasetImage(item.imageFile, datasetId);
        }

        itemsWithUrls.push({
          id: item.id,
          name: item.name,
          description: item.description,
          imageUrl
        });
      }

      // Update dataset
      await updateDataset(datasetId, {
        name: datasetName.trim(),
        description: datasetDescription.trim(),
        items: itemsWithUrls
      });

      toast.success(copy.datasetUpdated);
      setTimeout(() => {
        router.push("/admin/poll/datasets");
      }, 1500);
    } catch (error) {
      logger.error("Error updating dataset:", error);
      toast.error(copy.datasetUpdateError);
    }

    setUpdatingDataset(false);
  };

  if (loading || loadingDataset) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{a.loading}</p>
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
              <h1 className={`text-2xl sm:text-3xl font-bold ${textClass}`}>{copy.pageTitle}</h1>
              <p className={`${textSecondaryClass} text-sm sm:text-base mt-1`}>
                {copy.pageSubtitle}
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
                onClick={() => router.push("/admin/poll/datasets")}
                className={`px-4 py-2 rounded-lg ${cardBgClass} border ${borderClass} ${textClass} hover:opacity-80 text-sm sm:text-base`}
              >
                ← {copy.datasets}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className={`${cardBgClass} rounded-2xl p-6 sm:p-8 border ${borderClass}`}>
          {/* Dataset Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className={`block ${textClass} mb-2 font-semibold`}>
                {copy.datasetNameLabel}
              </label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                placeholder={copy.datasetNamePlaceholder}
              />
            </div>

            <div>
              <label className={`block ${textClass} mb-2 font-semibold`}>
                {copy.descriptionLabel}
              </label>
              <textarea
                value={datasetDescription}
                onChange={(e) => setDatasetDescription(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                rows={3}
                placeholder={copy.descriptionPlaceholder}
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className={`border ${borderClass} rounded-xl p-4 mb-6`}>
            <h3 className={`text-lg font-bold ${textClass} mb-4`}>{copy.addItemHeading}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block ${textClass} mb-2`}>{copy.itemNameLabel}</label>
                <input
                  type="text"
                  value={currentItemName}
                  onChange={(e) => setCurrentItemName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                  placeholder={copy.itemNamePlaceholder}
                />
              </div>

              <div>
                <label className={`block ${textClass} mb-2`}>{copy.descriptionLabel}</label>
                <input
                  type="text"
                  value={currentItemDescription}
                  onChange={(e) => setCurrentItemDescription(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textClass}`}
                  placeholder={copy.itemDescriptionPlaceholder}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className={`block ${textClass} mb-2`}>{copy.imageLabel}</label>
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
              {copy.addItemButton}
            </button>
          </div>

          {/* Items List */}
          <div className="mb-6">
            <h3 className={`text-lg font-bold ${textClass} mb-4`}>
              {copy.currentItemsHeading(items.length)}
            </h3>

            {items.length === 0 ? (
              <p className={`${textSecondaryClass} text-sm text-center py-8`}>
                {copy.noItemsYet}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`border ${borderClass} rounded-lg p-3`}
                  >
                    {editingItemId === item.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="aspect-square relative rounded overflow-hidden mb-2">
                          <img
                            src={editItemImage ? URL.createObjectURL(editItemImage) : (item.imageUrl || (item.imageFile ? URL.createObjectURL(item.imageFile) : ""))}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <input
                          type="text"
                          value={editItemName}
                          onChange={(e) => setEditItemName(e.target.value)}
                          className={`w-full px-2 py-1 rounded border ${borderClass} ${cardBgClass} ${textClass} text-sm`}
                          placeholder={copy.itemNameInputPlaceholder}
                        />
                        <input
                          type="text"
                          value={editItemDescription}
                          onChange={(e) => setEditItemDescription(e.target.value)}
                          className={`w-full px-2 py-1 rounded border ${borderClass} ${cardBgClass} ${textClass} text-sm`}
                          placeholder={copy.descriptionLabel}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageSelect}
                          className={`w-full text-xs ${textClass}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            {a.save}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                          >
                            {a.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="aspect-square relative rounded overflow-hidden mb-2">
                          <img
                            src={item.imageUrl || (item.imageFile ? URL.createObjectURL(item.imageFile) : "")}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className={`${textClass} font-semibold text-sm truncate`}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className={`${textSecondaryClass} text-xs truncate mb-2`}>
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                          >
                            {a.edit}
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          >
                            {a.delete}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin/poll/datasets")}
              className={`flex-1 py-3 rounded-lg border ${borderClass} ${textClass} hover:opacity-80 font-semibold`}
            >
              {a.cancel}
            </button>
            <button
              onClick={handleUpdateDataset}
              disabled={items.length < 8 || updatingDataset}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingDataset ? copy.updating : copy.updateDatasetButton}
            </button>
          </div>
        </div>
      </div>

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
