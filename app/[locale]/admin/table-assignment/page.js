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
  Plus,
  Trash2,
  RefreshCw,
  UserPlus,
  Shuffle,
  Edit2,
  Lock,
  Unlock,
  Search,
  X,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";

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
    return <p className="py-12 text-ink-2">Yükleniyor...</p>;
  }

  if (!userRole) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        Erişim Reddedildi
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Masa Yerleştirme Çarkı"
        description="Katılımcıları masalara rastgele veya manuel yerleştirin"
      />

      {/* Stats */}
      <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        <Stat label="Toplam Masa" value={tables.length} />
        <Stat label="Toplam Katılımcı" value={participants.length} />
        <Stat label="Atanan" value={assignedCount} />
        <Stat label="Bekleyen" value={unassignedParticipants.length} />
      </dl>

      {/* Search and Action Buttons */}
      <div className="mb-8 flex flex-col gap-4 border-y border-rule py-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative w-full min-w-0 lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Katılımcı ara (sadece atananlar)..."
            className="pl-10 pr-12"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              aria-label="Temizle"
              className="absolute right-0 top-0"
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowAddTableModal(true)}>
            <Plus aria-hidden="true" />
            <span>Masa Ekle</span>
          </Button>

          <Button variant="outline" onClick={() => setShowAddParticipantModal(true)}>
            <UserPlus aria-hidden="true" />
            <span>Katılımcı Ekle</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleRandomAssignment}
            disabled={unassignedParticipants.length === 0 || tables.length === 0}
          >
            <Shuffle aria-hidden="true" />
            <span>Rastgele Ata</span>
          </Button>

          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={assignedCount === 0}
          >
            <RefreshCw aria-hidden="true" />
            <span>Sıfırla</span>
          </Button>
        </div>
      </div>

      {/* Unassigned Participants - Manual Assignment Section */}
      {unassignedParticipants.length > 0 && (
        <Section title={`Atanmamış Katılımcılar (${unassignedParticipants.length})`} className="mb-10 mt-0 md:mt-0">
          <p className="mb-3 max-w-measure text-sm text-muted-foreground">
            Katılımcıya tıklayın ve istediğiniz masayı seçin, ya da "Rastgele Ata" butonunu kullanın
          </p>

          {/* Manual Assignment Interface */}
          <ul className="border-t border-rule">
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
          </ul>
        </Section>
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <p className="mb-4 flex items-center gap-2 text-sm text-ink-2">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            Arama: "{searchQuery}" - {filteredParticipants.filter(p => p.assignedTableId).length} sonuç bulundu
          </span>
        </p>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <EmptyState
            className="col-span-full"
            title="Henüz masa yok"
            description="İlk masayı ekleyin ve katılımcıları yerleştirmeye başlayın!"
            action={<Button onClick={() => setShowAddTableModal(true)}>Masa Ekle</Button>}
          />
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
        theme="light"
      />
    </div>
  );
}

// Shared modal frame: overlay + panel, click on the overlay closes
function ModalFrame({ onClose, title, children }) {
  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-rule bg-background p-6 text-foreground animate-in fade-in-0 duration-short"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
        <div className="min-h-0 overflow-y-auto">{children}</div>
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
    <li className="flex items-center justify-between gap-3 border-b border-rule py-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        <span className="min-w-0 break-words font-medium">{participant.name}</span>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowTableDropdown(!showTableDropdown)}
          >
            <Plus aria-hidden="true" />
            <span>Masaya Ata</span>
          </Button>

          {showTableDropdown && (
            <>
              <div
                className="fixed inset-0 z-raised"
                onClick={() => setShowTableDropdown(false)}
              />
              <div className="absolute left-0 top-full z-dropdown mt-1 min-w-52 rounded border border-edge bg-popover text-popover-foreground shadow-whisper">
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
                        className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors duration-micro ${
                          isDisabled
                            ? 'cursor-not-allowed text-muted-foreground'
                            : 'text-ink hover:bg-secondary'
                        }`}
                      >
                        <span>{table.name} {table.isMarkedFull ? '(Dolu)' : ''}</span>
                        <span className={`font-outlier text-xs tabular-nums ${isDisabled ? 'text-error' : 'text-muted-foreground'}`}>
                          {table.available}/{table.capacity}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Masa yok
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(participant.id)}
        className="shrink-0 text-error"
        title="Katılımcıyı sil"
        aria-label="Katılımcıyı sil"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
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
    <Card className={`min-w-0 p-4 ${isMarkedFull ? 'border-ink' : ''}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold">
          <span className="min-w-0 break-words">{table.name}</span>
          {isMarkedFull && <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />}
        </h3>
        <div className="-mr-2 flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFull(table.id, isMarkedFull)}
            title={isMarkedFull ? "Masayı müsait yap" : "Masayı dolu işaretle"}
            aria-label={isMarkedFull ? "Masayı müsait yap" : "Masayı dolu işaretle"}
          >
            {isMarkedFull ? <Unlock aria-hidden="true" /> : <Lock aria-hidden="true" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(table)}
            title="Masayı düzenle"
            aria-label="Masayı düzenle"
          >
            <Edit2 aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(table.id)}
            className="text-error"
            title="Masayı kaldır"
            aria-label="Masayı kaldır"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between gap-2 text-sm text-muted-foreground">
          <span>Doluluk {isMarkedFull && <span className="font-medium text-ink">(Dolu işaretli)</span>}</span>
          <span className="font-outlier tabular-nums">
            {searchQuery && participants.length !== totalAssigned ? (
              <>
                <span className="text-brand">{participants.length}</span>
                <span>/{totalAssigned}</span>
                <span>/{table.capacity}</span>
              </>
            ) : (
              <>{totalAssigned}/{table.capacity}</>
            )}
          </span>
        </div>
        <div className="h-2 w-full rounded-sm bg-paper-3">
          <div
            className={`h-2 rounded-sm transition-[width] duration-short ${
              isMarkedFull ? 'bg-ink-2' : isFullCapacity ? 'bg-error' : fillPercentage > 80 ? 'bg-warning' : 'bg-success'
            }`}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
        {searchQuery && participants.length !== totalAssigned && (
          <p className="mt-1 text-xs text-muted-foreground">
            Aramada {participants.length} kişi gösteriliyor (toplam {totalAssigned})
          </p>
        )}
      </div>

      {/* Participants List */}
      <div className="mb-3 max-h-60 overflow-y-auto">
        {participants.length > 0 ? (
          <ul className="border-t border-rule">
            {participants.map(participant => (
              <li
                key={participant.id}
                className="flex items-center justify-between gap-2 border-b border-rule py-1 pl-1"
              >
                <span className="min-w-0 break-words text-sm">{participant.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUnassignParticipant(participant.id)}
                  className="shrink-0 text-error"
                  title="Masadan çıkar"
                  aria-label="Masadan çıkar"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-rule py-4 text-sm text-muted-foreground">Henüz kimse yok</p>
        )}
      </div>

      {/* Assign Button or Full Indicator */}
      {isMarkedFull ? (
        <Button variant="secondary" disabled className="w-full">
          <Lock aria-hidden="true" />
          <span>Masa Dolu İşaretli</span>
        </Button>
      ) : isFullCapacity ? (
        <Button variant="secondary" disabled className="w-full">
          <span>Kontenjan Doldu</span>
        </Button>
      ) : unassignedParticipants.length > 0 ? (
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            className="w-full"
          >
            <Plus aria-hidden="true" />
            <span>Yerleştir</span>
          </Button>

          {showAssignDropdown && (
            <div className="absolute bottom-full left-0 right-0 z-dropdown mb-2 max-h-48 overflow-y-auto rounded border border-edge bg-popover text-popover-foreground shadow-whisper">
              {unassignedParticipants.slice(0, 10).map(participant => (
                <button
                  key={participant.id}
                  onClick={() => {
                    onAssignParticipant(participant.id, table.id);
                    setShowAssignDropdown(false);
                  }}
                  className="min-h-11 w-full px-3 py-2 text-left text-sm text-ink transition-colors duration-micro hover:bg-secondary"
                >
                  {participant.name}
                </button>
              ))}
              {unassignedParticipants.length > 10 && (
                <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                  +{unassignedParticipants.length - 10} kişi daha
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Card>
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
    <ModalFrame onClose={onClose} title="Yeni Masa Ekle">
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="table-add-name" label="Masa Adı">
          <Input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Örn: Masa 3"
          />
        </Field>

        <Field id="table-add-capacity" label="Kapasite">
          <Input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min="1"
            className="tabular-nums"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">Ekle</Button>
        </div>
      </form>
    </ModalFrame>
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
    <ModalFrame onClose={onClose} title="Katılımcı Ekle">
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field
          id="participant-add-names"
          label="Katılımcı İsimleri"
          help="Her satıra bir isim yazın. Birden fazla katılımcı ekleyebilirsiniz."
        >
          <Textarea
            value={participantNames}
            onChange={(e) => setParticipantNames(e.target.value)}
            placeholder="Her satıra bir isim yazın:&#10;Ahmet Yılmaz&#10;Ayşe Demir&#10;Mehmet Kaya"
            rows={6}
            className="resize-none"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">Ekle</Button>
        </div>
      </form>
    </ModalFrame>
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
    <ModalFrame onClose={onClose} title="Masayı Düzenle">
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="table-edit-name" label="Masa Adı">
          <Input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Örn: Masa 3"
          />
        </Field>

        <Field id="table-edit-capacity" label="Kapasite">
          <Input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min="1"
            className="tabular-nums"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">Güncelle</Button>
        </div>
      </form>
    </ModalFrame>
  );
}
