"use client";
import { useEffect, useState } from "react";
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
  Play, 
  Pause, 
  Award, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  ArrowLeft
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    adminPanel: "Admin Panel",
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
    participantCount: (n) => `${n} katılımcı`,
    winnerLabel: (w) => `🎉 Kazanan: ${w}`,
    resultAnnounced: "📢 Sonuç ilan edildi",
    viewParticipants: "Katılımcıları Gör",
    editRaffleTitle: "Çekiliş Detaylarını Düzenle",
    drawWinner: "Kazanan Seç",
    endRaffle: "Sonlandır",
    changeWinner: "Kazananı Değiştir",
    announceResult: "Sonucu İlan Et",
    deleteRaffleButton: "🗑️ Çekilişi Sil",
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
    adminPanel: "Admin Panel",
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
    participantCount: (n) => `${n} participant(s)`,
    winnerLabel: (w) => `🎉 Winner: ${w}`,
    resultAnnounced: "📢 Result announced",
    viewParticipants: "View Participants",
    editRaffleTitle: "Edit Raffle Details",
    drawWinner: "Draw Winner",
    endRaffle: "End",
    changeWinner: "Change Winner",
    announceResult: "Announce Result",
    deleteRaffleButton: "🗑️ Delete Raffle",
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
    if (!confirm(copy.confirmDrawWinner)) return;

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
      toast.error(copy.drawWinnerError);
    }
  };

  const handleEndRaffle = async (raffleId) => {
    if (!confirm(copy.confirmEndRaffle)) return;

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
      toast.error(copy.changeWinnerError);
    }
  };

  const handleAnnounceResult = async (raffleId) => {
    if (!confirm(copy.confirmAnnounce)) return;

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
      toast.error(copy.announceError);
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
      toast.error(copy.raffleUpdateError);
    }
  };

  const handleDeleteRaffle = async (raffleId) => {
    if (!confirm(copy.confirmDeleteRaffle)) return;

    if (!confirm(copy.confirmDeleteRaffleFinal)) return;

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
      toast.error(copy.raffleDeleteError);
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-gray-200">{a.loading}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">{a.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{copy.adminPanel}</span>
            </button>
            <div className="border-l border-gray-500 h-8"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                {copy.pageTitle}
              </h1>
              <p className="text-gray-300">
                {copy.pageSubtitle}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={events.length === 0}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
              events.length === 0 
                ? "bg-gray-300 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            title={events.length === 0 ? copy.noEligibleEventTitle : ""}
          >
            <Plus className="w-5 h-5" />
            <span>{events.length === 0 ? copy.noEligibleEvent : copy.newRaffle}</span>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">{copy.statTotalRaffles}</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.totalRaffles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">{copy.statActiveRaffles}</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.activeRaffles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">{copy.statCompleted}</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.completedRaffles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">{copy.statTotalParticipants}</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.totalParticipants}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raffles List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {raffles.length > 0 ? (
              raffles.map((raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  copy={copy}
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
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-800 rounded-lg p-8">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    {copy.noRafflesTitle}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {copy.noRafflesSubtitle}
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copy.createRaffle}
                  </button>
                </div>
              </div>
            )}
          </div>
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
            participants={participants}
            copy={copy}
            onClose={() => setSelectedRaffle(null)}
            formatDate={formatDate}
          />
        )}

        {/* Change Winner Modal */}
        {showChangeWinnerModal && changeWinnerRaffle && (
          <ChangeWinnerModal
            raffle={changeWinnerRaffle}
            participants={participants}
            copy={copy}
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
    </div>
  );
}

// Raffle Card Component
function RaffleCard({ raffle, copy, onDrawWinner, onEndRaffle, onViewParticipants, onChangeWinner, onEditRaffle, onAnnounceResult, onDeleteRaffle, formatDate }) {
  const getStatusColor = () => {
    if (raffle.isCompleted) return "bg-green-500";
    if (raffle.isActive) return "bg-blue-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (raffle.isCompleted) return copy.statusCompleted;
    if (raffle.isActive) return copy.statusActive;
    return copy.statusPassive;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{raffle.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-300">
          <Calendar className="w-4 h-4 mr-2" />
          {raffle.eventName}
        </div>
        <div className="flex items-center text-sm text-gray-300">
          <Users className="w-4 h-4 mr-2" />
          {copy.participantCount(raffle.participants?.length || 0)}
        </div>
        <div className="flex items-center text-sm text-gray-300">
          <Award className="w-4 h-4 mr-2" />
          {raffle.prize}
        </div>
      </div>

      {raffle.description && (
        <p className="text-gray-300 text-sm mb-4">{raffle.description}</p>
      )}

      {raffle.winner && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
          <p className="text-green-800 font-medium">{copy.winnerLabel(raffle.winner)}</p>
          {raffle.isAnnounced && (
            <p className="text-green-400 text-sm mt-1">{copy.resultAnnounced}</p>
          )}
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={onViewParticipants}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors text-sm"
          >
            {copy.viewParticipants}
          </button>

          <button
            onClick={onEditRaffle}
            className="bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition-colors text-sm flex items-center"
            title={copy.editRaffleTitle}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          {raffle.isActive && !raffle.isCompleted && (
            <>
              <button
                onClick={onDrawWinner}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm"
              >
                {copy.drawWinner}
              </button>
              <button
                onClick={onEndRaffle}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm"
              >
                {copy.endRaffle}
              </button>
            </>
          )}
        </div>

        {raffle.isCompleted && raffle.winner && (
          <div className="flex space-x-2">
            <button
              onClick={onChangeWinner}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors text-sm"
            >
              {copy.changeWinner}
            </button>
            {!raffle.isAnnounced && (
              <button
                onClick={onAnnounceResult}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
              >
                {copy.announceResult}
              </button>
            )}
          </div>
        )}
        
        {/* Delete button - always available for admins */}
        <div className="mt-2 pt-2 border-t border-gray-600">
          <button
            onClick={onDeleteRaffle}
            className="w-full bg-red-700 text-white py-2 px-4 rounded hover:bg-red-800 transition-colors text-sm font-medium"
          >
            {copy.deleteRaffleButton}
          </button>
        </div>
      </div>
    </div>
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{copy.createModalTitle}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {copy.eventLabel}
            </label>
            <select
              value={formData.eventId}
              onChange={(e) => setFormData({...formData, eventId: e.target.value})}
              required
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {copy.raffleTitleLabel}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {copy.prizeLabel}
            </label>
            <input
              type="text"
              value={formData.prize}
              onChange={(e) => setFormData({...formData, prize: e.target.value})}
              required
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {copy.descriptionOptionalLabel}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-200 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={events.length === 0}
              className={`flex-1 py-2 rounded transition-colors ${
                events.length === 0
                  ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {events.length === 0 ? copy.noEligibleEvent : copy.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Participants Modal
function ParticipantsModal({ raffle, participants, copy, onClose, formatDate }) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {copy.participantsTitle(raffle.title, participants.length)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {participants.length > 0 ? (
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{participant.userEmail}</p>
                    <p className="text-sm text-gray-300">
                      {formatDate(participant.participatedAt)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">{copy.noParticipants}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Change Winner Modal
function ChangeWinnerModal({ raffle, participants, copy, onClose, onChangeWinner }) {
  const [selectedWinnerId, setSelectedWinnerId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedWinnerId) {
      toast.error(copy.selectWinnerPrompt);
      return;
    }

    if (!confirm(copy.confirmChangeWinner)) return;
    
    onChangeWinner(raffle.id, selectedWinnerId);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{copy.changeWinnerTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">
            <strong>{copy.raffleColon}</strong> {raffle.title}
          </p>
          <p className="text-sm text-gray-300 mb-4">
            <strong>{copy.currentWinnerColon}</strong> {raffle.winner || copy.notSelectedYet}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              {copy.selectNewWinner}
            </label>
            <select
              value={selectedWinnerId}
              onChange={(e) => setSelectedWinnerId(e.target.value)}
              required
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-40"
            >
              <option value="">{copy.selectParticipant}</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.userId}>
                  {participant.userEmail} ({participant.userName || copy.noName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-200 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors"
            >
              {copy.changeWinner}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Raffle Modal
function EditRaffleModal({ raffle, copy, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: raffle.title || "",
    description: raffle.description || "",
    prize: raffle.prize || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.prize.trim()) {
      toast.error(copy.titleAndPrizeRequired);
      return;
    }

    if (!confirm(copy.confirmUpdateRaffle)) return;
    
    onUpdate(raffle.id, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      prize: formData.prize.trim(),
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{copy.editModalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-4">
            <strong>{copy.eventColon}</strong> {raffle.eventName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {copy.raffleTitleRequired}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={copy.raffleTitlePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {copy.prizeRequired}
            </label>
            <input
              type="text"
              value={formData.prize}
              onChange={(e) => setFormData({...formData, prize: e.target.value})}
              required
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={copy.prizePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {copy.descriptionOptionalLabel}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full border border-gray-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={copy.descriptionPlaceholder}
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-200 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              {copy.update}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}