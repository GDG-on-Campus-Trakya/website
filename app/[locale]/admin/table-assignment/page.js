"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  UserPlus,
  ArrowLeft,
  Table,
  Shuffle,
  Edit2,
  Lock,
  Unlock,
  Search
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES } from "@/utils/roleUtils";

export default function TableAssignmentPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [tables, setTables] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Check admin privileges
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      const role = await checkUserRole(user.email);
      if (!role) {
        router.push("/");
        return;
      }

      setUserRole(role);
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  // Real-time listener for tables
  useEffect(() => {
    if (!userRole) return;

    const unsubscribe = onSnapshot(
      collection(db, "tableAssignmentTables"),
      (snapshot) => {
        const tablesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTables(tablesList.sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => {
        console.error("Error loading tables:", error);
        toast.error("Masalar yüklenirken hata oluştu!");
      }
    );

    return () => unsubscribe();
  }, [userRole]);

  // Real-time listener for participants
  useEffect(() => {
    if (!userRole) return;

    const unsubscribe = onSnapshot(
      collection(db, "tableAssignmentParticipants"),
      (snapshot) => {
        const participantsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setParticipants(participantsList.sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => {
        console.error("Error loading participants:", error);
        toast.error("Katılımcılar yüklenirken hata oluştu!");
      }
    );

    return () => unsubscribe();
  }, [userRole]);

  // Computed values
  const unassignedParticipants = participants.filter(p => !p.assignedTableId);
  const assignedCount = participants.filter(p => p.assignedTableId).length;

  // Filter participants based on search query
  const filteredParticipants = searchQuery.trim()
    ? participants.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.assignedTableId
      )
    : participants;

  const handleAddTable = async (tableName, capacity) => {
    try {
      await addDoc(collection(db, "tableAssignmentTables"), {
        name: tableName,
        capacity: parseInt(capacity),
        isFull: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setShowAddTableModal(false);
      toast.success(`${tableName} eklendi!`);
    } catch (error) {
      console.error("Error adding table:", error);
      toast.error("Masa eklenirken hata oluştu!");
    }
  };

  const handleEditTable = async (tableName, capacity) => {
    try {
      await updateDoc(doc(db, "tableAssignmentTables", editingTable.id), {
        name: tableName,
        capacity: parseInt(capacity),
        updatedAt: serverTimestamp()
      });
      setShowEditTableModal(false);
      setEditingTable(null);
      toast.success(`${tableName} güncellendi!`);
    } catch (error) {
      console.error("Error updating table:", error);
      toast.error("Masa güncellenirken hata oluştu!");
    }
  };

  const handleRemoveTable = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    const assignedToTable = participants.filter(p => p.assignedTableId === tableId);

    if (assignedToTable.length > 0) {
      if (!confirm("Bu masada katılımcılar var. Masayı kaldırırsanız, katılımcılar atanmamış duruma gelecek. Devam etmek istiyor musunuz?")) {
        return;
      }
    }

    try {
      const batch = writeBatch(db);

      // Remove table
      batch.delete(doc(db, "tableAssignmentTables", tableId));

      // Unassign participants from this table
      assignedToTable.forEach(participant => {
        batch.update(doc(db, "tableAssignmentParticipants", participant.id), {
          assignedTableId: null,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast.info(`${table.name} kaldırıldı`);
    } catch (error) {
      console.error("Error removing table:", error);
      toast.error("Masa kaldırılırken hata oluştu!");
    }
  };

  const handleAddParticipant = async (participantNames) => {
    const names = participantNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      toast.error("En az bir katılımcı adı girin!");
      return;
    }

    try {
      const batch = writeBatch(db);

      names.forEach(name => {
        const newParticipantRef = doc(collection(db, "tableAssignmentParticipants"));
        batch.set(newParticipantRef, {
          name: name,
          assignedTableId: null,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });
      });

      await batch.commit();
      setShowAddParticipantModal(false);

      if (names.length === 1) {
        toast.success(`${names[0]} eklendi!`);
      } else {
        toast.success(`${names.length} katılımcı eklendi!`);
      }
    } catch (error) {
      console.error("Error adding participants:", error);
      toast.error("Katılımcılar eklenirken hata oluştu!");
    }
  };

  const handleRandomAssignment = async () => {
    if (unassignedParticipants.length === 0) {
      toast.warning("Atanacak katılımcı yok!");
      return;
    }

    if (tables.length === 0) {
      toast.error("Masa yok! Lütfen önce masa ekleyin.");
      return;
    }

    // Calculate total available capacity (exclude tables marked as full)
    const tableCapacities = tables
      .filter(t => !t.isFull)
      .map(t => ({
        id: t.id,
        name: t.name,
        available: t.capacity - participants.filter(p => p.assignedTableId === t.id).length
      }))
      .filter(t => t.available > 0);

    if (tableCapacities.length === 0) {
      toast.error("Tüm masalar dolu!");
      return;
    }

    const totalCapacity = tableCapacities.reduce((sum, t) => sum + t.available, 0);
    if (totalCapacity < unassignedParticipants.length) {
      toast.warning("Tüm katılımcılar için yeterli kapasite yok! Mevcut kapasiteye göre atama yapılacak.");
    }

    try {
      const batch = writeBatch(db);
      const shuffled = [...unassignedParticipants].sort(() => Math.random() - 0.5);
      let assigned = 0;
      let currentTableIndex = 0;
      const assignments = []; // Track assignments for notification

      // Distribute participants evenly across tables in round-robin fashion
      shuffled.forEach(participant => {
        // Find next available table in round-robin
        let attempts = 0;
        while (attempts < tableCapacities.length) {
          const currentTable = tableCapacities[currentTableIndex % tableCapacities.length];

          if (currentTable.available > 0) {
            batch.update(doc(db, "tableAssignmentParticipants", participant.id), {
              assignedTableId: currentTable.id,
              updatedAt: serverTimestamp()
            });
            currentTable.available--;
            assignments.push({ participantName: participant.name, tableName: currentTable.name });
            assigned++;
            currentTableIndex++;
            break;
          }

          currentTableIndex++;
          attempts++;
        }
      });

      await batch.commit();

      // Show individual assignments
      assignments.forEach(({ participantName, tableName }) => {
        toast.success(`${participantName} ${tableName}'e atandı!`);
      });
    } catch (error) {
      console.error("Error during random assignment:", error);
      toast.error("Atama sırasında hata oluştu!");
    }
  };

  const handleAssignToTable = async (participantId, tableId) => {
    const table = tables.find(t => t.id === tableId);
    const participant = participants.find(p => p.id === participantId);
    const assignedToTable = participants.filter(p => p.assignedTableId === tableId);

    if (table.isFull) {
      toast.error(`${table.name} dolu olarak işaretlenmiş!`);
      return;
    }

    if (assignedToTable.length >= table.capacity) {
      toast.error(`${table.name} dolu!`);
      return;
    }

    try {
      await updateDoc(doc(db, "tableAssignmentParticipants", participantId), {
        assignedTableId: tableId,
        updatedAt: serverTimestamp()
      });
      toast.success(`${participant.name} ${table.name}'e atandı!`);
    } catch (error) {
      console.error("Error assigning participant:", error);
      toast.error("Atama sırasında hata oluştu!");
    }
  };

  const handleUnassignParticipant = async (participantId) => {
    try {
      await updateDoc(doc(db, "tableAssignmentParticipants", participantId), {
        assignedTableId: null,
        updatedAt: serverTimestamp()
      });
      toast.info("Katılımcı masadan çıkarıldı");
    } catch (error) {
      console.error("Error unassigning participant:", error);
      toast.error("Katılımcı çıkarılırken hata oluştu!");
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    if (!confirm(`${participant.name} katılımcısını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "tableAssignmentParticipants", participantId));
      toast.info(`${participant.name} silindi`);
    } catch (error) {
      console.error("Error deleting participant:", error);
      toast.error("Katılımcı silinirken hata oluştu!");
    }
  };

  const handleReset = async () => {
    if (!confirm("Tüm atamaları sıfırlamak istediğinizden emin misiniz?")) return;

    try {
      const batch = writeBatch(db);

      participants.forEach(participant => {
        if (participant.assignedTableId) {
          batch.update(doc(db, "tableAssignmentParticipants", participant.id), {
            assignedTableId: null,
            updatedAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
      toast.success("Tüm atamalar sıfırlandı!");
    } catch (error) {
      console.error("Error resetting assignments:", error);
      toast.error("Sıfırlama sırasında hata oluştu!");
    }
  };

  const handleToggleTableFull = async (tableId, currentIsFullStatus) => {
    try {
      await updateDoc(doc(db, "tableAssignmentTables", tableId), {
        isFull: !currentIsFullStatus,
        updatedAt: serverTimestamp()
      });
      const table = tables.find(t => t.id === tableId);
      if (!currentIsFullStatus) {
        toast.info(`${table.name} dolu olarak işaretlendi`);
      } else {
        toast.info(`${table.name} tekrar müsait`);
      }
    } catch (error) {
      console.error("Error toggling table full status:", error);
      toast.error("Masa durumu güncellenirken hata oluştu!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-gray-200">Yükleniyor...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Erişim Reddedildi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
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
            <div className="border-l border-gray-500 h-8"></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Masa Yerleştirme Çarkı
              </h1>
              <p className="text-gray-300">
                Katılımcıları masalara rastgele veya manuel yerleştirin
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center">
              <Table className="w-8 h-8 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-gray-400">Toplam Masa</p>
                <p className="text-2xl font-bold text-gray-100">{tables.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-gray-400">Toplam Katılımcı</p>
                <p className="text-2xl font-bold text-gray-100">{participants.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-400" />
              <div className="ml-3">
                <p className="text-sm text-gray-400">Atanan</p>
                <p className="text-2xl font-bold text-gray-100">{assignedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center">
              <UserPlus className="w-8 h-8 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-gray-400">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-100">{unassignedParticipants.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Action Buttons */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Katılımcı ara (sadece atananlar)..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddTableModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Masa Ekle</span>
            </button>

            <button
              onClick={() => setShowAddParticipantModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Katılımcı Ekle</span>
            </button>

            <button
              onClick={handleRandomAssignment}
              disabled={unassignedParticipants.length === 0 || tables.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                unassignedParticipants.length === 0 || tables.length === 0
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              <Shuffle className="w-5 h-5" />
              <span>Rastgele Ata</span>
            </button>

            <button
              onClick={handleReset}
              disabled={assignedCount === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                assignedCount === 0
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              <span>Sıfırla</span>
            </button>
          </div>
        </div>

        {/* Unassigned Participants - Manual Assignment Section */}
        {unassignedParticipants.length > 0 && (
          <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-600/40 mb-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Atanmamış Katılımcılar ({unassignedParticipants.length})
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Katılımcıya tıklayın ve istediğiniz masayı seçin, ya da "Rastgele Ata" butonunu kullanın
            </p>

            {/* Manual Assignment Interface */}
            <div className="space-y-4">
              {unassignedParticipants.map(participant => (
                <ManualAssignmentRow
                  key={participant.id}
                  participant={participant}
                  tables={tables}
                  participants={participants}
                  onAssign={handleAssignToTable}
                  onRemove={handleRemoveParticipant}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4 bg-blue-900/20 border border-blue-600/40 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              <Search className="w-4 h-4 inline mr-2" />
              Arama: "{searchQuery}" - {filteredParticipants.filter(p => p.assignedTableId).length} sonuç bulundu
            </p>
          </div>
        )}

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => {
            const tableParticipants = filteredParticipants.filter(p => p.assignedTableId === table.id);
            // Hide tables with no matching participants when searching
            if (searchQuery && tableParticipants.length === 0) {
              return null;
            }
            return (
              <TableCard
                key={table.id}
                table={table}
                participants={tableParticipants}
                allParticipants={participants}
                unassignedParticipants={unassignedParticipants}
                onRemove={handleRemoveTable}
                onEdit={(table) => {
                  setEditingTable(table);
                  setShowEditTableModal(true);
                }}
                onUnassignParticipant={handleUnassignParticipant}
                onAssignParticipant={handleAssignToTable}
                onToggleFull={handleToggleTableFull}
                searchQuery={searchQuery}
              />
            );
          })}

          {tables.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                <Table className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  Henüz masa yok
                </h3>
                <p className="text-gray-400 mb-4">
                  İlk masayı ekleyin ve katılımcıları yerleştirmeye başlayın!
                </p>
                <button
                  onClick={() => setShowAddTableModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Masa Ekle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showAddTableModal && (
          <AddTableModal
            onClose={() => setShowAddTableModal(false)}
            onAdd={handleAddTable}
          />
        )}

        {showEditTableModal && editingTable && (
          <EditTableModal
            table={editingTable}
            onClose={() => {
              setShowEditTableModal(false);
              setEditingTable(null);
            }}
            onEdit={handleEditTable}
          />
        )}

        {showAddParticipantModal && (
          <AddParticipantModal
            onClose={() => setShowAddParticipantModal(false)}
            onAdd={handleAddParticipant}
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

// Manual Assignment Row Component
function ManualAssignmentRow({ participant, tables, participants, onAssign, onRemove }) {
  const [showTableDropdown, setShowTableDropdown] = useState(false);

  const availableTables = tables.map(table => {
    const assigned = participants.filter(p => p.assignedTableId === table.id).length;
    return {
      ...table,
      available: table.capacity - assigned,
      isFullCapacity: assigned >= table.capacity,
      isMarkedFull: table.isFull || false
    };
  });

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-gray-200 font-medium">{participant.name}</span>

        <div className="relative">
          <button
            onClick={() => setShowTableDropdown(!showTableDropdown)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Masaya Ata</span>
          </button>

          {showTableDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowTableDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg min-w-[200px] z-20">
                {availableTables.length > 0 ? (
                  availableTables.map(table => {
                    const isDisabled = table.isFullCapacity || table.isMarkedFull;
                    return (
                      <button
                        key={table.id}
                        onClick={() => {
                          if (!isDisabled) {
                            onAssign(participant.id, table.id);
                            setShowTableDropdown(false);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                          isDisabled
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        <span>{table.name} {table.isMarkedFull ? '(Dolu)' : ''}</span>
                        <span className={`text-xs ${isDisabled ? 'text-red-400' : 'text-gray-400'}`}>
                          {table.available}/{table.capacity}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Masa yok
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => onRemove(participant.id)}
        className="text-red-400 hover:text-red-300 transition-colors p-2"
        title="Katılımcıyı sil"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Table Card Component
function TableCard({ table, participants, allParticipants, unassignedParticipants, onRemove, onEdit, onUnassignParticipant, onAssignParticipant, onToggleFull, searchQuery }) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  // Use all participants for capacity calculation, but filtered participants for display
  const totalAssigned = allParticipants ? allParticipants.filter(p => p.assignedTableId === table.id).length : participants.length;
  const fillPercentage = (totalAssigned / table.capacity) * 100;
  const isFullCapacity = totalAssigned >= table.capacity;
  const isMarkedFull = table.isFull || false;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border ${isMarkedFull ? 'border-orange-500/50' : 'border-gray-700'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          {table.name}
          {isMarkedFull && <Lock className="w-4 h-4 text-orange-400" />}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFull(table.id, isMarkedFull)}
            className={`p-2 rounded-lg transition-colors ${
              isMarkedFull
                ? 'text-orange-400 hover:bg-orange-600/20'
                : 'text-gray-400 hover:bg-gray-600/20'
            }`}
            title={isMarkedFull ? "Masayı müsait yap" : "Masayı dolu işaretle"}
          >
            {isMarkedFull ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(table)}
            className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
            title="Masayı düzenle"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(table.id)}
            className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
            title="Masayı kaldır"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Doluluk {isMarkedFull && <span className="text-orange-400">(Dolu işaretli)</span>}</span>
          <span>
            {searchQuery && participants.length !== totalAssigned ? (
              <>
                <span className="text-blue-400">{participants.length}</span>
                <span className="text-gray-500">/{totalAssigned}</span>
                <span>/{table.capacity}</span>
              </>
            ) : (
              <>{totalAssigned}/{table.capacity}</>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isMarkedFull ? 'bg-orange-500' : isFullCapacity ? 'bg-red-500' : fillPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
        {searchQuery && participants.length !== totalAssigned && (
          <p className="text-xs text-blue-300 mt-1">
            Aramada {participants.length} kişi gösteriliyor (toplam {totalAssigned})
          </p>
        )}
      </div>

      {/* Participants List */}
      <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
        {participants.length > 0 ? (
          participants.map(participant => (
            <div
              key={participant.id}
              className="flex items-center justify-between bg-gray-900/50 px-3 py-2 rounded-lg"
            >
              <span className="text-gray-200 text-sm">{participant.name}</span>
              <button
                onClick={() => onUnassignParticipant(participant.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
                title="Masadan çıkar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4 text-sm">Henüz kimse yok</p>
        )}
      </div>

      {/* Assign Button or Full Indicator */}
      {isMarkedFull ? (
        <button
          disabled
          className="w-full bg-orange-600/50 text-orange-200 px-3 py-2 rounded-lg cursor-not-allowed text-sm flex items-center justify-center space-x-2"
        >
          <Lock className="w-4 h-4" />
          <span>Masa Dolu İşaretli</span>
        </button>
      ) : isFullCapacity ? (
        <button
          disabled
          className="w-full bg-gray-600 text-gray-400 px-3 py-2 rounded-lg cursor-not-allowed text-sm flex items-center justify-center space-x-2"
        >
          <span>Kontenjan Doldu</span>
        </button>
      ) : unassignedParticipants.length > 0 ? (
        <div className="relative">
          <button
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yerleştir</span>
          </button>

          {showAssignDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {unassignedParticipants.slice(0, 10).map(participant => (
                <button
                  key={participant.id}
                  onClick={() => {
                    onAssignParticipant(participant.id, table.id);
                    setShowAssignDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-gray-200 text-sm hover:bg-gray-800 transition-colors"
                >
                  {participant.name}
                </button>
              ))}
              {unassignedParticipants.length > 10 && (
                <div className="px-3 py-2 text-gray-500 text-xs text-center">
                  +{unassignedParticipants.length - 10} kişi daha
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Add Table Modal
function AddTableModal({ onClose, onAdd }) {
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("6");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error("Masa adı gerekli!");
      return;
    }
    if (!capacity || parseInt(capacity) < 1) {
      toast.error("Geçerli bir kapasite girin!");
      return;
    }
    onAdd(tableName, capacity);
    setTableName("");
    setCapacity("6");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">Yeni Masa Ekle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Masa Adı
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Örn: Masa 3"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Kapasite
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Participant Modal
function AddParticipantModal({ onClose, onAdd }) {
  const [participantNames, setParticipantNames] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!participantNames.trim()) {
      toast.error("En az bir katılımcı adı girin!");
      return;
    }
    onAdd(participantNames);
    setParticipantNames("");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">Katılımcı Ekle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Katılımcı İsimleri
            </label>
            <textarea
              value={participantNames}
              onChange={(e) => setParticipantNames(e.target.value)}
              placeholder="Her satıra bir isim yazın:&#10;Ahmet Yılmaz&#10;Ayşe Demir&#10;Mehmet Kaya"
              rows={6}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Her satıra bir isim yazın. Birden fazla katılımcı ekleyebilirsiniz.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Table Modal
function EditTableModal({ table, onClose, onEdit }) {
  const [tableName, setTableName] = useState(table.name);
  const [capacity, setCapacity] = useState(table.capacity.toString());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error("Masa adı gerekli!");
      return;
    }
    if (!capacity || parseInt(capacity) < 1) {
      toast.error("Geçerli bir kapasite girin!");
      return;
    }
    onEdit(tableName, capacity);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">Masayı Düzenle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Masa Adı
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Örn: Masa 3"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Kapasite
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

