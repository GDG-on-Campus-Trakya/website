"use client";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
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
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    datasetsLoadError: "Veri setleri yüklenirken hata oluştu!",
    onlyImages: "Sadece resim dosyaları yüklenebilir!",
    itemNameRequired: "Öğe adı gerekli!",
    imageRequired: "Resim gerekli!",
    itemAdded: "Öğe eklendi!",
    itemRemoved: "Öğe kaldırıldı",
    datasetNameRequired: "Veri seti adı gerekli!",
    minItemsToAdd: "En az 8 öğe eklemelisiniz!",
    uploadingImage: (i, total) => `Resim yükleniyor ${i}/${total}...`,
    datasetCreated: "Veri seti oluşturuldu!",
    datasetCreateError: "Veri seti oluşturulurken hata oluştu!",
    confirmDeleteDataset: "Bu veri setini silmek istediğinizden emin misiniz?",
    datasetDeleted: "Veri seti silindi!",
    datasetDeleteError: "Veri seti silinirken hata oluştu!",
    pageTitle: "Veri Setleri",
    pageSubtitle: "Poll veri setlerinizi yönetin",
    pollManagement: "Poll Yönetimi",
    newDatasetButton: "+ Yeni Veri Seti Oluştur",
    datasetsLoading: "Veri setleri yükleniyor...",
    noDatasets: "Henüz veri seti yok. Hemen bir tane oluşturun!",
    noDescription: "Açıklama yok",
    itemCountLabel: "Öğe Sayısı:",
    createdByLabel: "Oluşturan:",
    newDatasetHeading: "Yeni Veri Seti Oluştur",
    datasetNameLabel: "Veri Seti Adı *",
    datasetNamePlaceholder: "Örn: En İyi Futbolcular",
    descriptionLabel: "Açıklama",
    descriptionPlaceholder: "Veri seti hakkında kısa açıklama",
    addItemHeading: "Öğe Ekle",
    itemNameLabel: "Öğe Adı *",
    itemNamePlaceholder: "Örn: Lionel Messi",
    itemDescriptionPlaceholder: "Örn: 8 Ballon d'Or",
    imageLabel: "Resim *",
    addItemButton: "Öğe Ekle",
    addedItemsHeading: (n) => `Eklenen Öğeler (${n})`,
    noItemsYet: "Henüz öğe eklenmedi. En az 8 öğe eklemelisiniz.",
    creating: "Oluşturuluyor...",
    createDatasetButton: "Veri Seti Oluştur",
  },
  en: {
    datasetsLoadError: "An error occurred while loading datasets!",
    onlyImages: "Only image files can be uploaded!",
    itemNameRequired: "Item name is required!",
    imageRequired: "Image is required!",
    itemAdded: "Item added!",
    itemRemoved: "Item removed",
    datasetNameRequired: "Dataset name is required!",
    minItemsToAdd: "You must add at least 8 items!",
    uploadingImage: (i, total) => `Uploading image ${i}/${total}...`,
    datasetCreated: "Dataset created!",
    datasetCreateError: "An error occurred while creating the dataset!",
    confirmDeleteDataset: "Are you sure you want to delete this dataset?",
    datasetDeleted: "Dataset deleted!",
    datasetDeleteError: "An error occurred while deleting the dataset!",
    pageTitle: "Datasets",
    pageSubtitle: "Manage your poll datasets",
    pollManagement: "Poll Management",
    newDatasetButton: "+ Create New Dataset",
    datasetsLoading: "Loading datasets...",
    noDatasets: "No datasets yet. Create one now!",
    noDescription: "No description",
    itemCountLabel: "Item Count:",
    createdByLabel: "Created By:",
    newDatasetHeading: "Create New Dataset",
    datasetNameLabel: "Dataset Name *",
    datasetNamePlaceholder: "e.g.: Best Footballers",
    descriptionLabel: "Description",
    descriptionPlaceholder: "A short description of the dataset",
    addItemHeading: "Add Item",
    itemNameLabel: "Item Name *",
    itemNamePlaceholder: "e.g.: Lionel Messi",
    itemDescriptionPlaceholder: "e.g.: 8 Ballon d'Or",
    imageLabel: "Image *",
    addItemButton: "Add Item",
    addedItemsHeading: (n) => `Added Items (${n})`,
    noItemsYet: "No items added yet. You must add at least 8 items.",
    creating: "Creating...",
    createDatasetButton: "Create Dataset",
  },
};

export default function DatasetsPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

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
      toast.error(copy.datasetsLoadError);
    }
    setLoadingDatasets(false);
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
      imageFile: currentItemImage
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

  const handleCreateDataset = async () => {
    if (!datasetName.trim()) {
      toast.error(copy.datasetNameRequired);
      return;
    }

    if (items.length < 8) {
      toast.error(copy.minItemsToAdd);
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
        toast.info(copy.uploadingImage(i + 1, items.length));

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

      toast.success(copy.datasetCreated);
      setShowCreateModal(false);
      resetForm();
      loadDatasets();
    } catch (error) {
      logger.error("Error creating dataset:", error);
      toast.error(copy.datasetCreateError);
    }

    setCreatingDataset(false);
  };

  const handleDeleteDataset = async (datasetId) => {
    if (!confirm(copy.confirmDeleteDataset)) return;

    try {
      await deleteDataset(datasetId);
      toast.success(copy.datasetDeleted);
      loadDatasets();
    } catch (error) {
      logger.error("Error deleting dataset:", error);
      toast.error(copy.datasetDeleteError);
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
          <>
            <Button variant="outline" onClick={() => router.push("/admin/poll")}>
              <ArrowLeft aria-hidden="true" />
              {copy.pollManagement}
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>{copy.newDatasetButton}</Button>
          </>
        }
      />

      {/* Datasets Grid */}
      {loadingDatasets ? (
        <p className="py-12 text-ink-2">{copy.datasetsLoading}</p>
      ) : datasets.length === 0 ? (
        <EmptyState title={copy.noDatasets} />
      ) : (
        <div className="grid gap-6 md:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]">
          {datasets.map((dataset) => (
            <Card key={dataset.id} className="flex min-w-0 flex-col p-5">
              <h2 className="break-words font-display text-lg font-bold">{dataset.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {dataset.description || copy.noDescription}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{copy.itemCountLabel}</dt>
                  <dd className="font-outlier tabular-nums">{dataset.items?.length || 0}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">{copy.createdByLabel}</dt>
                  <dd className="min-w-0 truncate">{dataset.createdByName || "N/A"}</dd>
                </div>
              </dl>

              {/* Preview Images */}
              {dataset.items && dataset.items.length > 0 && (
                <div className="mt-4 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-2">
                  {dataset.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto flex gap-2 pt-5">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/admin/poll/datasets/edit/${dataset.id}`)}
                >
                  {a.edit}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteDataset(dataset.id)}
                >
                  {a.delete}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dataset Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{copy.newDatasetHeading}</DialogTitle>
          </DialogHeader>

          {/* Dataset Info */}
          <div>
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
          <div className="border-t-2 border-ink pt-4">
            <h3 className="mb-4 font-display text-lg font-bold">{copy.addItemHeading}</h3>

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

            <Button variant="outline" className="w-full" onClick={handleAddItem}>
              {copy.addItemButton}
            </Button>
          </div>

          {/* Items List */}
          <div>
            <h3 className="mb-3 font-display text-lg font-bold">
              {copy.addedItemsHeading(items.length)}
            </h3>

            {items.length === 0 ? (
              <p className="border-y border-rule py-6 text-sm text-muted-foreground">
                {copy.noItemsYet}
              </p>
            ) : (
              <ul className="border-t border-ink">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 border-b border-rule py-2">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                      <img
                        src={URL.createObjectURL(item.imageFile)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      {item.description && (
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-error"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={a.remove}
                      title={a.remove}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <DialogFooter className="gap-3 sm:space-x-0">
            <Button
              variant="outline"
              className="mt-0"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              {a.cancel}
            </Button>
            <Button
              onClick={handleCreateDataset}
              disabled={items.length < 8 || creatingDataset}
            >
              {creatingDataset ? copy.creating : copy.createDatasetButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
