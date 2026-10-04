"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { raffleUtils } from "@/utils/raffleUtils";
import { socialUtils } from "@/utils/socialUtils";
import { logger } from "@/utils/logger";
import {
  Trophy,
  Users,
  Calendar,
  Plus,
  Award,
  Edit3,
  Trash2,
  Megaphone,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input, fieldClasses } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminCopy } from "@/utils/adminCopy";
import { useConfirm } from "@/components/ConfirmProvider";

const COPY = {
  tr: {
    pageTitle: "Çekiliş Yönetimi",
    pageSubtitle: "Etkinlik çekilişlerini oluşturun ve yönetin",
    noEligibleEventTitle: "Çekiliş için uygun etkinlik yok (3 gün içinde ve en az 1 post)",
    noEligibleEvent: "Uygun Etkinlik Yok",
    newRaffle: "Yeni Çekiliş",
    statTotalRaffles: "Toplam Çekiliş",
    statActiveRaffles: "Aktif Çekiliş",
    statCompleted: "Tamamlanan",
    statTotalParticipants: "Toplam Katılım",
    noRafflesTitle: "Henüz çekiliş yok",
    noRafflesSubtitle: "İlk çekilişi oluşturun ve katılımcıları bekleyin!",
    createRaffle: "Çekiliş Oluştur",
    unknownEvent: "Bilinmeyen Etkinlik",
    // Card
    statusCompleted: "Tamamlandı",
    statusActive: "Aktif",
    statusPassive: "Pasif",
    participantsSuffix: "katılımcı",
    winnerLabel: (w) => `Kazanan: ${w}`,
    resultAnnounced: "Sonuç ilan edildi",
    viewParticipants: "Katılımcıları Gör",
    editRaffleTitle: "Çekiliş Detaylarını Düzenle",
    drawWinner: "Kazanan Seç",
    endRaffle: "Sonlandır",
    changeWinner: "Kazananı Değiştir",
    announceResult: "Sonucu İlan Et",
    deleteRaffleButton: "Çekilişi Sil",
    // Create modal
    createModalTitle: "Yeni Çekiliş Oluştur",
    eventLabel: "Etkinlik",
    selectEvent: "Etkinlik seçin",
    noEligibleEventOption: "Çekiliş için uygun etkinlik yok",
    postSuffix: (n) => `(${n} post)`,
    raffleTitleLabel: "Çekiliş Başlığı",
    prizeLabel: "Ödül",
    descriptionOptionalLabel: "Açıklama (İsteğe Bağlı)",
    create: "Oluştur",
    cancel: "İptal",
    close: "Kapat",
    // Participants modal
    participantsTitle: (title, n) => `${title} - Katılımcılar (${n})`,
    noParticipants: "Henüz katılımcı yok",
    // Change winner modal
    changeWinnerTitle: "Kazananı Değiştir",
    raffleColon: "Çekiliş:",
    currentWinnerColon: "Mevcut Kazanan:",
    notSelectedYet: "Henüz seçilmedi",
    selectNewWinner: "Yeni Kazanan Seçin",
    selectParticipant: "Katılımcı seçin...",
    noName: "İsim yok",
    // Edit modal
    editModalTitle: "Çekiliş Düzenle",
    eventColon: "Etkinlik:",
    raffleTitleRequired: "Çekiliş Başlığı *",
    raffleTitlePlaceholder: "Çekiliş başlığını girin",
    prizeRequired: "Ödül *",
    prizePlaceholder: "Ödülü girin",
    descriptionPlaceholder: "Çekiliş açıklamasını girin",
    update: "Güncelle",
    // Toasts / confirms
    raffleLoadError: "Çekilişler yüklenirken hata oluştu!",
    raffleCreated: "Çekiliş başarıyla oluşturuldu!",
    raffleCreateError: "Çekiliş oluşturulurken hata oluştu!",
    confirmDrawWinner: "Çekilişi sonlandırıp kazananı belirlemek istediğinizden emin misiniz?",
    winnerToast: (w) => `Kazanan: ${w}`,
    drawWinnerError: "Kazanan seçilirken hata oluştu!",
    confirmEndRaffle: "Çekilişi kazanan seçmeden sonlandırmak istediğinizden emin misiniz?",
    raffleEnded: "Çekiliş sonlandırıldı!",
    raffleEndError: "Çekiliş sonlandırılırken hata oluştu!",
    newWinnerToast: (w) => `Yeni kazanan: ${w}`,
    changeWinnerError: "Kazanan değiştirilirken hata oluştu!",
    confirmAnnounce: "Çekiliş sonucunu sosyal kısımda ilan etmek istediğinizden emin misiniz?",
    resultAnnouncedToast: "Çekiliş sonucu başarıyla ilan edildi!",
    announceError: "Çekiliş sonucu ilan edilirken hata oluştu!",
    raffleUpdated: "Çekiliş başarıyla güncellendi!",
    raffleUpdateError: "Çekiliş güncellenirken hata oluştu!",
    confirmDeleteRaffle: "Bu çekilişi ve tüm ilgili verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!",
    confirmDeleteRaffleFinal: "Son kez soruyoruz: Çekiliş tamamen silinecek, emin misiniz?",
    raffleDeleted: "Çekiliş başarıyla silindi!",
    raffleDeleteError: "Çekiliş silinirken hata oluştu!",
    fillRequiredFields: "Lütfen gerekli alanları doldurun!",
    selectWinnerPrompt: "Lütfen bir kazanan seçin!",
    confirmChangeWinner: "Seçilen kişiyi yeni kazanan yapmak istediğinizden emin misiniz?",
    titleAndPrizeRequired: "Başlık ve ödül alanları zorunludur!",
    confirmUpdateRaffle: "Çekiliş detaylarını güncellemek istediğinizden emin misiniz?",
    locale: "tr-TR",
  },
  en: {
    pageTitle: "Raffle Management",
    pageSubtitle: "Create and manage event raffles",
    noEligibleEventTitle: "No eligible event for a raffle (within 3 days and at least 1 post)",
    noEligibleEvent: "No Eligible Event",
    newRaffle: "New Raffle",
    statTotalRaffles: "Total Raffles",
    statActiveRaffles: "Active Raffles",
    statCompleted: "Completed",
    statTotalParticipants: "Total Participants",
    noRafflesTitle: "No raffles yet",
    noRafflesSubtitle: "Create your first raffle and wait for participants!",
    createRaffle: "Create Raffle",
    unknownEvent: "Unknown Event",
    // Card
    statusCompleted: "Completed",
    statusActive: "Active",
    statusPassive: "Inactive",
    participantsSuffix: "participant(s)",
    winnerLabel: (w) => `Winner: ${w}`,
    resultAnnounced: "Result announced",
    viewParticipants: "View Participants",
    editRaffleTitle: "Edit Raffle Details",
    drawWinner: "Draw Winner",
    endRaffle: "End",
    changeWinner: "Change Winner",
    announceResult: "Announce Result",
    deleteRaffleButton: "Delete Raffle",
    // Create modal
    createModalTitle: "Create New Raffle",
    eventLabel: "Event",
    selectEvent: "Select an event",
    noEligibleEventOption: "No eligible event for a raffle",
    postSuffix: (n) => `(${n} post(s))`,
    raffleTitleLabel: "Raffle Title",
    prizeLabel: "Prize",
    descriptionOptionalLabel: "Description (Optional)",
    create: "Create",
    cancel: "Cancel",
    close: "Close",
    // Participants modal
    participantsTitle: (title, n) => `${title} - Participants (${n})`,
    noParticipants: "No participants yet",
    // Change winner modal
    changeWinnerTitle: "Change Winner",
    raffleColon: "Raffle:",
    currentWinnerColon: "Current Winner:",
    notSelectedYet: "Not selected yet",
    selectNewWinner: "Select New Winner",
    selectParticipant: "Select a participant...",
    noName: "No name",
    // Edit modal
    editModalTitle: "Edit Raffle",
    eventColon: "Event:",
    raffleTitleRequired: "Raffle Title *",
    raffleTitlePlaceholder: "Enter the raffle title",
    prizeRequired: "Prize *",
    prizePlaceholder: "Enter the prize",
    descriptionPlaceholder: "Enter the raffle description",
    update: "Update",
    // Toasts / confirms
    raffleLoadError: "An error occurred while loading raffles!",
    raffleCreated: "Raffle created successfully!",
    raffleCreateError: "An error occurred while creating the raffle!",
    confirmDrawWinner: "Are you sure you want to end the raffle and pick a winner?",
    winnerToast: (w) => `Winner: ${w}`,
    drawWinnerError: "An error occurred while drawing the winner!",
    confirmEndRaffle: "Are you sure you want to end the raffle without picking a winner?",
    raffleEnded: "Raffle ended!",
    raffleEndError: "An error occurred while ending the raffle!",
    newWinnerToast: (w) => `New winner: ${w}`,
    changeWinnerError: "An error occurred while changing the winner!",
    confirmAnnounce: "Are you sure you want to announce the raffle result in the social section?",
    resultAnnouncedToast: "Raffle result announced successfully!",
    announceError: "An error occurred while announcing the raffle result!",
    raffleUpdated: "Raffle updated successfully!",
    raffleUpdateError: "An error occurred while updating the raffle!",
    confirmDeleteRaffle: "Are you sure you want to delete this raffle and all related data? This action cannot be undone!",
    confirmDeleteRaffleFinal: "Asking one last time: the raffle will be permanently deleted, are you sure?",
    raffleDeleted: "Raffle deleted successfully!",
    raffleDeleteError: "An error occurred while deleting the raffle!",
    fillRequiredFields: "Please fill in the required fields!",
    selectWinnerPrompt: "Please select a winner!",
    confirmChangeWinner: "Are you sure you want to make the selected person the new winner?",
    titleAndPrizeRequired: "Title and prize fields are required!",
    confirmUpdateRaffle: "Are you sure you want to update the raffle details?",
    locale: "en-US",
  },
};

export default function AdminRafflesPage() {
  const confirm = useConfirm();
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [raffles, setRaffles] = useState([]);
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChangeWinnerModal, setShowChangeWinnerModal] = useState(false);
  const [changeWinnerRaffle, setChangeWinnerRaffle] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRaffle, setEditRaffle] = useState(null);
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
        logger.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadRaffles();
      loadEvents();
      loadStats();
    }
  }, [isAdmin]);

  // Prevent body scroll when any modal is open
  useEffect(() => {
    if (showCreateModal || showChangeWinnerModal || showEditModal || selectedRaffle) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showChangeWinnerModal, showEditModal, selectedRaffle]);

  const loadRaffles = async () => {
    setIsLoading(true);
    const result = await raffleUtils.getRaffles();
    if (result.success) {
      setRaffles(result.raffles);
    } else {
      toast.error(copy.raffleLoadError);
    }
    setIsLoading(false);
  };

  const loadEvents = async () => {
    try {
      // Get events that are postable (within 3 days) using socialUtils
      const activeEventsResult = await socialUtils.getActiveEventsForPosting();
      
      if (!activeEventsResult.success) {
        logger.error("Error loading active events:", activeEventsResult.error);
        return;
      }

      const postableEvents = activeEventsResult.events.filter(event => event.canPost);

      // For each postable event, check if it has posts
      const eventsWithPosts = [];
      
      for (const event of postableEvents) {
        try {
          // Count posts for this event
          const postsQuery = query(
            collection(db, "posts"), 
            where("eventId", "==", event.id)
          );
          const postsSnapshot = await getDocs(postsQuery);
          const posts = postsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
          const postCount = postsSnapshot.size;
          

          if (postCount > 0) {
            eventsWithPosts.push({
              ...event,
              postCount
            });
          }
        } catch (error) {
          logger.error(`Error counting posts for event ${event.name}:`, error);
        }
      }

      setEvents(eventsWithPosts);
                  
    } catch (error) {
      logger.error("Error loading events:", error);
    }
  };

  const loadStats = async () => {
    const result = await raffleUtils.getRaffleStats();
    if (result.success) {
      setStats(result.stats);
    }
  };

  const loadParticipants = async (raffleId) => {
    const result = await raffleUtils.getRaffleParticipants(raffleId);
    if (result.success) {
      setParticipants(result.participants);
    }
  };

  const handleCreateRaffle = async (formData) => {
    const selectedEvent = events.find(e => e.id === formData.eventId);
    
    const raffleData = {
      eventId: formData.eventId,
      eventName: selectedEvent?.name || copy.unknownEvent,
      title: formData.title,
      description: formData.description,
      prize: formData.prize,
      startDate: selectedEvent?.startDate || new Date(),
      endDate: new Date(selectedEvent?.startDate?.toDate?.() || selectedEvent?.startDate || new Date()),
      createdBy: user.uid,
    };

    // Set end date to 3 days after event start
    if (raffleData.startDate.toDate) {
      raffleData.endDate = new Date(raffleData.startDate.toDate().getTime() + (3 * 24 * 60 * 60 * 1000));
    } else {
      raffleData.endDate = new Date(raffleData.startDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    }

    const result = await raffleUtils.createRaffle(raffleData);
    if (result.success) {
      toast.success(copy.raffleCreated);
      
      // Add the new raffle to state instead of refetching
      const newRaffle = {
        id: result.id,
        ...raffleData,
        isActive: true,
        isCompleted: false,
        participants: result.participants || [],
        winner: null,
        createdAt: new Date(),
      };
      
      setRaffles(prevRaffles => [newRaffle, ...prevRaffles]);
      
      // Update stats
      if (stats) {
        const participantCount = result.participantCount || 0;
        setStats(prevStats => ({
          ...prevStats,
          totalRaffles: prevStats.totalRaffles + 1,
          activeRaffles: prevStats.activeRaffles + 1,
          totalParticipants: prevStats.totalParticipants + participantCount,
          averageParticipantsPerRaffle: (prevStats.totalParticipants + participantCount) / (prevStats.totalRaffles + 1),
        }));
      }
      
      setShowCreateModal(false);
    } else {
      toast.error(copy.raffleCreateError);
    }
  };

  const handleDrawWinner = async (raffleId) => {
    if (!(await confirm(copy.confirmDrawWinner))) return;

    const result = await raffleUtils.drawWinner(raffleId);
    if (result.success) {
      toast.success(copy.winnerToast(result.winner.userEmail));
      
      // Update raffles state
      setRaffles(prevRaffles => 
        prevRaffles.map(raffle => 
          raffle.id === raffleId 
            ? { 
                ...raffle, 
                isCompleted: true, 
                isActive: false, 
                winner: result.winner.userEmail,
                winnerId: result.winner.userId,
                winnerName: result.winner.userName,
                completedAt: new Date(),
              }
            : raffle
        )
      );
      
      // Update stats
      if (stats) {
        setStats(prevStats => ({
          ...prevStats,
          activeRaffles: Math.max(0, prevStats.activeRaffles - 1),
          completedRaffles: prevStats.completedRaffles + 1,
        }));
      }
    } else {
      toast.error(result.error || copy.drawWinnerError);
    }
  };

  const handleEndRaffle = async (raffleId) => {
    if (!(await confirm(copy.confirmEndRaffle))) return;

    const result = await raffleUtils.endRaffle(raffleId);
    if (result.success) {
      toast.success(copy.raffleEnded);
      
      // Update raffles state
      setRaffles(prevRaffles => 
        prevRaffles.map(raffle => 
          raffle.id === raffleId 
            ? { 
                ...raffle, 
                isActive: false,
                endedAt: new Date(),
              }
            : raffle
        )
      );
      
      // Update stats
      if (stats) {
        setStats(prevStats => ({
          ...prevStats,
          activeRaffles: Math.max(0, prevStats.activeRaffles - 1),
        }));
      }
    } else {
      toast.error(copy.raffleEndError);
    }
  };

  const handleChangeWinner = async (raffleId, newWinnerId) => {
    const result = await raffleUtils.changeWinner(raffleId, newWinnerId);
    if (result.success) {
      toast.success(copy.newWinnerToast(result.winner.userEmail));
      
      // Update raffles state
      setRaffles(prevRaffles => 
        prevRaffles.map(raffle => 
          raffle.id === raffleId 
            ? { 
                ...raffle, 
                winner: result.winner.userEmail,
                winnerId: result.winner.userId,
                winnerName: result.winner.userName,
                isCompleted: true,
                isActive: false,
                completedAt: new Date(),
              }
            : raffle
        )
      );
      
      setShowChangeWinnerModal(false);
      setChangeWinnerRaffle(null);
    } else {
      toast.error(result.error || copy.changeWinnerError);
    }
  };

  const handleAnnounceResult = async (raffleId) => {
    if (!(await confirm(copy.confirmAnnounce))) return;

    const result = await raffleUtils.announceRaffleResult(raffleId);
    if (result.success) {
      toast.success(copy.resultAnnouncedToast);
      
      // Update raffles state
      setRaffles(prevRaffles => 
        prevRaffles.map(raffle => 
          raffle.id === raffleId 
            ? { 
                ...raffle, 
                isAnnounced: true,
                announcedAt: new Date(),
                announcementId: result.announcementId,
              }
            : raffle
        )
      );
    } else {
      toast.error(result.error || copy.announceError);
    }
  };

  const handleEditRaffle = async (raffleId, updatedData) => {
    const result = await raffleUtils.updateRaffle(raffleId, updatedData);
    if (result.success) {
      toast.success(copy.raffleUpdated);
      
      // Update raffles state
      setRaffles(prevRaffles => 
        prevRaffles.map(raffle => 
          raffle.id === raffleId 
            ? { ...raffle, ...updatedData }
            : raffle
        )
      );
      
      setShowEditModal(false);
      setEditRaffle(null);
    } else {
      toast.error(result.error || copy.raffleUpdateError);
    }
  };

  const handleDeleteRaffle = async (raffleId) => {
    if (!(await confirm(copy.confirmDeleteRaffle, { destructive: true }))) return;
    
    if (!(await confirm(copy.confirmDeleteRaffleFinal, { destructive: true }))) return;

    // Find the raffle to be deleted for stats calculation
    const raffleToDelete = raffles.find(r => r.id === raffleId);
    
    const result = await raffleUtils.deleteRaffle(raffleId);
    if (result.success) {
      toast.success(copy.raffleDeleted);
      
      // Update raffles state by removing the deleted raffle
      setRaffles(prevRaffles => prevRaffles.filter(r => r.id !== raffleId));
      
      // Update stats state
      if (stats && raffleToDelete) {
        setStats(prevStats => {
          const newStats = { ...prevStats };
          newStats.totalRaffles = Math.max(0, newStats.totalRaffles - 1);
          
          if (raffleToDelete.isActive) {
            newStats.activeRaffles = Math.max(0, newStats.activeRaffles - 1);
          }
          
          if (raffleToDelete.isCompleted) {
            newStats.completedRaffles = Math.max(0, newStats.completedRaffles - 1);
          }
          
          // Reduce total participants by the number of participants in this raffle
          const participantCount = raffleToDelete.participants?.length || 0;
          newStats.totalParticipants = Math.max(0, newStats.totalParticipants - participantCount);
          
          // Recalculate average
          newStats.averageParticipantsPerRaffle = newStats.totalRaffles > 0 ? 
            newStats.totalParticipants / newStats.totalRaffles : 0;
          
          return newStats;
        });
      }
    } else {
      toast.error(result.error || copy.raffleDeleteError);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(copy.locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <p className="py-12 text-ink-2">{a.loading}</p>;
  }

  if (!isAdmin) {
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
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={events.length === 0}
            title={events.length === 0 ? copy.noEligibleEventTitle : ""}
          >
            <Plus aria-hidden="true" />
            <span>{events.length === 0 ? copy.noEligibleEvent : copy.newRaffle}</span>
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
          <Stat label={copy.statTotalRaffles} value={stats.totalRaffles} />
          <Stat label={copy.statActiveRaffles} value={stats.activeRaffles} />
          <Stat label={copy.statCompleted} value={stats.completedRaffles} />
          <Stat label={copy.statTotalParticipants} value={stats.totalParticipants} />
        </dl>
      )}

      {/* Raffles List */}
      {isLoading ? (
        <div className="flex items-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
      ) : raffles.length > 0 ? (
        <ul className="border-t-2 border-ink">
          {raffles.map((raffle) => (
            <RaffleCard
              key={raffle.id}
              copy={copy}
              raffle={raffle}
              onDrawWinner={() => handleDrawWinner(raffle.id)}
              onEndRaffle={() => handleEndRaffle(raffle.id)}
              onViewParticipants={() => {
                setSelectedRaffle(raffle);
                loadParticipants(raffle.id);
              }}
              onChangeWinner={() => {
                setChangeWinnerRaffle(raffle);
                loadParticipants(raffle.id);
                setShowChangeWinnerModal(true);
              }}
              onEditRaffle={() => {
                setEditRaffle(raffle);
                setShowEditModal(true);
              }}
              onAnnounceResult={() => handleAnnounceResult(raffle.id)}
              onDeleteRaffle={() => handleDeleteRaffle(raffle.id)}
              formatDate={formatDate}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={copy.noRafflesTitle}
          description={copy.noRafflesSubtitle}
          action={<Button onClick={() => setShowCreateModal(true)}>{copy.createRaffle}</Button>}
        />
      )}

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <CreateRaffleModal
          events={events}
          copy={copy}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRaffle}
        />
      )}

      {/* Participants Modal */}
      {selectedRaffle && (
        <ParticipantsModal
          raffle={selectedRaffle}
          copy={copy}
          participants={participants}
          onClose={() => setSelectedRaffle(null)}
          formatDate={formatDate}
        />
      )}

      {/* Change Winner Modal */}
      {showChangeWinnerModal && changeWinnerRaffle && (
        <ChangeWinnerModal
          raffle={changeWinnerRaffle}
          copy={copy}
          participants={participants}
          onClose={() => {
            setShowChangeWinnerModal(false);
            setChangeWinnerRaffle(null);
          }}
          onChangeWinner={handleChangeWinner}
        />
      )}

      {/* Edit Raffle Modal */}
      {showEditModal && editRaffle && (
        <EditRaffleModal
          raffle={editRaffle}
          copy={copy}
          onClose={() => {
            setShowEditModal(false);
            setEditRaffle(null);
          }}
          onUpdate={handleEditRaffle}
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
function ModalFrame({ onClose, closeLabel, wide = false, title, children }) {
  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
    >
      <div
        className={cn(
          "flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-lg border border-rule bg-background p-6 text-foreground animate-in fade-in-0 duration-short",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="min-w-0 font-display text-lg font-bold">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-3 -mt-3 shrink-0"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Raffle Card Component
function RaffleCard({ raffle, copy, onDrawWinner, onEndRaffle, onViewParticipants, onChangeWinner, onEditRaffle, onAnnounceResult, onDeleteRaffle, formatDate }) {
  const getStatusVariant = () => {
    if (raffle.isCompleted) return "success";
    if (raffle.isActive) return "accent";
    return "neutral";
  };

  const getStatusText = () => {
    if (raffle.isCompleted) return copy.statusCompleted;
    if (raffle.isActive) return copy.statusActive;
    return copy.statusPassive;
  };

  return (
    <li className="border-b border-rule py-6">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="min-w-0 font-display text-lg font-semibold">{raffle.title}</h3>
        <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
        <div className="flex min-w-0 items-center">
          <Calendar className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">{raffle.eventName}</span>
        </div>
        <div className="flex items-center">
          <Users className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">{raffle.participants?.length || 0}</span>&nbsp;{copy.participantsSuffix}
        </div>
        <div className="flex min-w-0 items-center">
          <Award className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">{raffle.prize}</span>
        </div>
      </div>

      {raffle.description && (
        <p className="mb-4 max-w-measure text-sm text-ink-2">{raffle.description}</p>
      )}

      {raffle.winner && (
        <div className="mb-4 flex flex-col gap-1 text-sm">
          <p className="flex min-w-0 items-center gap-2 font-medium text-ink">
            <Trophy className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span className="min-w-0 break-all">{copy.winnerLabel(raffle.winner)}</span>
          </p>
          {raffle.isAnnounced && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
              {copy.resultAnnounced}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onViewParticipants}>
          {copy.viewParticipants}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onEditRaffle}
          title={copy.editRaffleTitle}
          aria-label={copy.editRaffleTitle}
        >
          <Edit3 aria-hidden="true" />
        </Button>

        {raffle.isActive && !raffle.isCompleted && (
          <>
            <Button onClick={onDrawWinner}>{copy.drawWinner}</Button>
            <Button variant="outline" onClick={onEndRaffle}>
              {copy.endRaffle}
            </Button>
          </>
        )}

        {raffle.isCompleted && raffle.winner && (
          <>
            <Button variant="outline" onClick={onChangeWinner}>
              {copy.changeWinner}
            </Button>
            {!raffle.isAnnounced && (
              <Button onClick={onAnnounceResult}>{copy.announceResult}</Button>
            )}
          </>
        )}

        {/* Delete button - always available for admins */}
        <Button variant="destructive" onClick={onDeleteRaffle} className="sm:ml-auto">
          <Trash2 aria-hidden="true" />
          {copy.deleteRaffleButton}
        </Button>
      </div>
    </li>
  );
}

// Create Raffle Modal
function CreateRaffleModal({ events, copy, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    eventId: "",
    title: "",
    description: "",
    prize: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.eventId || !formData.title || !formData.prize) {
      toast.error(copy.fillRequiredFields);
      return;
    }
    onCreate(formData);
  };

  return (
    <ModalFrame onClose={onClose} closeLabel={copy.close} title={copy.createModalTitle}>
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="raffle-create-event" label={copy.eventLabel}>
          <select
            value={formData.eventId}
            onChange={(e) => setFormData({...formData, eventId: e.target.value})}
            required
            className={cn(fieldClasses, "h-control")}
          >
            <option value="">
              {events.length > 0 ? copy.selectEvent : copy.noEligibleEventOption}
            </option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} {copy.postSuffix(event.postCount)}
              </option>
            ))}
          </select>
        </Field>

        <Field id="raffle-create-title" label={copy.raffleTitleLabel}>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </Field>

        <Field id="raffle-create-prize" label={copy.prizeLabel}>
          <Input
            type="text"
            value={formData.prize}
            onChange={(e) => setFormData({...formData, prize: e.target.value})}
            required
          />
        </Field>

        <Field id="raffle-create-description" label={copy.descriptionOptionalLabel}>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {copy.cancel}
          </Button>
          <Button type="submit" disabled={events.length === 0}>
            {events.length === 0 ? copy.noEligibleEvent : copy.create}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

// Participants Modal
function ParticipantsModal({ raffle, participants, copy, onClose, formatDate }) {
  return (
    <ModalFrame
      onClose={onClose}
      closeLabel={copy.close}
      wide
      title={copy.participantsTitle(raffle.title, participants.length)}
    >
      {participants.length > 0 ? (
        <ul className="border-t border-rule">
          {participants.map((participant, index) => (
            <li
              key={participant.id}
              className="flex items-center justify-between gap-4 border-b border-rule py-3"
            >
              <div className="min-w-0">
                <p className="break-all font-medium">{participant.userEmail}</p>
                <p className="font-outlier text-sm text-muted-foreground">
                  {formatDate(participant.participatedAt)}
                </p>
              </div>
              <span className="shrink-0 font-outlier text-sm tabular-nums text-muted-foreground">
                #{index + 1}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-muted-foreground">{copy.noParticipants}</p>
      )}
    </ModalFrame>
  );
}

// Change Winner Modal
function ChangeWinnerModal({ raffle, participants, copy, onClose, onChangeWinner }) {
  const confirm = useConfirm();
  const [selectedWinnerId, setSelectedWinnerId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWinnerId) {
      toast.error(copy.selectWinnerPrompt);
      return;
    }

    if (!(await confirm(copy.confirmChangeWinner))) return;

    onChangeWinner(raffle.id, selectedWinnerId);
  };

  return (
    <ModalFrame onClose={onClose} closeLabel={copy.close} title={copy.changeWinnerTitle}>
      <div className="mb-4 space-y-1 text-sm text-ink-2">
        <p>
          <strong className="text-ink">{copy.raffleColon}</strong> {raffle.title}
        </p>
        <p>
          <strong className="text-ink">{copy.currentWinnerColon}</strong> {raffle.winner || copy.notSelectedYet}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="raffle-change-winner" label={copy.selectNewWinner}>
          <select
            value={selectedWinnerId}
            onChange={(e) => setSelectedWinnerId(e.target.value)}
            required
            className={cn(fieldClasses, "h-control")}
          >
            <option value="">{copy.selectParticipant}</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.userId}>
                {participant.userEmail} ({participant.userName || copy.noName})
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {copy.cancel}
          </Button>
          <Button type="submit">{copy.changeWinner}</Button>
        </div>
      </form>
    </ModalFrame>
  );
}

// Edit Raffle Modal
function EditRaffleModal({ raffle, copy, onClose, onUpdate }) {
  const confirm = useConfirm();
  const [formData, setFormData] = useState({
    title: raffle.title || "",
    description: raffle.description || "",
    prize: raffle.prize || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.prize.trim()) {
      toast.error(copy.titleAndPrizeRequired);
      return;
    }

    if (!(await confirm(copy.confirmUpdateRaffle))) return;

    onUpdate(raffle.id, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      prize: formData.prize.trim(),
    });
  };

  return (
    <ModalFrame onClose={onClose} closeLabel={copy.close} title={copy.editModalTitle}>
      <p className="mb-4 text-sm text-ink-2">
        <strong className="text-ink">{copy.eventColon}</strong> {raffle.eventName}
      </p>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="raffle-edit-title" label={copy.raffleTitleRequired}>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            placeholder={copy.raffleTitlePlaceholder}
          />
        </Field>

        <Field id="raffle-edit-prize" label={copy.prizeRequired}>
          <Input
            type="text"
            value={formData.prize}
            onChange={(e) => setFormData({...formData, prize: e.target.value})}
            required
            placeholder={copy.prizePlaceholder}
          />
        </Field>

        <Field id="raffle-edit-description" label={copy.descriptionOptionalLabel}>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            placeholder={copy.descriptionPlaceholder}
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
