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

export default function AdminRafflesPage() {
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
      toast.error("Çekilişler yüklenirken hata oluştu!");
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
      eventName: selectedEvent?.name || "Bilinmeyen Etkinlik",
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
      toast.success("Çekiliş başarıyla oluşturuldu!");
      
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
      toast.error("Çekiliş oluşturulurken hata oluştu!");
    }
  };

  const handleDrawWinner = async (raffleId) => {
    if (!confirm("Çekilişi sonlandırıp kazananı belirlemek istediğinizden emin misiniz?")) return;

    const result = await raffleUtils.drawWinner(raffleId);
    if (result.success) {
      toast.success(`Kazanan: ${result.winner.userEmail}`);
      
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
      toast.error(result.error || "Kazanan seçilirken hata oluştu!");
    }
  };

  const handleEndRaffle = async (raffleId) => {
    if (!confirm("Çekilişi kazanan seçmeden sonlandırmak istediğinizden emin misiniz?")) return;

    const result = await raffleUtils.endRaffle(raffleId);
    if (result.success) {
      toast.success("Çekiliş sonlandırıldı!");
      
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
      toast.error("Çekiliş sonlandırılırken hata oluştu!");
    }
  };

  const handleChangeWinner = async (raffleId, newWinnerId) => {
    const result = await raffleUtils.changeWinner(raffleId, newWinnerId);
    if (result.success) {
      toast.success(`Yeni kazanan: ${result.winner.userEmail}`);
      
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
      toast.error(result.error || "Kazanan değiştirilirken hata oluştu!");
    }
  };

  const handleAnnounceResult = async (raffleId) => {
    if (!confirm("Çekiliş sonucunu sosyal kısımda ilan etmek istediğinizden emin misiniz?")) return;

    const result = await raffleUtils.announceRaffleResult(raffleId);
    if (result.success) {
      toast.success("Çekiliş sonucu başarıyla ilan edildi!");
      
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
      toast.error(result.error || "Çekiliş sonucu ilan edilirken hata oluştu!");
    }
  };

  const handleEditRaffle = async (raffleId, updatedData) => {
    const result = await raffleUtils.updateRaffle(raffleId, updatedData);
    if (result.success) {
      toast.success("Çekiliş başarıyla güncellendi!");
      
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
      toast.error(result.error || "Çekiliş güncellenirken hata oluştu!");
    }
  };

  const handleDeleteRaffle = async (raffleId) => {
    if (!confirm("Bu çekilişi ve tüm ilgili verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!")) return;
    
    if (!confirm("Son kez soruyoruz: Çekiliş tamamen silinecek, emin misiniz?")) return;

    // Find the raffle to be deleted for stats calculation
    const raffleToDelete = raffles.find(r => r.id === raffleId);
    
    const result = await raffleUtils.deleteRaffle(raffleId);
    if (result.success) {
      toast.success("Çekiliş başarıyla silindi!");
      
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
      toast.error(result.error || "Çekiliş silinirken hata oluştu!");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <p className="py-12 text-ink-2">Loading...</p>;
  }

  if (!isAdmin) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        Access Denied
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Çekiliş Yönetimi"
        description="Etkinlik çekilişlerini oluşturun ve yönetin"
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={events.length === 0}
            title={events.length === 0 ? "Çekiliş için uygun etkinlik yok (3 gün içinde ve en az 1 post)" : ""}
          >
            <Plus aria-hidden="true" />
            <span>{events.length === 0 ? "Uygun Etkinlik Yok" : "Yeni Çekiliş"}</span>
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
          <Stat label="Toplam Çekiliş" value={stats.totalRaffles} />
          <Stat label="Aktif Çekiliş" value={stats.activeRaffles} />
          <Stat label="Tamamlanan" value={stats.completedRaffles} />
          <Stat label="Toplam Katılım" value={stats.totalParticipants} />
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
          title="Henüz çekiliş yok"
          description="İlk çekilişi oluşturun ve katılımcıları bekleyin!"
          action={<Button onClick={() => setShowCreateModal(true)}>Çekiliş Oluştur</Button>}
        />
      )}

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <CreateRaffleModal
          events={events}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRaffle}
        />
      )}

      {/* Participants Modal */}
      {selectedRaffle && (
        <ParticipantsModal
          raffle={selectedRaffle}
          participants={participants}
          onClose={() => setSelectedRaffle(null)}
          formatDate={formatDate}
        />
      )}

      {/* Change Winner Modal */}
      {showChangeWinnerModal && changeWinnerRaffle && (
        <ChangeWinnerModal
          raffle={changeWinnerRaffle}
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
function ModalFrame({ onClose, wide = false, title, children }) {
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
            aria-label="Kapat"
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
function RaffleCard({ raffle, onDrawWinner, onEndRaffle, onViewParticipants, onChangeWinner, onEditRaffle, onAnnounceResult, onDeleteRaffle, formatDate }) {
  const getStatusVariant = () => {
    if (raffle.isCompleted) return "success";
    if (raffle.isActive) return "accent";
    return "neutral";
  };

  const getStatusText = () => {
    if (raffle.isCompleted) return "Tamamlandı";
    if (raffle.isActive) return "Aktif";
    return "Pasif";
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
          <span className="tabular-nums">{raffle.participants?.length || 0}</span>&nbsp;katılımcı
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
            <span className="min-w-0 break-all">Kazanan: {raffle.winner}</span>
          </p>
          {raffle.isAnnounced && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
              Sonuç ilan edildi
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onViewParticipants}>
          Katılımcıları Gör
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onEditRaffle}
          title="Çekiliş Detaylarını Düzenle"
          aria-label="Çekiliş Detaylarını Düzenle"
        >
          <Edit3 aria-hidden="true" />
        </Button>

        {raffle.isActive && !raffle.isCompleted && (
          <>
            <Button onClick={onDrawWinner}>Kazanan Seç</Button>
            <Button variant="outline" onClick={onEndRaffle}>
              Sonlandır
            </Button>
          </>
        )}

        {raffle.isCompleted && raffle.winner && (
          <>
            <Button variant="outline" onClick={onChangeWinner}>
              Kazananı Değiştir
            </Button>
            {!raffle.isAnnounced && (
              <Button onClick={onAnnounceResult}>Sonucu İlan Et</Button>
            )}
          </>
        )}

        {/* Delete button - always available for admins */}
        <Button variant="destructive" onClick={onDeleteRaffle} className="sm:ml-auto">
          <Trash2 aria-hidden="true" />
          Çekilişi Sil
        </Button>
      </div>
    </li>
  );
}

// Create Raffle Modal
function CreateRaffleModal({ events, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    eventId: "",
    title: "",
    description: "",
    prize: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.eventId || !formData.title || !formData.prize) {
      toast.error("Lütfen gerekli alanları doldurun!");
      return;
    }
    onCreate(formData);
  };

  return (
    <ModalFrame onClose={onClose} title="Yeni Çekiliş Oluştur">
      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="raffle-create-event" label="Etkinlik">
          <select
            value={formData.eventId}
            onChange={(e) => setFormData({...formData, eventId: e.target.value})}
            required
            className={cn(fieldClasses, "h-control")}
          >
            <option value="">
              {events.length > 0 ? "Etkinlik seçin" : "Çekiliş için uygun etkinlik yok"}
            </option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.postCount} post)
              </option>
            ))}
          </select>
        </Field>

        <Field id="raffle-create-title" label="Çekiliş Başlığı">
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </Field>

        <Field id="raffle-create-prize" label="Ödül">
          <Input
            type="text"
            value={formData.prize}
            onChange={(e) => setFormData({...formData, prize: e.target.value})}
            required
          />
        </Field>

        <Field id="raffle-create-description" label="Açıklama (İsteğe Bağlı)">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={events.length === 0}>
            {events.length === 0 ? "Uygun Etkinlik Yok" : "Oluştur"}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

// Participants Modal
function ParticipantsModal({ raffle, participants, onClose, formatDate }) {
  return (
    <ModalFrame
      onClose={onClose}
      wide
      title={`${raffle.title} - Katılımcılar (${participants.length})`}
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
        <p className="py-8 text-muted-foreground">Henüz katılımcı yok</p>
      )}
    </ModalFrame>
  );
}

// Change Winner Modal
function ChangeWinnerModal({ raffle, participants, onClose, onChangeWinner }) {
  const [selectedWinnerId, setSelectedWinnerId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedWinnerId) {
      toast.error("Lütfen bir kazanan seçin!");
      return;
    }

    if (!confirm("Seçilen kişiyi yeni kazanan yapmak istediğinizden emin misiniz?")) return;

    onChangeWinner(raffle.id, selectedWinnerId);
  };

  return (
    <ModalFrame onClose={onClose} title="Kazananı Değiştir">
      <div className="mb-4 space-y-1 text-sm text-ink-2">
        <p>
          <strong className="text-ink">Çekiliş:</strong> {raffle.title}
        </p>
        <p>
          <strong className="text-ink">Mevcut Kazanan:</strong> {raffle.winner || "Henüz seçilmedi"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="raffle-change-winner" label="Yeni Kazanan Seçin">
          <select
            value={selectedWinnerId}
            onChange={(e) => setSelectedWinnerId(e.target.value)}
            required
            className={cn(fieldClasses, "h-control")}
          >
            <option value="">Katılımcı seçin...</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.userId}>
                {participant.userEmail} ({participant.userName || "İsim yok"})
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">Kazananı Değiştir</Button>
        </div>
      </form>
    </ModalFrame>
  );
}

// Edit Raffle Modal
function EditRaffleModal({ raffle, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: raffle.title || "",
    description: raffle.description || "",
    prize: raffle.prize || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.prize.trim()) {
      toast.error("Başlık ve ödül alanları zorunludur!");
      return;
    }

    if (!confirm("Çekiliş detaylarını güncellemek istediğinizden emin misiniz?")) return;

    onUpdate(raffle.id, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      prize: formData.prize.trim(),
    });
  };

  return (
    <ModalFrame onClose={onClose} title="Çekiliş Düzenle">
      <p className="mb-4 text-sm text-ink-2">
        <strong className="text-ink">Etkinlik:</strong> {raffle.eventName}
      </p>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <Field id="raffle-edit-title" label="Çekiliş Başlığı *">
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            placeholder="Çekiliş başlığını girin"
          />
        </Field>

        <Field id="raffle-edit-prize" label="Ödül *">
          <Input
            type="text"
            value={formData.prize}
            onChange={(e) => setFormData({...formData, prize: e.target.value})}
            required
            placeholder="Ödülü girin"
          />
        </Field>

        <Field id="raffle-edit-description" label="Açıklama (İsteğe Bağlı)">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            placeholder="Çekiliş açıklamasını girin"
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
