"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Plus, Edit3, Trash2, Play, Settings, Trophy } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";
import { adminCopy } from "@/utils/adminCopy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { useConfirm } from "@/components/ConfirmProvider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const COPY = {
  tr: {
    adminPanel: "Admin panel",
    pageTitle: "Çekiliş çarkı",
    pageSubtitle: "Çark için ürün ekleyin ve çevirerek kazanan belirleyin",
    addItem: "Ürün ekle",
    wheelHeading: "Çark",
    spinning: "Dönüyor…",
    spinWheel: "Çarkı çevir",
    winnerTitle: "Kazanan",
    itemsHeading: "Ürünler",
    probabilityPrefix: "Olasılık:",
    noItemsYet: "Henüz ürün eklenmemiş",
    addFirstItem: "İlk ürünü ekle",
    addItemModalTitle: "Yeni ürün ekle",
    editItemModalTitle: "Ürün düzenle",
    wheelEmptyPrompt: "Ürün eklemek için yukarıdaki butona tıklayın",
    itemNameLabel: "Ürün adı",
    itemNamePlaceholder: "Örn: iPhone 15",
    probabilityFieldLabel: "Olasılık (%)",
    probabilityHint: "Yüksek olasılık = daha fazla kazanma şansı",
    colorLabel: "Renk",
    cancel: "İptal",
    update: "Güncelle",
    add: "Ekle",
    // Toasts / confirms
    itemsLoadError: "Ürünler yüklenirken hata oluştu.",
    itemAdded: "Ürün başarıyla eklendi",
    itemAddError: "Ürün eklenirken hata oluştu.",
    itemUpdated: "Ürün başarıyla güncellendi",
    itemUpdateError: "Ürün güncellenirken hata oluştu.",
    confirmDeleteItem: "Bu ürünü silmek istediğinizden emin misiniz?",
    itemDeleted: "Ürün başarıyla silindi",
    itemDeleteError: "Ürün silinirken hata oluştu.",
    needAtLeastOneItem: "Çark döndürmek için en az bir ürün eklemelisiniz.",
    winnerToast: (name) => `Kazanan: ${name}!`,
    itemNameRequired: "Ürün adı zorunludur",
    probabilityRange: "Olasılık 1-100 arasında olmalıdır.",
  },
  en: {
    adminPanel: "Admin panel",
    pageTitle: "Raffle wheel",
    pageSubtitle: "Add items to the wheel and spin to pick a winner",
    addItem: "Add item",
    wheelHeading: "Wheel",
    spinning: "Spinning…",
    spinWheel: "Spin the Wheel",
    winnerTitle: "Winner",
    itemsHeading: "Items",
    probabilityPrefix: "Probability:",
    noItemsYet: "No items added yet",
    addFirstItem: "Add first item",
    addItemModalTitle: "Add new item",
    editItemModalTitle: "Edit item",
    wheelEmptyPrompt: "Click the button above to add an item",
    itemNameLabel: "Item name",
    itemNamePlaceholder: "e.g. iPhone 15",
    probabilityFieldLabel: "Probability (%)",
    probabilityHint: "Higher probability = greater chance of winning",
    colorLabel: "Color",
    cancel: "Cancel",
    update: "Update",
    add: "Add",
    // Toasts / confirms
    itemsLoadError: "An error occurred while loading items.",
    itemAdded: "Item added successfully",
    itemAddError: "An error occurred while adding the item.",
    itemUpdated: "Item updated successfully",
    itemUpdateError: "An error occurred while updating the item.",
    confirmDeleteItem: "Are you sure you want to delete this item?",
    itemDeleted: "Item deleted successfully",
    itemDeleteError: "An error occurred while deleting the item.",
    needAtLeastOneItem: "You need to add at least one item to spin the wheel.",
    winnerToast: (name) => `Winner: ${name}!`,
    itemNameRequired: "Item name is required.",
    probabilityRange: "Probability must be between 1 and 100.",
  },
};

export default function RaffleWheelPage() {
  const confirm = useConfirm();
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const router = useRouter();

  // Check admin privileges
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
        console.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  // Load wheel items
  useEffect(() => {
    if (isAdmin) {
      loadItems();
    }
  }, [isAdmin]);

  const loadItems = async () => {
    try {
      const itemsRef = collection(db, "raffleWheelItems");
      const snapshot = await getDocs(itemsRef);
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsList);
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error(copy.itemsLoadError);
    }
  };

  const handleAddItem = async (formData) => {
    try {
      const itemsRef = collection(db, "raffleWheelItems");
      await addDoc(itemsRef, {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      toast.success(copy.itemAdded);
      loadItems();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(copy.itemAddError);
    }
  };

  const handleEditItem = async (formData) => {
    try {
      const itemRef = doc(db, "raffleWheelItems", editingItem.id);
      await updateDoc(itemRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      toast.success(copy.itemUpdated);
      loadItems();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error(copy.itemUpdateError);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!(await confirm(copy.confirmDeleteItem, { destructive: true }))) return;

    try {
      const itemRef = doc(db, "raffleWheelItems", itemId);
      await deleteDoc(itemRef);
      toast.success(copy.itemDeleted);
      loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(copy.itemDeleteError);
    }
  };

  const spinWheel = () => {
    if (items.length === 0) {
      toast.error(copy.needAtLeastOneItem);
      return;
    }

    if (spinning) return;

    setSpinning(true);
    setSelectedWinner(null);

    // Calculate weighted random selection
    const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalProbability;
    let winner = items[0];

    for (const item of items) {
      random -= item.probability;
      if (random <= 0) {
        winner = item;
        break;
      }
    }

    // Simulate spinning duration
    setTimeout(() => {
      setSelectedWinner(winner);
      setSpinning(false);
      toast.success(copy.winnerToast(winner.name));
    }, 5000);
  };

  if (loading) {
    return (
      <p className="py-12 text-lg text-muted-foreground">{a.loading}</p>
    );
  }

  if (!isAdmin) {
    return (
      <p className="py-12 text-lg text-error">{a.accessDenied}</p>
    );
  }

  const stageSecondary =
    "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded border border-stage-rule bg-transparent px-4 text-sm font-medium text-stage-ink transition-colors duration-micro ease-out hover:bg-stage-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div className="min-h-[calc(100dvh-4rem)] rounded-lg bg-stage p-4 text-stage-ink sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-stage-rule pb-6">
        <div className="min-w-0">
          <button
            onClick={() => router.push('/admin')}
            className="mb-3 inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-sm text-stage-muted transition-colors duration-micro ease-out hover:text-stage-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{copy.adminPanel}</span>
          </button>
          <h1 className="font-display text-3xl font-bold text-stage-ink md:text-5xl">
            {copy.pageTitle}
          </h1>
          <p className="mt-2 max-w-prose text-stage-muted">
            {copy.pageSubtitle}
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)}>
          <Plus aria-hidden="true" />
          <span>{copy.addItem}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        {/* Wheel Section */}
        <div className="min-w-0">
          <h2 className="mb-6 font-display text-xl font-bold text-stage-ink">{copy.wheelHeading}</h2>

          <div className="relative mx-auto w-full max-w-xl">
            <WheelComponent
              items={items}
              spinning={spinning}
              selectedWinner={selectedWinner}
            />
          </div>

          <Button
            onClick={spinWheel}
            disabled={spinning || items.length === 0}
            size="lg"
            className="mt-8 h-14 w-full text-lg font-bold"
          >
            <Play aria-hidden="true" />
            <span>{spinning ? copy.spinning : copy.spinWheel}</span>
          </Button>

          {selectedWinner && (
            <div
              role="status"
              className="mt-6 flex items-center gap-4 rounded-lg bg-warning p-6 text-ink"
            >
              <Trophy className="h-10 w-10 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-lg font-semibold">{copy.winnerTitle}</p>
                <p className="break-words font-display text-3xl font-bold md:text-4xl">
                  {selectedWinner.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="min-w-0 lg:border-l lg:border-stage-rule lg:pl-12">
          <h2 className="mb-6 font-display text-xl font-bold text-stage-ink">
            {copy.itemsHeading} (<span className="font-outlier tabular-nums">{items.length}</span>)
          </h2>

          <div className="max-h-[600px] overflow-y-auto">
            {items.length > 0 ? (
              <ul className="border-t border-stage-rule">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-stage-rule py-4"
                  >
                    <div
                      className="h-6 w-6 shrink-0 rounded-sm border border-stage-rule"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-sans text-base font-semibold text-stage-ink">{item.name}</h3>
                      <span className="text-sm text-stage-muted">
                        {copy.probabilityPrefix} <span className="font-outlier tabular-nums">{item.probability}%</span>
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowEditModal(true);
                        }}
                        aria-label={a.edit}
                        className={`${stageSecondary} w-11 px-0`}
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label={a.delete}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="border-t border-stage-rule py-12">
                <Settings className="mb-4 h-10 w-10 text-stage-muted" aria-hidden="true" />
                <p className="text-stage-muted">{copy.noItemsYet}</p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4"
                >
                  {copy.addFirstItem}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <ItemModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddItem}
          title={copy.addItemModalTitle}
          copy={copy}
        />
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <ItemModal
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSubmit={handleEditItem}
          title={copy.editItemModalTitle}
          initialData={editingItem}
          copy={copy}
        />
      )}

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
        theme="light"
      />
    </div>
  );
}

// Wheel Component
function WheelComponent({ items, spinning, selectedWinner }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (spinning) {
      // Calculate random final rotation (multiple full spins + random position)
      const spins = 5 + Math.random() * 3; // 5-8 full spins
      const extraRotation = Math.random() * 360;
      const finalRotation = rotation + (spins * 360) + extraRotation;
      setRotation(finalRotation);
    }
  }, [spinning]);

  if (items.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-full border border-stage-rule bg-stage-2">
        <p className="px-8 text-center text-stage-muted">
          {copy.wheelEmptyPrompt}
        </p>
      </div>
    );
  }

  const segmentAngle = 360 / items.length;

  return (
    <div className="relative w-full aspect-square">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-raised">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-error"></div>
      </div>

      {/* Wheel */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
        }}
      >
        {items.map((item, index) => {
          const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
          const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
          const largeArcFlag = segmentAngle > 180 ? 1 : 0;

          const x1 = 50 + 50 * Math.cos(startAngle);
          const y1 = 50 + 50 * Math.sin(startAngle);
          const x2 = 50 + 50 * Math.cos(endAngle);
          const y2 = 50 + 50 * Math.sin(endAngle);

          const textAngle = startAngle + (endAngle - startAngle) / 2;
          const textRadius = 35;
          const textX = 50 + textRadius * Math.cos(textAngle);
          const textY = 50 + textRadius * Math.sin(textAngle);

          return (
            <g key={item.id}>
              <path
                d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={item.color}
                stroke="#fff"
                strokeWidth="0.5"
              />
              <text
                x={textX}
                y={textY}
                fill="#fff"
                fontSize="4"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${index * segmentAngle}, ${textX}, ${textY})`}
              >
                {item.name}
              </text>
            </g>
          );
        })}

        {/* Center circle */}
        <circle cx="50" cy="50" r="8" className="fill-stage stroke-stage-ink" strokeWidth="1" />
      </svg>
    </div>
  );
}

// Item Modal Component
function ItemModal({ onClose, onSubmit, title, initialData = null, copy }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    probability: initialData?.probability || 10,
    color: initialData?.color || "#3b82f6"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(copy.itemNameRequired);
      return;
    }
    if (formData.probability <= 0 || formData.probability > 100) {
      toast.error(copy.probabilityRange);
      return;
    }
    onSubmit(formData);
  };

  const presetColors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e"
  ];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent aria-describedby={undefined} className="max-w-md rounded-lg border border-rule bg-background p-6 text-foreground">
        <DialogTitle className="mb-4 pr-10 text-xl font-bold">{title}</DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Field id="raffle-item-name" label={copy.itemNameLabel} required>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder={copy.itemNamePlaceholder}
            />
          </Field>

          <Field
            id="raffle-item-probability"
            label={copy.probabilityFieldLabel}
            help={copy.probabilityHint}
            required
          >
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value) || 0})}
              required
              className="font-outlier tabular-nums"
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raffle-item-color">
              {copy.colorLabel}<span aria-hidden="true"> *</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                aria-label={copy.colorLabel}
                className="h-control w-12 shrink-0 cursor-pointer rounded border border-input bg-background p-1"
              />
              <Input
                id="raffle-item-color"
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="min-w-0 flex-1 font-outlier"
                placeholder="#3b82f6"
              />
            </div>
            <div className="mt-1 grid grid-cols-9 gap-2">
              {presetColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  aria-pressed={formData.color === color}
                  className="h-8 w-full min-w-0 rounded-sm outline-offset-2 aria-pressed:outline aria-pressed:outline-2 aria-pressed:outline-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {initialData ? copy.update : copy.add}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
