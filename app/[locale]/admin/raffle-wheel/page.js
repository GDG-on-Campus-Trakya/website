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
import { ArrowLeft, Plus, Edit3, Trash2, Play, Settings } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RaffleWheelPage() {
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
      toast.error("Ürünler yüklenirken hata oluştu!");
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
      toast.success("Ürün başarıyla eklendi!");
      loadItems();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Ürün eklenirken hata oluştu!");
    }
  };

  const handleEditItem = async (formData) => {
    try {
      const itemRef = doc(db, "raffleWheelItems", editingItem.id);
      await updateDoc(itemRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      toast.success("Ürün başarıyla güncellendi!");
      loadItems();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Ürün güncellenirken hata oluştu!");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;

    try {
      const itemRef = doc(db, "raffleWheelItems", itemId);
      await deleteDoc(itemRef);
      toast.success("Ürün başarıyla silindi!");
      loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Ürün silinirken hata oluştu!");
    }
  };

  const spinWheel = () => {
    if (items.length === 0) {
      toast.error("Çark döndürmek için en az bir ürün eklemelisiniz!");
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
      toast.success(`Kazanan: ${winner.name}!`);
    }, 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-gray-200">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>
            <div className="border-l border-gray-600 h-8"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                Çekiliş Çarkı
              </h1>
              <p className="text-gray-400">
                Çark için ürün ekleyin ve çevirerek kazanan belirleyin
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ürün Ekle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wheel Section */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">Çark</h2>

            <div className="relative">
              <WheelComponent
                items={items}
                spinning={spinning}
                selectedWinner={selectedWinner}
              />
            </div>

            <button
              onClick={spinWheel}
              disabled={spinning || items.length === 0}
              className={`w-full mt-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center space-x-2 ${
                spinning || items.length === 0
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:scale-105"
              }`}
            >
              <Play className="w-6 h-6" />
              <span>{spinning ? "Dönüyor..." : "Çarkı Çevir!"}</span>
            </button>

            {selectedWinner && (
              <div className="mt-6 p-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-center">
                <p className="text-2xl font-bold text-white mb-2">🎉 Kazanan! 🎉</p>
                <p className="text-xl font-semibold text-white">{selectedWinner.name}</p>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Ürünler ({items.length})</h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-700 rounded-lg flex items-center justify-between"
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100">{item.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-400">
                          Olasılık: {item.probability}%
                        </span>
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Henüz ürün eklenmemiş</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    İlk Ürünü Ekle
                  </button>
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
            title="Yeni Ürün Ekle"
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
            title="Ürün Düzenle"
            initialData={editingItem}
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
          theme="dark"
        />
      </div>
    </div>
  );
}

// Wheel Component
function WheelComponent({ items, spinning, selectedWinner }) {
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
      <div className="w-full aspect-square bg-gray-700 rounded-full flex items-center justify-center">
        <p className="text-gray-400 text-center px-8">
          Ürün eklemek için yukarıdaki butona tıklayın
        </p>
      </div>
    );
  }

  const segmentAngle = 360 / items.length;

  return (
    <div className="relative w-full aspect-square">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500"></div>
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
        <circle cx="50" cy="50" r="8" fill="#1f2937" stroke="#fff" strokeWidth="1" />
      </svg>
    </div>
  );
}

// Item Modal Component
function ItemModal({ onClose, onSubmit, title, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    probability: initialData?.probability || 10,
    color: initialData?.color || "#3b82f6"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Ürün adı zorunludur!");
      return;
    }
    if (formData.probability <= 0 || formData.probability > 100) {
      toast.error("Olasılık 1-100 arasında olmalıdır!");
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ürün Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: iPhone 15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Olasılık (%) *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value) || 0})}
              required
              className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Yüksek olasılık = daha fazla kazanma şansı
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Renk *
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#3b82f6"
              />
            </div>
            <div className="grid grid-cols-9 gap-2">
              {presetColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  className="w-8 h-8 rounded hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-gray-100 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              {initialData ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
