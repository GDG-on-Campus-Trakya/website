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
import {
  uploadDatasetImage,
  updateDataset
} from "@/utils/datasetUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Section } from "@/components/ui/page";
import { adminCopy } from "@/utils/adminCopy";

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
    imageLabelShort: "Resim",
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
    imageLabelShort: "Image",
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
    return <p className="py-12 text-ink-2">{a.loading}</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={copy.pageTitle}
        description={copy.pageSubtitle}
        actions={
          <Button variant="outline" onClick={() => router.push("/admin/poll/datasets")}>
            <ArrowLeft aria-hidden="true" />
            {copy.datasets}
          </Button>
        }
      />

      {/* Dataset Info */}
      <div className="max-w-3xl">
        <Field id="dataset-name" label={copy.datasetNameLabel}>
          <Input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder={copy.datasetNamePlaceholder}
          />
        </Field>

        <Field id="dataset-description" label={copy.descriptionLabel}>
          <Textarea
            value={datasetDescription}
            onChange={(e) => setDatasetDescription(e.target.value)}
            rows={3}
            placeholder={copy.descriptionPlaceholder}
          />
        </Field>
      </div>

      {/* Add Item Section */}
      <Section title={copy.addItemHeading} className="max-w-3xl">
        <div className="grid gap-x-4 md:grid-cols-2">
          <Field id="dataset-item-name" label={copy.itemNameLabel}>
            <Input
              type="text"
              value={currentItemName}
              onChange={(e) => setCurrentItemName(e.target.value)}
              placeholder={copy.itemNamePlaceholder}
            />
          </Field>

          <Field id="dataset-item-description" label={copy.descriptionLabel}>
            <Input
              type="text"
              value={currentItemDescription}
              onChange={(e) => setCurrentItemDescription(e.target.value)}
              placeholder={copy.itemDescriptionPlaceholder}
            />
          </Field>
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <Label htmlFor="item-image-input">{copy.imageLabel}</Label>
          <input
            id="item-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:h-9 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-brand-hover"
          />
          {currentItemImage && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <span className="min-w-0 truncate">{currentItemImage.name}</span>
            </p>
          )}
        </div>

        <Button variant="outline" className="w-full sm:w-auto" onClick={handleAddItem}>
          {copy.addItemButton}
        </Button>
      </Section>

      {/* Items List */}
      <Section title={copy.currentItemsHeading(items.length)}>
        {items.length === 0 ? (
          <p className="border-y border-rule py-6 text-sm text-muted-foreground">
            {copy.noItemsYet}
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(1,minmax(0,1fr))] gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] md:grid-cols-[repeat(3,minmax(0,1fr))] lg:grid-cols-[repeat(4,minmax(0,1fr))]">
            {items.map((item) => (
              <div key={item.id} className="min-w-0 rounded-lg border border-rule p-3">
                {editingItemId === item.id ? (
                  // Edit Mode
                  <div className="space-y-1">
                    <div className="relative mb-3 aspect-square overflow-hidden rounded">
                      <img
                        src={editItemImage ? URL.createObjectURL(editItemImage) : (item.imageUrl || (item.imageFile ? URL.createObjectURL(item.imageFile) : ""))}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <Field id={`edit-item-name-${item.id}`} label={copy.itemNameLabel}>
                      <Input
                        type="text"
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        placeholder={copy.itemNameInputPlaceholder}
                      />
                    </Field>
                    <Field id={`edit-item-description-${item.id}`} label={copy.descriptionLabel}>
                      <Input
                        type="text"
                        value={editItemDescription}
                        onChange={(e) => setEditItemDescription(e.target.value)}
                        placeholder={copy.descriptionLabel}
                      />
                    </Field>
                    <div className="flex flex-col gap-1.5 pb-3">
                      <Label htmlFor={`edit-item-image-${item.id}`}>{copy.imageLabelShort}</Label>
                      <input
                        id={`edit-item-image-${item.id}`}
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageSelect}
                        className="block w-full text-xs text-muted-foreground file:mr-3 file:h-9 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-brand-hover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={handleSaveEdit}>
                        {a.save}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleCancelEdit}>
                        {a.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="relative mb-3 aspect-square overflow-hidden rounded">
                      <img
                        src={item.imageUrl || (item.imageFile ? URL.createObjectURL(item.imageFile) : "")}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleStartEdit(item)}
                      >
                        {a.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        {a.delete}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Actions */}
      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => router.push("/admin/poll/datasets")}>
          {a.cancel}
        </Button>
        <Button onClick={handleUpdateDataset} disabled={items.length < 8 || updatingDataset}>
          {updatingDataset ? copy.updating : copy.updateDatasetButton}
        </Button>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="light"
      />
    </div>
  );
}
