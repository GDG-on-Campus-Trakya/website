"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
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
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    adminPanel: "Admin Panel",
    pageTitle: "Masa Yerleştirme Çarkı",
    pageSubtitle: "Katılımcıları masalara rastgele veya manuel yerleştirin",
    totalTables: "Toplam Masa",
    totalParticipants: "Toplam Katılımcı",
    assigned: "Atanan",
    pending: "Bekleyen",
    searchPlaceholder: "Katılımcı ara (sadece atananlar)...",
    addTable: "Masa Ekle",
    addParticipant: "Katılımcı Ekle",
    randomAssign: "Rastgele Ata",
    reset: "Sıfırla",
    clear: "Temizle",
    unassignedParticipants: (n) => `Atanmamış Katılımcılar (${n})`,
    manualHint:
      'Katılımcıya tıklayın ve istediğiniz masayı seçin, ya da "Rastgele Ata" butonunu kullanın',
    searchResult: (q, n) => `Arama: "${q}" - ${n} sonuç bulundu`,
    noTables: "Henüz masa yok",
    noTablesHint:
      "İlk masayı ekleyin ve katılımcıları yerleştirmeye başlayın!",
    // Toasts
    loadTablesError: "Masalar yüklenirken hata oluştu!",
    loadParticipantsError: "Katılımcılar yüklenirken hata oluştu!",
    tableAdded: (name) => `${name} eklendi!`,
    addTableError: "Masa eklenirken hata oluştu!",
    tableUpdated: (name) => `${name} güncellendi!`,
    updateTableError: "Masa güncellenirken hata oluştu!",
    confirmRemoveTableWithParticipants:
      "Bu masada katılımcılar var. Masayı kaldırırsanız, katılımcılar atanmamış duruma gelecek. Devam etmek istiyor musunuz?",
    tableRemoved: (name) => `${name} kaldırıldı`,
    removeTableError: "Masa kaldırılırken hata oluştu!",
    enterParticipantName: "En az bir katılımcı adı girin!",
    participantAdded: (name) => `${name} eklendi!`,
    participantsAdded: (n) => `${n} katılımcı eklendi!`,
    addParticipantsError: "Katılımcılar eklenirken hata oluştu!",
    noParticipantsToAssign: "Atanacak katılımcı yok!",
    noTablesAddFirst: "Masa yok! Lütfen önce masa ekleyin.",
    allTablesFull: "Tüm masalar dolu!",
    notEnoughCapacity:
      "Tüm katılımcılar için yeterli kapasite yok! Mevcut kapasiteye göre atama yapılacak.",
    assignedToTable: (name, table) => `${name} ${table}'e atandı!`,
    assignError: "Atama sırasında hata oluştu!",
    tableMarkedFull: (name) => `${name} dolu olarak işaretlenmiş!`,
    tableFull: (name) => `${name} dolu!`,
    participantUnassigned: "Katılımcı masadan çıkarıldı",
    unassignError: "Katılımcı çıkarılırken hata oluştu!",
    confirmRemoveParticipant: (name) =>
      `${name} katılımcısını silmek istediğinizden emin misiniz?`,
    participantDeleted: (name) => `${name} silindi`,
    deleteParticipantError: "Katılımcı silinirken hata oluştu!",
    confirmReset: "Tüm atamaları sıfırlamak istediğinizden emin misiniz?",
    allReset: "Tüm atamalar sıfırlandı!",
    resetError: "Sıfırlama sırasında hata oluştu!",
    tableMarkedFullInfo: (name) => `${name} dolu olarak işaretlendi`,
    tableAvailableAgain: (name) => `${name} tekrar müsait`,
    toggleTableError: "Masa durumu güncellenirken hata oluştu!",
    // ManualAssignmentRow
    assignToTable: "Masaya Ata",
    fullSuffix: "(Dolu)",
    noTable: "Masa yok",
    deleteParticipantTitle: "Katılımcıyı sil",
    // TableCard
    makeTableAvailable: "Masayı müsait yap",
    markTableFull: "Masayı dolu işaretle",
    editTableTitle: "Masayı düzenle",
    removeTableTitle: "Masayı kaldır",
    occupancy: "Doluluk",
    markedFull: "(Dolu işaretli)",
    showingInSearch: (n, total) =>
      `Aramada ${n} kişi gösteriliyor (toplam ${total})`,
    removeFromTable: "Masadan çıkar",
    noOneYet: "Henüz kimse yok",
    tableMarkedFullBtn: "Masa Dolu İşaretli",
    capacityFull: "Kontenjan Doldu",
    place: "Yerleştir",
    morePeople: (n) => `+${n} kişi daha`,
    // AddTableModal / EditTableModal
    addNewTable: "Yeni Masa Ekle",
    tableName: "Masa Adı",
    tableNamePlaceholder: "Örn: Masa 3",
    capacity: "Kapasite",
    cancel: "İptal",
    add: "Ekle",
    tableNameRequired: "Masa adı gerekli!",
    validCapacity: "Geçerli bir kapasite girin!",
    editTable: "Masayı Düzenle",
    update: "Güncelle",
    // AddParticipantModal
    addParticipantTitle: "Katılımcı Ekle",
    participantNames: "Katılımcı İsimleri",
    participantNamesPlaceholder:
      "Her satıra bir isim yazın:\nAhmet Yılmaz\nAyşe Demir\nMehmet Kaya",
    participantNamesHint:
      "Her satıra bir isim yazın. Birden fazla katılımcı ekleyebilirsiniz.",
  },
  en: {
    adminPanel: "Admin Panel",
    pageTitle: "Table Assignment Wheel",
    pageSubtitle: "Assign participants to tables randomly or manually",
    totalTables: "Total Tables",
    totalParticipants: "Total Participants",
    assigned: "Assigned",
    pending: "Pending",
    searchPlaceholder: "Search participant (assigned only)...",
    addTable: "Add Table",
    addParticipant: "Add Participant",
    randomAssign: "Random Assign",
    reset: "Reset",
    clear: "Clear",
    unassignedParticipants: (n) => `Unassigned Participants (${n})`,
    manualHint:
      'Click a participant and select the table you want, or use the "Random Assign" button',
    searchResult: (q, n) => `Search: "${q}" - ${n} results found`,
    noTables: "No tables yet",
    noTablesHint:
      "Add the first table and start assigning participants!",
    // Toasts
    loadTablesError: "An error occurred while loading tables!",
    loadParticipantsError: "An error occurred while loading participants!",
    tableAdded: (name) => `${name} added!`,
    addTableError: "An error occurred while adding the table!",
    tableUpdated: (name) => `${name} updated!`,
    updateTableError: "An error occurred while updating the table!",
    confirmRemoveTableWithParticipants:
      "This table has participants. If you remove the table, the participants will become unassigned. Do you want to continue?",
    tableRemoved: (name) => `${name} removed`,
    removeTableError: "An error occurred while removing the table!",
    enterParticipantName: "Enter at least one participant name!",
    participantAdded: (name) => `${name} added!`,
    participantsAdded: (n) => `${n} participants added!`,
    addParticipantsError: "An error occurred while adding participants!",
    noParticipantsToAssign: "No participants to assign!",
    noTablesAddFirst: "No tables! Please add a table first.",
    allTablesFull: "All tables are full!",
    notEnoughCapacity:
      "Not enough capacity for all participants! Assignment will be made based on available capacity.",
    assignedToTable: (name, table) => `${name} assigned to ${table}!`,
    assignError: "An error occurred during assignment!",
    tableMarkedFull: (name) => `${name} is marked as full!`,
    tableFull: (name) => `${name} is full!`,
    participantUnassigned: "Participant removed from table",
    unassignError: "An error occurred while removing the participant!",
    confirmRemoveParticipant: (name) =>
      `Are you sure you want to delete the participant ${name}?`,
    participantDeleted: (name) => `${name} deleted`,
    deleteParticipantError: "An error occurred while deleting the participant!",
    confirmReset: "Are you sure you want to reset all assignments?",
    allReset: "All assignments have been reset!",
    resetError: "An error occurred during reset!",
    tableMarkedFullInfo: (name) => `${name} marked as full`,
    tableAvailableAgain: (name) => `${name} is available again`,
    toggleTableError: "An error occurred while updating the table status!",
    // ManualAssignmentRow
    assignToTable: "Assign to Table",
    fullSuffix: "(Full)",
    noTable: "No tables",
    deleteParticipantTitle: "Delete participant",
    // TableCard
    makeTableAvailable: "Make table available",
    markTableFull: "Mark table as full",
    editTableTitle: "Edit table",
    removeTableTitle: "Remove table",
    occupancy: "Occupancy",
    markedFull: "(Marked full)",
    showingInSearch: (n, total) =>
      `Showing ${n} people in search (total ${total})`,
    removeFromTable: "Remove from table",
    noOneYet: "No one yet",
    tableMarkedFullBtn: "Table Marked Full",
    capacityFull: "Capacity Full",
    place: "Place",
    morePeople: (n) => `+${n} more people`,
    // AddTableModal / EditTableModal
    addNewTable: "Add New Table",
    tableName: "Table Name",
    tableNamePlaceholder: "e.g. Table 3",
    capacity: "Capacity",
    cancel: "Cancel",
    add: "Add",
    tableNameRequired: "Table name is required!",
    validCapacity: "Enter a valid capacity!",
    editTable: "Edit Table",
    update: "Update",
    // AddParticipantModal
    addParticipantTitle: "Add Participant",
    participantNames: "Participant Names",
    participantNamesPlaceholder:
      "Write one name per line:\nJohn Smith\nJane Doe\nMike Johnson",
    participantNamesHint:
      "Write one name per line. You can add multiple participants.",
  },
};

export default function TableAssignmentPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
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
        toast.error(copy.loadTablesError);
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
        toast.error(copy.loadParticipantsError);
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
      toast.success(copy.tableAdded(tableName));
    } catch (error) {
      console.error("Error adding table:", error);
      toast.error(copy.addTableError);
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
      toast.success(copy.tableUpdated(tableName));
    } catch (error) {
      console.error("Error updating table:", error);
      toast.error(copy.updateTableError);
    }
  };

  const handleRemoveTable = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    const assignedToTable = participants.filter(p => p.assignedTableId === tableId);

    if (assignedToTable.length > 0) {
      if (!confirm(copy.confirmRemoveTableWithParticipants)) {
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
      toast.info(copy.tableRemoved(table.name));
    } catch (error) {
      console.error("Error removing table:", error);
      toast.error(copy.removeTableError);
    }
  };

  const handleAddParticipant = async (participantNames) => {
    const names = participantNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      toast.error(copy.enterParticipantName);
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
        toast.success(copy.participantAdded(names[0]));
      } else {
        toast.success(copy.participantsAdded(names.length));
      }
    } catch (error) {
      console.error("Error adding participants:", error);
      toast.error(copy.addParticipantsError);
    }
  };

  const handleRandomAssignment = async () => {
    if (unassignedParticipants.length === 0) {
      toast.warning(copy.noParticipantsToAssign);
      return;
    }

    if (tables.length === 0) {
      toast.error(copy.noTablesAddFirst);
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
      toast.error(copy.allTablesFull);
      return;
    }

    const totalCapacity = tableCapacities.reduce((sum, t) => sum + t.available, 0);
    if (totalCapacity < unassignedParticipants.length) {
      toast.warning(copy.notEnoughCapacity);
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
        toast.success(copy.assignedToTable(participantName, tableName));
      });
    } catch (error) {
      console.error("Error during random assignment:", error);
      toast.error(copy.assignError);
    }
  };

  const handleAssignToTable = async (participantId, tableId) => {
    const table = tables.find(t => t.id === tableId);
    const participant = participants.find(p => p.id === participantId);
    const assignedToTable = participants.filter(p => p.assignedTableId === tableId);

    if (table.isFull) {
      toast.error(copy.tableMarkedFull(table.name));
      return;
    }

    if (assignedToTable.length >= table.capacity) {
      toast.error(copy.tableFull(table.name));
      return;
    }

    try {
      await updateDoc(doc(db, "tableAssignmentParticipants", participantId), {
        assignedTableId: tableId,
        updatedAt: serverTimestamp()
      });
      toast.success(copy.assignedToTable(participant.name, table.name));
    } catch (error) {
      console.error("Error assigning participant:", error);
      toast.error(copy.assignError);
    }
  };

  const handleUnassignParticipant = async (participantId) => {
    try {
      await updateDoc(doc(db, "tableAssignmentParticipants", participantId), {
        assignedTableId: null,
        updatedAt: serverTimestamp()
      });
      toast.info(copy.participantUnassigned);
    } catch (error) {
      console.error("Error unassigning participant:", error);
      toast.error(copy.unassignError);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    if (!confirm(copy.confirmRemoveParticipant(participant.name))) {
      return;
    }

    try {
      await deleteDoc(doc(db, "tableAssignmentParticipants", participantId));
      toast.info(copy.participantDeleted(participant.name));
    } catch (error) {
      console.error("Error deleting participant:", error);
      toast.error(copy.deleteParticipantError);
    }
  };

  const handleReset = async () => {
    if (!confirm(copy.confirmReset)) return;

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
      toast.success(copy.allReset);
    } catch (error) {
      console.error("Error resetting assignments:", error);
      toast.error(copy.resetError);
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
        toast.info(copy.tableMarkedFullInfo(table.name));
      } else {
        toast.info(copy.tableAvailableAgain(table.name));
      }
    } catch (error) {
      console.error("Error toggling table full status:", error);
      toast.error(copy.toggleTableError);
    }
  };

  if (loading) {
    return <p className="py-12 text-ink-2">{a.loading}</p>;
  }

  if (!userRole) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        {a.accessDenied}
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title={copy.pageTitle}
        description={copy.pageSubtitle}
      />

      {/* Stats */}
      <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        <Stat label={copy.totalTables} value={tables.length} />
        <Stat label={copy.totalParticipants} value={participants.length} />
        <Stat label={copy.assigned} value={assignedCount} />
        <Stat label={copy.pending} value={unassignedParticipants.length} />
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
            placeholder={copy.searchPlaceholder}
            className="pl-10 pr-12"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              aria-label={copy.clear}
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
            <span>{copy.addTable}</span>
          </Button>

          <Button variant="outline" onClick={() => setShowAddParticipantModal(true)}>
            <UserPlus aria-hidden="true" />
            <span>{copy.addParticipant}</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleRandomAssignment}
            disabled={unassignedParticipants.length === 0 || tables.length === 0}
          >
            <Shuffle aria-hidden="true" />
            <span>{copy.randomAssign}</span>
          </Button>

          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={assignedCount === 0}
          >
            <RefreshCw aria-hidden="true" />
            <span>{copy.reset}</span>
          </Button>
        </div>
      </div>

      {/* Unassigned Participants - Manual Assignment Section */}
      {unassignedParticipants.length > 0 && (
        <Section title={copy.unassignedParticipants(unassignedParticipants.length)} className="mb-10 mt-0 md:mt-0">
          <p className="mb-3 max-w-measure text-sm text-muted-foreground">
            {copy.manualHint}
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
            {copy.searchResult(searchQuery, filteredParticipants.filter(p => p.assignedTableId).length)}
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
            title={copy.noTables}
            description={copy.noTablesHint}
            action={<Button onClick={() => setShowAddTableModal(true)}>{copy.addTable}</Button>}
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
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
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
            <span>{copy.assignToTable}</span>
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
                        <span>{table.name} {table.isMarkedFull ? copy.fullSuffix : ''}</span>
                        <span className={`font-outlier text-xs tabular-nums ${isDisabled ? 'text-error' : 'text-muted-foreground'}`}>
                          {table.available}/{table.capacity}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    {copy.noTable}
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
        title={copy.deleteParticipantTitle}
        aria-label={copy.deleteParticipantTitle}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

// Table Card Component
function TableCard({ table, participants, allParticipants, unassignedParticipants, onRemove, onEdit, onUnassignParticipant, onAssignParticipant, onToggleFull, searchQuery }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
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
            title={isMarkedFull ? copy.makeTableAvailable : copy.markTableFull}
            aria-label={isMarkedFull ? copy.makeTableAvailable : copy.markTableFull}
          >
            {isMarkedFull ? <Unlock aria-hidden="true" /> : <Lock aria-hidden="true" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(table)}
            title={copy.editTableTitle}
            aria-label={copy.editTableTitle}
          >
            <Edit2 aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(table.id)}
            className="text-error"
            title={copy.removeTableTitle}
            aria-label={copy.removeTableTitle}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between gap-2 text-sm text-muted-foreground">
          <span>{copy.occupancy} {isMarkedFull && <span className="font-medium text-ink">{copy.markedFull}</span>}</span>
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
            {copy.showingInSearch(participants.length, totalAssigned)}
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
                  title={copy.removeFromTable}
                  aria-label={copy.removeFromTable}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-rule py-4 text-sm text-muted-foreground">{copy.noOneYet}</p>
        )}
      </div>

      {/* Assign Button or Full Indicator */}
      {isMarkedFull ? (
        <Button variant="secondary" disabled className="w-full">
          <Lock aria-hidden="true" />
          <span>{copy.tableMarkedFullBtn}</span>
        </Button>
      ) : isFullCapacity ? (
        <Button variant="secondary" disabled className="w-full">
          <span>{copy.capacityFull}</span>
        </Button>
      ) : unassignedParticipants.length > 0 ? (
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            className="w-full"
          >
            <Plus aria-hidden="true" />
            <span>{copy.place}</span>
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
                  {copy.morePeople(unassignedParticipants.length - 10)}
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
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("6");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error(copy.tableNameRequired);
      return;
    }
    if (!capacity || parseInt(capacity) < 1) {
      toast.error(copy.validCapacity);
      return;
    }
    onAdd(tableName, capacity);
    setTableName("");
    setCapacity("6");
  };

  return (
    <ModalFrame onClose={onClose} title={copy.addNewTable}>
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="table-add-name" label={copy.tableName}>
          <Input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder={copy.tableNamePlaceholder}
          />
        </Field>

        <Field id="table-add-capacity" label={copy.capacity}>
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
            {copy.cancel}
          </Button>
          <Button type="submit">{copy.add}</Button>
        </div>
      </form>
    </ModalFrame>
  );
}

// Add Participant Modal
function AddParticipantModal({ onClose, onAdd }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [participantNames, setParticipantNames] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!participantNames.trim()) {
      toast.error(copy.enterParticipantName);
      return;
    }
    onAdd(participantNames);
    setParticipantNames("");
  };

  return (
    <ModalFrame onClose={onClose} title={copy.addParticipantTitle}>
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field
          id="participant-add-names"
          label={copy.participantNames}
          help={copy.participantNamesHint}
        >
          <Textarea
            value={participantNames}
            onChange={(e) => setParticipantNames(e.target.value)}
            placeholder={copy.participantNamesPlaceholder}
            rows={6}
            className="resize-none"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {copy.cancel}
          </Button>
          <Button type="submit">{copy.add}</Button>
        </div>
      </form>
    </ModalFrame>
  );
}

// Edit Table Modal
function EditTableModal({ table, onClose, onEdit }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [tableName, setTableName] = useState(table.name);
  const [capacity, setCapacity] = useState(table.capacity.toString());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error(copy.tableNameRequired);
      return;
    }
    if (!capacity || parseInt(capacity) < 1) {
      toast.error(copy.validCapacity);
      return;
    }
    onEdit(tableName, capacity);
  };

  return (
    <ModalFrame onClose={onClose} title={copy.editTable}>
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="table-edit-name" label={copy.tableName}>
          <Input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder={copy.tableNamePlaceholder}
          />
        </Field>

        <Field id="table-edit-capacity" label={copy.capacity}>
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
            {copy.cancel}
          </Button>
          <Button type="submit">{copy.update}</Button>
        </div>
      </form>
    </ModalFrame>
  );
}
