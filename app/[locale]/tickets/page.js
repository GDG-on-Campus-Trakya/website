"use client";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import { useLocale } from "next-intl";
import { formatLocalizedDate } from "@/utils/localeUtils";

export default function TicketsPage() {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          errors: {
            fetchTickets: "An error occurred while loading your tickets",
            reopenLimit:
              "You have reached your daily ticket reopen limit (5 reopens). Please try again tomorrow.",
            reopenFailed: "An error occurred while reopening the ticket",
            reopenReasonRequired:
              "Please explain why you want to reopen this ticket.",
            replyRequired: "Please write a message.",
            replyFailed: "An error occurred while sending your reply",
            dailyLimit:
              "You have reached your daily ticket limit (5 tickets). Please try again tomorrow.",
            invalidContent:
              "Invalid content was detected. Please try again.",
            submitFailed: "An error occurred while submitting your ticket",
            fileTooLarge: (name) => `${name} is too large (max 5MB)`,
            fileType: (name) => `${name} uses an unsupported file format`,
            fileCount: "You can attach up to 3 files",
          },
          success: {
            reopened: "Ticket reopened successfully!",
            replySent: "Your reply was sent successfully!",
            submitted: (ticketNumber) =>
              `Your ticket was submitted successfully. Ticket No: ${ticketNumber}`,
          },
          system: {
            reopened: (reason) =>
              `Ticket reopened by the user.\nReason: ${reason}`,
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
          authRequired: "You need to sign in to access this page",
          title: "Support",
          subtitle:
            "Share your feedback with us and help us improve your experience",
          hideForm: "Hide Form",
          showForm: "Create New Ticket",
          formTitle: "Create New Ticket",
          category: "Category",
          categoryOptions: {
            complaint: "Complaint",
            suggestion: "Suggestion",
            technical: "Technical Support",
            other: "Other",
          },
          subject: "Subject",
          subjectPlaceholder: "Enter the ticket subject...",
          message: "Message",
          messagePlaceholder: "Write a detailed explanation...",
          attachments: "Attach Files (Optional)",
          attachmentHint:
            "Up to 3 files, max 5MB each. JPG, PNG, GIF, PDF, TXT",
          selectedFiles: "Selected Files",
          filesUploading: "Uploading Files...",
          submitting: "Submitting...",
          submit: "Submit Ticket",
          yourTickets: "Your Tickets",
          totalTickets: (count) => `${count} tickets found`,
          emptyTitle: "No tickets yet",
          emptyDescription:
            "Use the button above to create your first ticket.",
          createFirst: "Create New Ticket",
          assignedAdmin: "Admin Assigned",
          reopen: "Reopen",
          responseCount: (count) => `${count} replies`,
          attachmentCount: (count) => `${count} attachments`,
          messageContent: "Message Content",
          attachedFiles: "Attached Files",
          download: "Download",
          reopenTitle: "Reopen Ticket",
          reopenDescription:
            "Why do you want to reopen this ticket? Please explain your reason:",
          reopenPlaceholder:
            "Example: The issue is still not resolved, or I want to share more details...",
          cancel: "Cancel",
          reopening: "Reopening...",
          ticketPrefix: "Ticket",
          you: "You",
          systemLabel: "System",
          admin: "Admin",
          replyPlaceholder: "Write a reply...",
          send: "Send",
          sending: "Sending...",
        }
      : {
          errors: {
            fetchTickets: "Biletler yüklenirken bir hata oluştu",
            reopenLimit:
              "Günlük bilet yeniden açma limitinize ulaştınız (5 açma). Lütfen yarın tekrar deneyin.",
            reopenFailed: "Bilet yeniden açılırken bir hata oluştu",
            reopenReasonRequired:
              "Lütfen bileti neden yeniden açmak istediğinizi belirtin.",
            replyRequired: "Lütfen bir mesaj yazın.",
            replyFailed: "Yanıt gönderilirken bir hata oluştu",
            dailyLimit:
              "Günlük bilet limitinize ulaştınız (5 bilet). Lütfen yarın tekrar deneyin.",
            invalidContent:
              "Geçersiz içerik tespit edildi. Lütfen tekrar deneyin.",
            submitFailed: "Bilet gönderilirken bir hata oluştu",
            fileTooLarge: (name) => `${name} çok büyük (max 5MB)`,
            fileType: (name) => `${name} desteklenmeyen dosya formatı`,
            fileCount: "En fazla 3 dosya ekleyebilirsiniz",
          },
          success: {
            reopened: "Bilet başarıyla yeniden açıldı!",
            replySent: "Yanıtınız başarıyla gönderildi!",
            submitted: (ticketNumber) =>
              `Biletiniz başarıyla gönderildi! Bilet No: ${ticketNumber}`,
          },
          system: {
            reopened: (reason) =>
              `Bilet kullanıcı tarafından yeniden açıldı.\nGerekçe: ${reason}`,
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
          authRequired: "Bu sayfaya erişim için giriş yapmanız gerekiyor",
          title: "Destek",
          subtitle:
            "Görüşlerinizi bizimle paylaşın ve deneyiminizi geliştirmemize yardımcı olun",
          hideForm: "Formu Gizle",
          showForm: "Yeni Bilet Oluştur",
          formTitle: "Yeni Bilet Oluştur",
          category: "Kategori",
          categoryOptions: {
            complaint: "Şikayet",
            suggestion: "Öneri",
            technical: "Teknik Destek",
            other: "Diğer",
          },
          subject: "Konu",
          subjectPlaceholder: "Bilet konusunu girin...",
          message: "Mesaj",
          messagePlaceholder: "Detaylı açıklama yazın...",
          attachments: "Dosya Ekle (Opsiyonel)",
          attachmentHint: "En fazla 3 dosya, 5MB'a kadar. JPG, PNG, GIF, PDF, TXT",
          selectedFiles: "Seçilen Dosyalar",
          filesUploading: "Dosyalar Yükleniyor...",
          submitting: "Gönderiliyor...",
          submit: "Bilet Gönder",
          yourTickets: "Biletleriniz",
          totalTickets: (count) => `Toplam ${count} bilet bulundu`,
          emptyTitle: "Henüz bilet bulunmuyor",
          emptyDescription:
            "İlk biletinizi oluşturmak için yukarıdaki butonu kullanın.",
          createFirst: "Yeni Bilet Oluştur",
          assignedAdmin: "Admin Atandı",
          reopen: "Yeniden Aç",
          responseCount: (count) => `${count} yanıt`,
          attachmentCount: (count) => `${count} ek`,
          messageContent: "Mesaj İçeriği",
          attachedFiles: "Ekli Dosyalar",
          download: "İndir",
          reopenTitle: "Bileti Yeniden Aç",
          reopenDescription:
            "Bu bileti neden yeniden açmak istiyorsunuz? Gerekçenizi belirtin:",
          reopenPlaceholder:
            "Örn: Sorun henüz çözülmedi, ek bilgi paylaşmak istiyorum...",
          cancel: "İptal",
          reopening: "Açılıyor...",
          ticketPrefix: "Bilet",
          you: "Siz",
          systemLabel: "Sistem",
          admin: "Admin",
          replyPlaceholder: "Yanıt yazın...",
          send: "Gönder",
          sending: "Gönderiliyor...",
        };
  const [user, loading] = useAuthState(auth);
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "complaint",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [reopenReason, setReopenReason] = useState("");
  const [isReopening, setIsReopening] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedTicketForReply, setSelectedTicketForReply] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchUserTickets();
    }
  }, [user, loading, router]);

  // Live subscribe to selected ticket while chat modal is open
  useEffect(() => {
    if (!showReplyModal || !selectedTicketForReply?.id) return;
    let unsubscribe;
    (async () => {
      try {
        const { doc, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("@/firebase");
        const ticketRef = doc(db, "tickets", selectedTicketForReply.id);
        unsubscribe = onSnapshot(ticketRef, (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          setSelectedTicketForReply((prev) => ({
            id: snap.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              prev?.createdAt ||
              null,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
          }));
        });
      } catch (err) {
        logger.error("Error subscribing to ticket:", err);
      }
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showReplyModal, selectedTicketForReply?.id]);

  // Prevent body scroll when any modal is open
  useEffect(() => {
    if (showReopenModal || showReplyModal || showForm) {
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
  }, [showReopenModal, showReplyModal, showForm]);

  const fetchUserTickets = async () => {
    try {
      setIsLoading(true);
      const { collection, getDocs, query, where, orderBy } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const ticketsQuery = query(
        collection(db, "tickets"),
        where("userEmail", "==", user.email)
      );

      const snapshot = await getDocs(ticketsQuery);
      const ticketsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      }));

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

  const generateTicketNumber = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-4);
    return `TK${year}${month}${day}-${timestamp}`;
  };

  const sanitizeInput = (input) => {
    if (typeof input !== "string") return input;
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  };

  const checkRateLimit = async (userEmail) => {
    try {
      const { collection, query, where, getDocs, Timestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Basitleştirilmiş rate limit - sadece userEmail'e göre filtrele
      const userTicketsQuery = query(
        collection(db, "tickets"),
        where("userEmail", "==", userEmail)
      );

      const snapshot = await getDocs(userTicketsQuery);

      // Client-side'da son 24 saat içindeki ticket'ları say
      const recentTickets = snapshot.docs.filter((doc) => {
        const ticketDate = new Date(doc.data().createdAt);
        return ticketDate >= oneDayAgo;
      });

      return recentTickets.length < 5; // Max 5 tickets per day
    } catch (error) {
      logger.error("Error checking rate limit:", error);
      return true; // Allow if check fails
    }
  };

  const checkReopenRateLimit = async (userEmail) => {
    try {
      const { collection, query, where, getDocs, Timestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Basitleştirilmiş reopen rate limit
      const userReopenQuery = query(
        collection(db, "ticketReopens"),
        where("userEmail", "==", userEmail)
      );

      const snapshot = await getDocs(userReopenQuery);

      // Client-side'da son 24 saat içindeki reopen'ları say
      const recentReopens = snapshot.docs.filter((doc) => {
        const reopenDate = new Date(doc.data().reopenedAt);
        return reopenDate >= oneDayAgo;
      });

      return recentReopens.length < 5; // Max 5 reopens per day
    } catch (error) {
      logger.error("Error checking reopen rate limit:", error);
      return true; // Allow if check fails
    }
  };

  const reopenTicket = async (ticketId, reason) => {
    try {
      const canReopen = await checkReopenRateLimit(user.email);
      if (!canReopen) {
        toast.error(copy.errors.reopenLimit);
        return false;
      }

      const { doc, updateDoc, addDoc, collection, serverTimestamp } =
        await import("firebase/firestore");
      const { db } = await import("@/firebase");

      // Update ticket status
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        status: "open",
        updatedAt: serverTimestamp(),
        reopenedAt: serverTimestamp(),
        reopenedBy: user.email,
        reopenReason: sanitizeInput(reason),
      });

      // Log the reopen activity for rate limiting
      await addDoc(collection(db, "ticketReopens"), {
        ticketId,
        userEmail: user.email,
        reason: sanitizeInput(reason),
        reopenedAt: serverTimestamp(),
      });

      // Add system response about reopening
      const updatedTicket = tickets.find((t) => t.id === ticketId);
      if (updatedTicket && updatedTicket.responses) {
        updatedTicket.responses.push({
          message: copy.system.reopened(sanitizeInput(reason)),
          createdAt: new Date().toISOString(),
          isSystemMessage: true,
        });
      }

      toast.success(copy.success.reopened);
      fetchUserTickets(); // Refresh the tickets
      return true;
    } catch (error) {
      logger.error("Error reopening ticket:", error);
      toast.error(copy.errors.reopenFailed);
      return false;
    }
  };

  const uploadFiles = async (files) => {
    const attachments = [];
    const { ref, uploadBytes, getDownloadURL } = await import(
      "firebase/storage"
    );
    const { storage } = await import("@/firebase");

    for (const file of files) {
      const fileRef = ref(
        storage,
        `tickets/${user.uid}/${Date.now()}-${file.name}`
      );
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      attachments.push({
        name: file.name,
        url: downloadURL,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
    }

    return attachments;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
    ];

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(copy.errors.fileTooLarge(file.name));
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(copy.errors.fileType(file.name));
        return false;
      }
      return true;
    });

    if (selectedFiles.length + validFiles.length > 3) {
      toast.error(copy.errors.fileCount);
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReopenClick = (ticketId) => {
    setSelectedTicketId(ticketId);
    setReopenReason("");
    setShowReopenModal(true);
  };

  const handleReopenSubmit = async () => {
    if (!reopenReason.trim()) {
      toast.error(copy.errors.reopenReasonRequired);
      return;
    }

    setIsReopening(true);
    const success = await reopenTicket(selectedTicketId, reopenReason);

    if (success) {
      // Toast'ın görünmesi için modal'ı kapatmadan önce kısa bir gecikme ekle
      setTimeout(() => {
        setShowReopenModal(false);
        setSelectedTicketId(null);
        setReopenReason("");
      }, 100);
    }
    setIsReopening(false);
  };

  const closeReopenModal = () => {
    setShowReopenModal(false);
    setSelectedTicketId(null);
    setReopenReason("");
  };

  const handleReplyClick = (ticket) => {
    setSelectedTicketForReply(ticket);
    setReplyMessage("");
    setShowReplyModal(true);
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) {
      toast.error(copy.errors.replyRequired);
      return;
    }

    setIsSubmittingReply(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      const newResponse = {
        message: sanitizeInput(replyMessage),
        userEmail: user.email,
        userName: user.displayName || user.email,
        createdAt: new Date().toISOString(),
        isUserResponse: true,
      };

      const ticketRef = doc(db, "tickets", selectedTicketForReply.id);
      await updateDoc(ticketRef, {
        responses: [...(selectedTicketForReply.responses || []), newResponse],
        updatedAt: serverTimestamp(),
      });

      toast.success(copy.success.replySent);
      setReplyMessage("");
      // fetchUserTickets(); // Modal açık kalacak, ticket güncellenmesi live olacak
    } catch (error) {
      logger.error("Error sending reply:", error);
      toast.error(copy.errors.replyFailed);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const closeReplyModal = () => {
    setShowReplyModal(false);
    setSelectedTicketForReply(null);
    setReplyMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Rate limiting check
      const canSubmit = await checkRateLimit(user.email);
      if (!canSubmit) {
        toast.error(copy.errors.dailyLimit);
        setIsSubmitting(false);
        return;
      }

      const { collection, addDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/firebase");

      // Input sanitization
      const sanitizedData = {
        subject: sanitizeInput(formData.subject),
        message: sanitizeInput(formData.message),
        category: formData.category,
      };

      // Validate sanitized inputs
      if (!sanitizedData.subject || !sanitizedData.message) {
        toast.error(copy.errors.invalidContent);
        setIsSubmitting(false);
        return;
      }

      // Upload files if any
      let attachments = [];
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        attachments = await uploadFiles(selectedFiles);
      }

      const ticketNumber = generateTicketNumber();

      const ticketData = {
        ...sanitizedData,
        ticketNumber,
        userEmail: user.email,
        userName: user.displayName || user.email,
        status: "open",
        assignedTo: null,
        attachments,
        responses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "tickets"), ticketData);

      toast.success(copy.success.submitted(ticketNumber));
      setFormData({ subject: "", message: "", category: "complaint" });
      setSelectedFiles([]);
      setShowForm(false);
      fetchUserTickets();
    } catch (error) {
      logger.error("Error submitting ticket:", error);
      toast.error(copy.errors.submitFailed);
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <div className="text-white text-lg">{copy.loading}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <p className="text-lg text-red-400">{copy.authRequired}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="container mx-auto px-4 pt-20 sm:pt-24 md:pt-28 pb-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] mb-4 sm:mb-6 px-2 py-2 leading-tight">
            {copy.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 md:mb-12 max-w-3xl mx-auto px-4">
            {copy.subtitle}
          </p>

          {/* Action Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-500/30"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {showForm ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              )}
            </svg>
            {showForm ? copy.hideForm : copy.showForm}
          </button>
        </div>

        {/* Ticket Form */}
        {showForm && (
          <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 md:mb-16 max-w-3xl mx-auto shadow-2xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {copy.formTitle}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a2 2 0 012-2z"
                      />
                    </svg>
                    {copy.category}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white transition-all duration-200 [&>option]:bg-gray-800 [&>option]:text-white"
                    required
                  >
                    <option value="complaint" className="bg-gray-800 text-white">
                      🚨 {copy.categoryOptions.complaint}
                    </option>
                    <option value="suggestion" className="bg-gray-800 text-white">
                      💡 {copy.categoryOptions.suggestion}
                    </option>
                    <option value="technical" className="bg-gray-800 text-white">
                      🔧 {copy.categoryOptions.technical}
                    </option>
                    <option value="other" className="bg-gray-800 text-white">
                      📝 {copy.categoryOptions.other}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    {copy.subject}
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-400 transition-all duration-200"
                    placeholder={copy.subjectPlaceholder}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {copy.message}
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-400 resize-none transition-all duration-200"
                  placeholder={copy.messagePlaceholder}
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  {copy.attachments}
                </label>
                <div className="border-2 border-dashed border-gray-600/50 rounded-xl p-6 bg-gray-700/20 hover:bg-gray-700/30 transition-all duration-200">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.txt"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-blue-700 file:text-white hover:file:from-blue-700 hover:file:to-blue-800 transition-all duration-200"
                  />
                  <div className="flex items-center justify-center mt-4 text-gray-400">
                    <svg
                      className="w-8 h-8 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm">
                      {copy.attachmentHint}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="bg-blue-900/10 rounded-xl p-6 border border-blue-500/20">
                  <label className="block text-sm font-semibold text-blue-200 mb-4 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {copy.selectedFiles} ({selectedFiles.length}/3)
                  </label>
                  <div className="space-y-3">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-800/50 rounded-xl p-4 border border-gray-700/30"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        >
                          <svg
                            className="w-4 h-4"
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
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || uploadingFiles}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-3"
              >
                {uploadingFiles ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {copy.filesUploading}
                  </>
                ) : isSubmitting ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {copy.submitting}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    {copy.submit}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {copy.yourTickets}
            </h2>
            {tickets.length > 0 && (
              <p className="text-gray-400">{copy.totalTickets(tickets.length)}</p>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {copy.emptyTitle}
              </h3>
              <p className="text-gray-400 mb-6">
                {copy.emptyDescription}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {copy.createFirst}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-gray-600/50 cursor-pointer"
                  onClick={() => handleReplyClick(ticket)}
                >
                  {/* Ticket Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white break-words">
                              {ticket.subject}
                            </h3>
                            {ticket.ticketNumber && (
                              <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-mono rounded-lg border border-blue-500/30">
                                #{ticket.ticketNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <span
                              className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold ${getStatusColor(
                                ticket.status
                              )}`}
                            >
                              {getStatusText(ticket.status)}
                            </span>
                            <span className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-gray-700/50 text-gray-200 border border-gray-600/30">
                              {getCategoryText(ticket.category)}
                            </span>
                            {ticket.assignedTo && (
                              <span className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold bg-purple-900/50 text-purple-200 border border-purple-600/30">
                                👤 {copy.assignedAdmin}
                              </span>
                            )}
                          </div>
                          {ticket.status === "closed" && (
                            <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopenClick(ticket.id);
                                }}
                                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                {copy.reopen}
                              </button>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-400 mt-2">
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6v10a2 2 0 01-2 2H10a2 2 0 01-2-2V7z"
                                />
                              </svg>
                              {formatLocalizedDate(ticket.createdAt, locale, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {ticket.responses?.length > 0 && (
                              <div className="flex items-center gap-1 text-green-400">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                {copy.responseCount(ticket.responses.length)}
                              </div>
                            )}
                            {ticket.attachments?.length > 0 && (
                              <div className="flex items-center gap-1 text-blue-400">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                  />
                                </svg>
                                {copy.attachmentCount(ticket.attachments.length)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Content */}
                  <div className="bg-gray-700/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {copy.messageContent}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                      {ticket.message}
                    </p>
                  </div>

                  {/* Attachments */}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="bg-blue-900/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-500/20">
                      <h4 className="text-xs sm:text-sm font-semibold text-blue-200 mb-3 sm:mb-4 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        {copy.attachedFiles} ({ticket.attachments.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {ticket.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700/30"
                          >
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                {attachment.type.startsWith("image/") ? (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {(attachment.size / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-3 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              {copy.download}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation moved into modal */}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reopen Modal */}
        {showReopenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {copy.reopenTitle}
                </h3>
              </div>

              <p className="text-gray-300 mb-6">
                {copy.reopenDescription}
              </p>

              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder={copy.reopenPlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white placeholder-gray-400 resize-none mb-6"
                required
              />

              <div className="flex gap-3">
                <button
                  onClick={closeReopenModal}
                  disabled={isReopening}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  {copy.cancel}
                </button>
                <button
                  onClick={handleReopenSubmit}
                  disabled={isReopening || !reopenReason.trim()}
                  className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isReopening ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {copy.reopening}
                    </>
                  ) : (
                    copy.reopen
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showReplyModal && selectedTicketForReply && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div 
              className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl"
              style={{ overscrollBehavior: 'contain' }}
            >
              {/* Header */}
              <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-700 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">
                    {copy.ticketPrefix} #
                    {selectedTicketForReply.ticketNumber ||
                      selectedTicketForReply.id}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {selectedTicketForReply.subject}
                  </p>
                </div>
                <button
                  onClick={closeReplyModal}
                  className="text-gray-400 hover:text-gray-200"
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

              {/* Conversation */}
              <div className="flex flex-col h-[65vh] sm:h-[60vh]">
                <div 
                  className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 bg-gray-900"
                  style={{ 
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {/* Original ticket message (user) */}
                  <div className="flex items-start gap-2 sm:gap-3 justify-end">
                    <div className="max-w-[85%] sm:max-w-xl bg-green-900/30 border border-green-700 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-green-300">
                          {copy.you}
                        </span>
                        {selectedTicketForReply.createdAt && (
                          <span className="text-[9px] sm:text-[10px] text-gray-400">
                            {formatLocalizedDate(
                              selectedTicketForReply.createdAt,
                              locale,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap break-words">
                        {selectedTicketForReply.message}
                      </p>
                    </div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-700 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                      S
                    </div>
                  </div>
                  {/* Replies */}
                  {selectedTicketForReply.responses?.map((response, idx) => {
                    const isSystem = response.isSystemMessage;
                    const isUserR = response.isUserResponse === true;
                    const isAdminR = !isSystem && !isUserR;
                    // On user panel: user's messages should align right, admin left
                    const alignRight = isUserR && !isSystem;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 sm:gap-3 ${
                          alignRight ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!alignRight && (
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${
                              isAdminR ? "bg-blue-700" : "bg-gray-600"
                            } flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0`}
                          >
                            {isAdminR ? "A" : "S"}
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-xl ${
                            isSystem
                              ? "bg-gray-800/70 border-gray-600"
                              : alignRight
                              ? "bg-green-900/30 border-green-700"
                              : "bg-blue-900/40 border-blue-700"
                          } border rounded-2xl px-3 sm:px-4 py-2 sm:py-3`}
                        >
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                            <span
                              className={`text-[10px] sm:text-xs font-semibold ${
                                isSystem
                                  ? "text-gray-300"
                                  : alignRight
                                  ? "text-green-300"
                                  : "text-blue-300"
                              }`}
                            >
                              {isSystem
                                ? copy.systemLabel
                                : alignRight
                                ? copy.you
                                : copy.admin}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-gray-400">
                              {formatLocalizedDate(response.createdAt, locale, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap break-words">
                            {response.message}
                          </p>
                        </div>
                        {alignRight && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-700 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                            S
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Composer */}
                <div className="p-2 sm:p-3 md:p-4 border-t border-gray-700 bg-gray-900">
                  <div className="flex gap-2 sm:gap-3">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={2}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/70 border border-gray-700 rounded-xl focus:outline-none focus:border-green-500 text-white placeholder-gray-400 resize-none text-xs sm:text-sm"
                      placeholder={copy.replyPlaceholder}
                      required
                    />
                    <button
                      onClick={handleReplySubmit}
                      disabled={isSubmittingReply || !replyMessage.trim()}
                      className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                    >
                      {isSubmittingReply ? copy.sending : copy.send}
                    </button>
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
          className="mt-16"
        />
      </div>
    </div>
  );
}
