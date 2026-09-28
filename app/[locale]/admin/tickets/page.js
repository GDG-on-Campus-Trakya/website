"use client";
import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "@/i18n/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import { useLocale } from "next-intl";
import { formatLocalizedDate } from "@/utils/localeUtils";
import { Paperclip, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";

export default function AdminTicketsPage() {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          errors: {
            fetchTickets: "An error occurred while loading tickets",
            responseFailed: "An error occurred while sending the reply",
            statusFailed: "An error occurred while updating the status",
            deleteConfirm:
              "Are you sure you want to permanently delete this ticket? This action cannot be undone.",
            deleteFailed: "An error occurred while deleting the ticket",
            assignFailed: "An error occurred while updating the admin assignment",
          },
          success: {
            responseSent: "Reply sent successfully!",
            statusChanged: (action) =>
              `Ticket ${action === "close" ? "closed" : "reopened"} successfully!`,
            deleted: "Ticket deleted successfully!",
            assignAdmin: "Admin assigned successfully!",
            unassignAdmin: "Admin assignment removed!",
          },
          statuses: {
            open: "Open",
            closed: "Closed",
            in_progress: "Reviewing",
            unknown: "Unknown",
          },
          categories: {
            complaint: "Complaint",
            suggestion: "Suggestion",
            technical: "Technical Support",
            other: "Other",
            unknown: "Unknown",
          },
          loading: "Loading...",
          accessDenied: "Access denied",
          title: "Ticket Management",
          subtitle: "Manage user support requests",
          stats: {
            total: "Total Tickets",
            open: "Open Tickets",
            closed: "Closed Tickets",
            complaints: "Support Requests",
          },
          filters: {
            status: "Status Filter",
            category: "Category Filter",
            allStatuses: "All Statuses",
            allCategories: "All Categories",
          },
          emptyFiltered: "No tickets match your filters.",
          user: "User",
          createdAt: "Created",
          closedAt: "Closed",
          reopenedAt: "Reopened",
          reopenReason: "Reason",
          assignedAdmin: "Assigned Admin",
          reply: "Reply",
          close: "Close",
          reopen: "Reopen",
          delete: "Delete",
          deleteTitle: "Permanently delete ticket",
          adminLabel: "Admin",
          unassigned: "Unassigned",
          ticketPrefix: "Ticket",
          status: "Status",
          category: "Category",
          assigned: "Assigned",
          requester: "User",
          system: "System",
          attachments: "Attached Files",
          noAttachments: "No attached files",
          replyPlaceholder: "Write a reply...",
          sending: "Sending...",
          send: "Send",
          infoTitle: "Ticket Details",
          actionsTitle: "Admin Actions",
          assignmentTitle: "Admin Assignment",
        }
      : {
          errors: {
            fetchTickets: "Biletler yüklenirken bir hata oluştu",
            responseFailed: "Yanıt gönderilirken bir hata oluştu",
            statusFailed: "Durum güncellenirken bir hata oluştu",
            deleteConfirm:
              "Bu bileti kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
            deleteFailed: "Bilet silinirken bir hata oluştu",
            assignFailed: "Admin ataması güncellenirken bir hata oluştu",
          },
          success: {
            responseSent: "Yanıt başarıyla gönderildi!",
            statusChanged: (action) =>
              `Bilet başarıyla ${action === "close" ? "kapatıldı" : "açıldı"}!`,
            deleted: "Bilet başarıyla silindi!",
            assignAdmin: "Admin başarıyla atandı!",
            unassignAdmin: "Admin ataması kaldırıldı!",
          },
          statuses: {
            open: "Açık",
            closed: "Kapalı",
            in_progress: "İnceleniyor",
            unknown: "Bilinmiyor",
          },
          categories: {
            complaint: "Şikayet",
            suggestion: "Öneri",
            technical: "Teknik Destek",
            other: "Diğer",
            unknown: "Bilinmiyor",
          },
          loading: "Yükleniyor...",
          accessDenied: "Erişim engellendi",
          title: "Bilet Yönetimi",
          subtitle: "Kullanıcı destek taleplerini yönetin",
          stats: {
            total: "Toplam Bilet",
            open: "Açık Biletler",
            closed: "Kapalı Biletler",
            complaints: "Destek Talepleri",
          },
          filters: {
            status: "Durum Filtresi",
            category: "Kategori Filtresi",
            allStatuses: "Tüm Durumlar",
            allCategories: "Tüm Kategoriler",
          },
          emptyFiltered: "Filtrelerinize uygun bilet bulunamadı.",
          user: "Kullanıcı",
          createdAt: "Oluşturulma",
          closedAt: "Kapatılma",
          reopenedAt: "Yeniden Açıldı",
          reopenReason: "Gerekçe",
          assignedAdmin: "Atanan Admin",
          reply: "Yanıtla",
          close: "Kapat",
          reopen: "Tekrar Aç",
          delete: "Sil",
          deleteTitle: "Bileti kalıcı olarak sil",
          adminLabel: "Admin",
          unassigned: "Atanmamış",
          ticketPrefix: "Bilet",
          status: "Durum",
          category: "Kategori",
          assigned: "Atanan",
          requester: "Kullanıcı",
          system: "Sistem",
          attachments: "Ekli Dosyalar",
          noAttachments: "Ekli dosya yok",
          replyPlaceholder: "Yanıt yazın...",
          sending: "Gönderiliyor...",
          send: "Gönder",
          infoTitle: "Bilet Bilgileri",
          actionsTitle: "Admin İşlemleri",
          assignmentTitle: "Admin Atama",
        };
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const sanitizeInput = (input) => {
    if (typeof input !== "string") return input;
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const router = useRouter();
  const conversationRef = useRef(null);
  const formatDateTime = (date) =>
    formatLocalizedDate(date?.toDate ? date.toDate() : date, locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatMessageDateTime = (date) =>
    formatLocalizedDate(date?.toDate ? date.toDate() : date, locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setIsAdmin(true);
          fetchAvailableAdmins();
          // fetchTickets will be replaced with real-time listener below
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

  // Real-time listener for all tickets
  useEffect(() => {
    if (!isAdmin) return;
    
    let unsubscribe;
    (async () => {
      try {
        const { collection, onSnapshot, query, orderBy } = await import("firebase/firestore");
        const { db } = await import("@/firebase");
        
        const ticketsCollection = collection(db, "tickets");
        const q = query(ticketsCollection);
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const ticketsData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
              closedAt: data.closedAt || null,
            };
          });
          
          // Sort by createdAt in descending order (newest first)
          ticketsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setTickets(ticketsData);
          setIsLoading(false);
        });
      } catch (err) {
        logger.error("Error subscribing to tickets:", err);
        setIsLoading(false);
      }
    })();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin]);

  // Live subscribe to selected ticket updates while modal is open
  useEffect(() => {
    if (!selectedTicket?.id) return;
    let unsubscribe;
    (async () => {
      try {
        const { doc, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("@/firebase");
        const ticketRef = doc(db, "tickets", selectedTicket.id);
        unsubscribe = onSnapshot(ticketRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          setSelectedTicket((prev) => ({
            id: snap.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              prev?.createdAt ||
              null,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
            closedAt: data.closedAt || null,
          }));
        });
      } catch (err) {
        logger.error("Error subscribing to ticket:", err);
      }
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedTicket?.id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedTicket) {
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
  }, [selectedTicket]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedTicket && conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [selectedTicket?.responses]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const { collection, getDocs, query, orderBy } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const ticketsCollection = collection(db, "tickets");

      const snapshot = await getDocs(ticketsCollection);
      const ticketsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
          closedAt: data.closedAt || null, // Keep Firestore timestamp for proper display
        };
      });

      // Sort by createdAt in descending order (newest first)
      ticketsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTickets(ticketsData);
    } catch (error) {
      logger.error("Error fetching tickets:", error);
      toast.error(copy.errors.fetchTickets);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableAdmins = async () => {
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/firebase");

      const adminsSnapshot = await getDocs(collection(db, "admins"));
      const adminsList = adminsSnapshot.docs.map((doc) => ({
        email: doc.id,
        ...doc.data(),
      }));
      setAvailableAdmins(adminsList);
    } catch (error) {
      logger.error("Error fetching admins:", error);
    }
  };

  const handleResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const newResponse = {
        message: sanitizeInput(responseMessage),
        adminEmail: user.email,
        createdAt: new Date().toISOString(),
      };

      const ticketRef = doc(db, "tickets", selectedTicket.id);
      await updateDoc(ticketRef, {
        responses: [...(selectedTicket.responses || []), newResponse],
        updatedAt: serverTimestamp(),
      });

      toast.success(copy.success.responseSent);
      setResponseMessage("");
      // Ticket live güncellenecek, fetchTickets kaldırıldı
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        if (conversationRef.current) {
          conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      logger.error("Error sending response:", error);
      toast.error(copy.errors.responseFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId, action) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const updateData = {
        status: action === "close" ? "closed" : "open",
        updatedAt: serverTimestamp(),
      };

      // Add closure date when closing
      if (action === "close") {
        updateData.closedAt = serverTimestamp();
        updateData.closedBy = user.email;
      }

      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, updateData);

      toast.success(copy.success.statusChanged(action));
      // fetchTickets kaldırıldı - live güncellenecek
      // Modal açık kalacak, ticket otomatik güncellenecek
    } catch (error) {
      logger.error("Error updating status:", error);
      toast.error(copy.errors.statusFailed);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm(copy.errors.deleteConfirm)) {
      return;
    }

    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("@/firebase");

      const ticketRef = doc(db, "tickets", ticketId);
      await deleteDoc(ticketRef);

      toast.success(copy.success.deleted);
      // fetchTickets kaldırıldı - ticket silinecek, modal otomatik kapanacak
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      logger.error("Error deleting ticket:", error);
      toast.error(copy.errors.deleteFailed);
    }
  };

  const handleAssignAdmin = async (ticketId, adminEmail) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        assignedTo: adminEmail || null,
        assignedAt: adminEmail ? serverTimestamp() : null,
        assignedBy: adminEmail ? user.email : null,
        updatedAt: serverTimestamp(),
      });

      toast.success(
        adminEmail ? copy.success.assignAdmin : copy.success.unassignAdmin
      );
      // fetchTickets kaldırıldı - assignment live güncellenecek
    } catch (error) {
      logger.error("Error assigning admin:", error);
      toast.error(copy.errors.assignFailed);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "open":
        return "warning";
      case "closed":
        return "success";
      case "in_progress":
        return "accent";
      default:
        return "neutral";
    }
  };

  const getStatusText = (status) => {
    return copy.statuses[status] || copy.statuses.unknown;
  };

  const getCategoryText = (category) => {
    return copy.categories[category] || copy.categories.unknown;
  };

  const filteredTickets = tickets.filter((ticket) => {
    const statusMatch =
      filterStatus === "all" || ticket.status === filterStatus;
    const categoryMatch =
      filterCategory === "all" || ticket.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  if (loading || isLoading) {
    return <p className="py-12 text-ink-2">{copy.loading}</p>;
  }

  if (!isAdmin) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        {copy.accessDenied}
      </p>
    );
  }

  const rowAction = "h-11 md:h-9";
  const selectClass = cn(fieldClasses, "h-control");

  return (
    <div>
      <PageHeader title={copy.title} description={copy.subtitle} />

      {/* Stats */}
      <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 border-b border-rule pb-8 sm:grid-cols-4 md:max-w-3xl">
        <Stat label={copy.stats.total} value={tickets.length} />
        <Stat
          label={copy.stats.open}
          value={tickets.filter((t) => t.status === "open").length}
        />
        <Stat
          label={copy.stats.closed}
          value={tickets.filter((t) => t.status === "closed").length}
        />
        <Stat
          label={copy.stats.complaints}
          value={tickets.filter((t) => t.category === "complaint").length}
        />
      </dl>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="ticket-filter-status">{copy.filters.status}</Label>
          <select
            id="ticket-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="all">{copy.filters.allStatuses}</option>
            <option value="open">{copy.statuses.open}</option>
            <option value="closed">{copy.statuses.closed}</option>
            <option value="in_progress">{copy.statuses.in_progress}</option>
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="ticket-filter-category">{copy.filters.category}</Label>
          <select
            id="ticket-filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={selectClass}
          >
            <option value="all">{copy.filters.allCategories}</option>
            <option value="complaint">{copy.categories.complaint}</option>
            <option value="suggestion">{copy.categories.suggestion}</option>
            <option value="technical">{copy.categories.technical}</option>
            <option value="other">{copy.categories.other}</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <EmptyState title={copy.emptyFiltered} />
      ) : (
        <ul className="border-t-2 border-ink">
          {filteredTickets.map((ticket) => (
            <li
              key={ticket.id}
              className="grid cursor-pointer gap-4 border-b border-rule py-5 transition-colors duration-micro hover:bg-secondary lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-8"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h3 className="min-w-0 break-words text-lg font-semibold">
                    {ticket.subject}
                  </h3>
                  <Badge variant={getStatusVariant(ticket.status)}>
                    {getStatusText(ticket.status)}
                  </Badge>
                  <Badge>{getCategoryText(ticket.category)}</Badge>
                  {ticket.ticketNumber && (
                    <Badge className="font-outlier tabular-nums">
                      #{ticket.ticketNumber}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong className="font-semibold text-ink-2">{copy.user}:</strong> {ticket.userName}
                  </p>
                  <p>
                    <strong className="font-semibold text-ink-2">{copy.createdAt}:</strong> {formatDateTime(ticket.createdAt)}
                  </p>
                  {ticket.status === "closed" && ticket.closedAt && (
                    <p className="text-success">
                      <strong className="font-semibold">{copy.closedAt}:</strong> {formatDateTime(ticket.closedAt)}{" "}
                      {ticket.closedBy && `(${ticket.closedBy})`}
                    </p>
                  )}
                  {ticket.assignedTo && (
                    <p>
                      <strong className="font-semibold text-ink-2">{copy.assignedAdmin}:</strong> {ticket.assignedTo}
                    </p>
                  )}
                </div>
                {ticket.reopenedAt && (
                  <div className="mt-3 rounded-sm bg-warning px-3 py-2 text-sm text-ink">
                    <p className="flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        <strong>{copy.reopenedAt}:</strong> {formatDateTime(ticket.reopenedAt)}
                      </span>
                    </p>
                    {ticket.reopenReason && (
                      <p>
                        <strong>{copy.reopenReason}:</strong> {ticket.reopenReason}
                      </p>
                    )}
                  </div>
                )}

                <p className="mt-3 max-w-measure text-sm text-ink-2">{ticket.message}</p>

                {/* Conversation moved into modal */}
              </div>

              <div className="flex flex-col gap-3">
                {/* Action Buttons */}
                <div
                  className="flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    className={rowAction}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    {copy.reply}
                  </Button>
                  {ticket.status === "open" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className={rowAction}
                      onClick={() => handleStatusChange(ticket.id, "close")}
                    >
                      {copy.close}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className={rowAction}
                      onClick={() => handleStatusChange(ticket.id, "reopen")}
                    >
                      {copy.reopen}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className={rowAction}
                    onClick={() => handleDeleteTicket(ticket.id)}
                    title={copy.deleteTitle}
                  >
                    {copy.delete}
                  </Button>
                </div>

                {/* Admin Assignment */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {copy.adminLabel}:
                  </span>
                  <select
                    value={ticket.assignedTo || ""}
                    onChange={(e) => handleAssignAdmin(ticket.id, e.target.value)}
                    className={cn(fieldClasses, "h-11 min-w-0 flex-1 text-sm md:h-9")}
                  >
                    <option value="">{copy.unassigned}</option>
                    {availableAdmins.map((admin) => (
                      <option key={admin.email} value={admin.email}>
                        {admin.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Chat Modal */}
      {selectedTicket && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4 animate-in fade-in-0 duration-short"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            className="flex h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-rule bg-background text-foreground"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-rule px-6 py-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold">
                    {copy.ticketPrefix} <span className="font-outlier">#{selectedTicket.ticketNumber || selectedTicket.id}</span>
                  </h2>
                  <p className="break-words text-sm text-muted-foreground">
                    {selectedTicket.subject} - {selectedTicket.userName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 shrink-0"
                  onClick={() => setSelectedTicket(null)}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>

              {/* Mobile-only info */}
              <div className="grid grid-cols-2 gap-3 text-sm lg:hidden">
                <div>
                  <span className="text-muted-foreground">{copy.status}:</span>{" "}
                  <span>{getStatusText(selectedTicket.status)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{copy.category}:</span>{" "}
                  <span>{getCategoryText(selectedTicket.category)}</span>
                </div>
                {selectedTicket.assignedTo && (
                  <div className="col-span-2 break-words">
                    <span className="text-muted-foreground">{copy.assigned}:</span>{" "}
                    <span>{selectedTicket.assignedTo}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Body */}
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_20rem]">
              {/* Conversation */}
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div
                  ref={conversationRef}
                  className="flex-1 space-y-3 overflow-y-auto p-6"
                  style={{
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {/* Original ticket message */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-3 text-xs font-bold text-ink-2">
                      K
                    </div>
                    <div className="min-w-0 max-w-xl rounded-lg border border-rule bg-paper-2 px-4 py-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold text-ink-2">
                          {copy.requester}
                        </span>
                        <span className="font-outlier text-xs text-muted-foreground">
                          {formatMessageDateTime(selectedTicket.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {selectedTicket.message}
                      </p>
                      {/* Attachments */}
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                        <div className="mt-3 border-t border-rule pt-3">
                          <p className="mb-2 text-xs text-muted-foreground">{copy.attachments}:</p>
                          <div className="space-y-2">
                            {selectedTicket.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 break-all text-xs text-brand underline underline-offset-4 decoration-1 hover:decoration-2"
                              >
                                <Paperclip className="h-3 w-3 shrink-0" aria-hidden="true" />
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        selectedTicket.attachments ? (
                          <div className="mt-3 border-t border-rule pt-3">
                            <p className="text-xs text-muted-foreground">{copy.noAttachments}</p>
                          </div>
                        ) : (
                          <div className="mt-3 border-t border-rule pt-3">
                            <p className="text-xs text-muted-foreground">{copy.noAttachments}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  {/* Replies */}
                  {selectedTicket.responses?.map((response, idx) => {
                    const isSystem = response.isSystemMessage;
                    const isUser = response.isUserResponse === true;
                    const isAdmin = !isSystem && !isUser;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 ${
                          isAdmin ? "justify-end" : ""
                        }`}
                      >
                        {!isAdmin && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-3 text-xs font-bold text-ink-2">
                            {isSystem ? "S" : "K"}
                          </div>
                        )}
                        <div
                          className={`min-w-0 max-w-xl ${
                            isAdmin
                              ? "border-ink bg-background"
                              : "border-rule bg-paper-2"
                          } rounded-lg border px-4 py-3`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                isSystem
                                  ? "text-muted-foreground"
                                  : isUser
                                  ? "text-ink-2"
                                  : "text-brand"
                              }`}
                            >
                              {isSystem
                                ? copy.system
                                : isUser
                                ? copy.requester
                                : copy.adminLabel}
                            </span>
                            <span className="font-outlier text-xs text-muted-foreground">
                              {formatMessageDateTime(response.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm">
                            {response.message}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-ink">
                            A
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Admin Actions */}
                <div className="space-y-3 border-t border-rule bg-paper-2 p-4 lg:hidden">
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.status === "open" ? (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          handleStatusChange(selectedTicket.id, "close")
                        }
                      >
                        {copy.close}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          handleStatusChange(selectedTicket.id, "reopen")
                        }
                      >
                        {copy.reopen}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                    >
                      {copy.delete}
                    </Button>
                  </div>
                  <select
                    value={selectedTicket.assignedTo || ""}
                    onChange={(e) =>
                      handleAssignAdmin(selectedTicket.id, e.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="">{copy.unassigned}</option>
                    {availableAdmins.map((admin) => (
                      <option key={admin.email} value={admin.email}>
                        {admin.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleResponse}
                  className="flex-shrink-0 border-t border-rule p-4"
                >
                  <div className="flex gap-3">
                    <Textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      rows={2}
                      className="min-w-0 flex-1 resize-none"
                      placeholder={copy.replyPlaceholder}
                      aria-label={copy.reply}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !responseMessage.trim()}
                      className="self-end"
                    >
                      {isSubmitting ? copy.sending : copy.send}
                    </Button>
                  </div>
                </form>
              </div>
              {/* Sidebar */}
              <div className="hidden overflow-y-auto border-l border-rule lg:flex lg:flex-col" style={{ overscrollBehavior: 'contain' }}>
                <div className="space-y-6 p-6">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      {copy.infoTitle}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">{copy.status}:</span>{" "}
                        {getStatusText(selectedTicket.status)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{copy.category}:</span>{" "}
                        {getCategoryText(selectedTicket.category)}
                      </p>
                      {selectedTicket.assignedTo && (
                        <p className="break-words">
                          <span className="text-muted-foreground">{copy.assigned}:</span>{" "}
                          {selectedTicket.assignedTo}
                        </p>
                      )}
                      <p>
                        <span className="text-muted-foreground">{copy.createdAt}:</span>{" "}
                        {formatDateTime(selectedTicket.createdAt)}
                      </p>
                      {selectedTicket.closedAt && (
                        <p className="text-success">
                          <span className="text-muted-foreground">{copy.closedAt}:</span>{" "}
                          {formatDateTime(selectedTicket.closedAt)}
                        </p>
                      )}
                      {selectedTicket.reopenedAt && (
                        <p>
                          <span className="text-muted-foreground">{copy.reopenedAt}:</span>{" "}
                          {formatDateTime(selectedTicket.reopenedAt)}
                        </p>
                      )}
                      {selectedTicket.reopenReason && (
                        <p>
                          <span className="text-muted-foreground">{copy.reopenReason}:</span>{" "}
                          {selectedTicket.reopenReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      {copy.actionsTitle}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.status === "open" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusChange(selectedTicket.id, "close")
                          }
                        >
                          {copy.close}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusChange(selectedTicket.id, "reopen")
                          }
                        >
                          {copy.reopen}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                      >
                        {copy.delete}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      {copy.assignmentTitle}
                    </h3>
                    <select
                      value={selectedTicket.assignedTo || ""}
                      onChange={(e) =>
                        handleAssignAdmin(selectedTicket.id, e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="">{copy.unassigned}</option>
                      {availableAdmins.map((admin) => (
                        <option key={admin.email} value={admin.email}>
                          {admin.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
