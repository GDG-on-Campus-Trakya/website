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

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-yellow-900/50 text-yellow-300 border border-yellow-700";
      case "closed":
        return "bg-green-900/50 text-green-300 border border-green-700";
      case "in_progress":
        return "bg-blue-900/50 text-blue-300 border border-blue-700";
      default:
        return "bg-gray-700/50 text-gray-300 border border-gray-600";
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <div className="text-white text-lg">{copy.loading}</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <p className="text-lg text-red-400">{copy.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x mb-2">
            {copy.title}
          </h1>
        </div>
        <p className="text-gray-300 mt-4 text-lg">
          {copy.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">{copy.stats.total}</p>
            <p className="text-3xl font-bold text-blue-400">{tickets.length}</p>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">{copy.stats.open}</p>
            <p className="text-3xl font-bold text-yellow-400">
              {tickets.filter((t) => t.status === "open").length}
            </p>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">{copy.stats.closed}</p>
            <p className="text-3xl font-bold text-green-400">
              {tickets.filter((t) => t.status === "closed").length}
            </p>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">{copy.stats.complaints}</p>
            <p className="text-3xl font-bold text-red-400">
              {tickets.filter((t) => t.category === "complaint").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {copy.filters.status}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="all">{copy.filters.allStatuses}</option>
              <option value="open">{copy.statuses.open}</option>
              <option value="closed">{copy.statuses.closed}</option>
              <option value="in_progress">{copy.statuses.in_progress}</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {copy.filters.category}
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="all">{copy.filters.allCategories}</option>
              <option value="complaint">{copy.categories.complaint}</option>
              <option value="suggestion">{copy.categories.suggestion}</option>
              <option value="technical">{copy.categories.technical}</option>
              <option value="other">{copy.categories.other}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8 text-center">
            <p className="text-gray-300 text-lg">
              {copy.emptyFiltered}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 hover:border-gray-600/60 transition-colors cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {ticket.subject}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {getStatusText(ticket.status)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                      {getCategoryText(ticket.category)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    <strong>{copy.user}:</strong> {ticket.userName}
                  </p>
                  <p className="text-sm text-gray-400 mb-1">
                    <strong>{copy.createdAt}:</strong> {formatDateTime(ticket.createdAt)}
                  </p>
                  {ticket.status === "closed" && ticket.closedAt && (
                    <p className="text-sm text-green-400 mb-1">
                      <strong>{copy.closedAt}:</strong> {formatDateTime(ticket.closedAt)}{" "}
                      {ticket.closedBy && `(${ticket.closedBy})`}
                    </p>
                  )}
                  {ticket.reopenedAt && (
                    <div className="mt-2 p-2 bg-orange-900/30 rounded-lg border border-orange-700/50">
                      <p className="text-sm text-orange-300 mb-1">
                        <strong>↻ {copy.reopenedAt}:</strong> {formatDateTime(ticket.reopenedAt)}
                      </p>
                      {ticket.reopenReason && (
                        <p className="text-sm text-orange-200">
                          <strong>{copy.reopenReason}:</strong> {ticket.reopenReason}
                        </p>
                      )}
                    </div>
                  )}
                  {ticket.assignedTo && (
                    <p className="text-sm text-purple-400 mb-1">
                      <strong>{copy.assignedAdmin}:</strong> {ticket.assignedTo}
                    </p>
                  )}
                  {ticket.ticketNumber && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-mono rounded">
                        #{ticket.ticketNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-300 mb-4 text-sm">{ticket.message}</p>

              {/* Conversation moved into modal */}

              {/* Action Buttons */}
              <div
                className="flex flex-wrap gap-2 mb-4"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  {copy.reply}
                </button>
                {ticket.status === "open" ? (
                  <button
                    onClick={() => handleStatusChange(ticket.id, "close")}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    {copy.close}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(ticket.id, "reopen")}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                  >
                    {copy.reopen}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTicket(ticket.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  title={copy.deleteTitle}
                >
                  {copy.delete}
                </button>
              </div>

              {/* Admin Assignment */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-medium">
                  {copy.adminLabel}:
                </span>
                <select
                  value={ticket.assignedTo || ""}
                  onChange={(e) => handleAssignAdmin(ticket.id, e.target.value)}
                  className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
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
          ))
        )}
      </div>

      {/* Chat Modal */}
      {selectedTicket && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {copy.ticketPrefix} #{selectedTicket.ticketNumber || selectedTicket.id}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedTicket.subject} - {selectedTicket.userName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-200 flex-shrink-0"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              {/* Mobile-only info */}
              <div className="lg:hidden grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">{copy.status}:</span>{" "}
                  <span className="text-gray-200">{getStatusText(selectedTicket.status)}</span>
                </div>
                <div>
                  <span className="text-gray-400">{copy.category}:</span>{" "}
                  <span className="text-gray-200">{getCategoryText(selectedTicket.category)}</span>
                </div>
                {selectedTicket.assignedTo && (
                  <div className="col-span-2">
                    <span className="text-gray-400">{copy.assigned}:</span>{" "}
                    <span className="text-gray-200">{selectedTicket.assignedTo}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-0 overflow-hidden min-h-0">
              {/* Conversation */}
              <div className="flex flex-col h-full overflow-hidden">
                <div 
                  ref={conversationRef}
                  className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-900"
                  style={{ 
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {/* Original ticket message */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center text-white text-xs font-bold">
                      K
                    </div>
                    <div className="max-w-xl bg-gray-800/70 border border-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-green-300">
                          {copy.requester}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatMessageDateTime(selectedTicket.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                      {/* Attachments */}
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <p className="text-xs text-gray-400 mb-2">{copy.attachments}:</p>
                          <div className="space-y-2">
                            {selectedTicket.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 bg-gray-700/50 px-2 py-1 rounded"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        selectedTicket.attachments ? (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <p className="text-xs text-gray-400">{copy.noAttachments}</p>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <p className="text-xs text-gray-400">{copy.noAttachments}</p>
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
                          <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center text-white text-xs font-bold">
                            {isSystem ? "S" : "K"}
                          </div>
                        )}
                        <div
                          className={`max-w-xl ${
                            isAdmin
                              ? "bg-blue-900/40 border-blue-700"
                              : isSystem
                              ? "bg-gray-800/70 border-gray-600"
                              : "bg-gray-800/70 border-gray-700"
                          } border rounded-2xl px-4 py-3`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-semibold ${
                                isSystem
                                  ? "text-gray-300"
                                  : isUser
                                  ? "text-green-300"
                                  : "text-blue-300"
                              }`}
                            >
                              {isSystem
                                ? copy.system
                                : isUser
                                ? copy.requester
                                : copy.adminLabel}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatMessageDateTime(response.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap">
                            {response.message}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                            A
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Mobile Admin Actions */}
                <div className="lg:hidden p-4 border-t border-gray-700 bg-gray-800 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {selectedTicket.status === "open" ? (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedTicket.id, "close")
                        }
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                      >
                        {copy.close}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedTicket.id, "reopen")
                        }
                        className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium"
                      >
                        {copy.reopen}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                    >
                      {copy.delete}
                    </button>
                  </div>
                  <select
                    value={selectedTicket.assignedTo || ""}
                    onChange={(e) =>
                      handleAssignAdmin(selectedTicket.id, e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
                  className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0"
                >
                  <div className="flex gap-3">
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      rows={2}
                      className="flex-1 px-4 py-3 bg-gray-800/70 border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                      placeholder={copy.replyPlaceholder}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !responseMessage.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? copy.sending : copy.send}
                    </button>
                  </div>
                </form>
              </div>
              {/* Sidebar */}
              <div className="hidden lg:flex lg:flex-col border-l border-gray-800 bg-gray-900 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200 mb-2">
                      {copy.infoTitle}
                    </h3>
                    <div className="text-sm text-gray-300 space-y-1">
                    <p>
                      <span className="text-gray-400">{copy.status}:</span>{" "}
                      {getStatusText(selectedTicket.status)}
                    </p>
                    <p>
                      <span className="text-gray-400">{copy.category}:</span>{" "}
                      {getCategoryText(selectedTicket.category)}
                    </p>
                    {selectedTicket.assignedTo && (
                      <p>
                        <span className="text-gray-400">{copy.assigned}:</span>{" "}
                        {selectedTicket.assignedTo}
                      </p>
                    )}
                    <p>
                      <span className="text-gray-400">{copy.createdAt}:</span>{" "}
                      {formatDateTime(selectedTicket.createdAt)}
                    </p>
                    {selectedTicket.closedAt && (
                      <p className="text-green-400">
                        <span className="text-gray-400">{copy.closedAt}:</span>{" "}
                        {formatDateTime(selectedTicket.closedAt)}
                      </p>
                    )}
                    {selectedTicket.reopenedAt && (
                      <p className="text-orange-300">
                        <span className="text-gray-400">{copy.reopenedAt}:</span>{" "}
                        {formatDateTime(selectedTicket.reopenedAt)}
                      </p>
                    )}
                    {selectedTicket.reopenReason && (
                      <p className="text-orange-200">
                        <span className="text-gray-400">{copy.reopenReason}:</span>{" "}
                        {selectedTicket.reopenReason}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-2">
                    {copy.actionsTitle}
                  </h3>
                  <div className="flex gap-2">
                    {selectedTicket.status === "open" ? (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedTicket.id, "close")
                        }
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                      >
                        {copy.close}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedTicket.id, "reopen")
                        }
                        className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium"
                      >
                        {copy.reopen}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                    >
                      {copy.delete}
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-2">
                    {copy.assignmentTitle}
                  </h3>
                  <select
                    value={selectedTicket.assignedTo || ""}
                    onChange={(e) =>
                      handleAssignAdmin(selectedTicket.id, e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
        theme="dark"
      />
    </div>
  );
}
