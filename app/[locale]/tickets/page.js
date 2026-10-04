"use client";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "@/i18n/navigation";
import { loginHref } from "@/utils/redirect";
import { logger } from "@/utils/logger";
import { useLocale } from "next-intl";
import { formatLocalizedDate, withYearIfNotCurrent } from "@/utils/localeUtils";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input, fieldClasses } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PageContainer,
  PageHeader,
  Section,
  EmptyState,
} from "@/components/ui/page";

export default function TicketsPage() {
  const locale = useLocale();
  // Support requests are "talep" in Turkish: "bilet" is the QR ticket for an event.
  const copy =
    locale === "en"
      ? {
          errors: {
            fetchTickets: "Your requests could not be loaded. Reload the page and try again.",
            reopenLimit:
              "You have reopened 5 requests today, which is the daily limit. You can try again tomorrow.",
            reopenFailed: "The request could not be reopened. Check your connection and try again.",
            reopenReasonRequired: "Write why you are reopening it.",
            replyRequired: "Write a message.",
            replyFailed: "Your reply was not sent. Check your connection and try again.",
            dailyLimit:
              "You have opened 5 requests today, which is the daily limit. You can try again tomorrow.",
            invalidContent: "Write the subject and the message as plain text.",
            submitFailed: "Your request was not sent. Check your connection and try again.",
            fileTooLarge: (name) => `${name} is larger than 5 MB.`,
            fileType: (name) => `${name} cannot be attached; use JPG, PNG, GIF, PDF or TXT.`,
            fileCount: "You can attach up to 3 files.",
          },
          success: {
            reopened: "Request reopened.",
            submitted: (ticketNumber) => `Request received. Number: ${ticketNumber}`,
          },
          system: {
            reopened: (reason) =>
              `Request reopened by the user.\nReason: ${reason}`,
          },
          statuses: {
            open: "Open",
            closed: "Closed",
            in_progress: "Being reviewed",
            unknown: "Unknown",
          },
          categories: {
            complaint: "Complaint",
            suggestion: "Suggestion",
            technical: "Technical problem",
            other: "Other",
            unknown: "Unknown",
          },
          loading: "Loading…",
          authRequired: "Taking you to the sign-in page…",
          title: "Support",
          subtitle:
            "Open a request for a problem, a suggestion or a complaint; our replies appear here.",
          hideForm: "Close the form",
          showForm: "New request",
          formTitle: "New request",
          category: "Category",
          categoryOptions: {
            complaint: "Complaint",
            suggestion: "Suggestion",
            technical: "Technical problem",
            other: "Other",
          },
          subject: "Subject",
          subjectPlaceholder: "For example: my event registration is missing",
          message: "Message",
          messagePlaceholder: "What happened, and what did you expect? Attach a screenshot if you have one.",
          attachments: "Attach files (optional)",
          attachmentHint: "Up to 3 files, each up to 5 MB. JPG, PNG, GIF, PDF, TXT.",
          selectedFiles: "Selected files",
          filesUploading: "Uploading files…",
          submitting: "Sending…",
          submit: "Send request",
          yourTickets: "Your requests",
          totalTickets: (count) => (count === 1 ? "1 request" : `${count} requests`),
          emptyTitle: "No requests yet",
          emptyDescription:
            "When you have a problem or a suggestion, open a request from the button above.",
          createFirst: "New request",
          assignedAdmin: "Someone is on it",
          reopen: "Reopen",
          responseCount: (count) => (count === 1 ? "1 reply" : `${count} replies`),
          attachmentCount: (count) => (count === 1 ? "1 attachment" : `${count} attachments`),
          messageContent: "Your message",
          attachedFiles: "Attachments",
          download: "Download",
          reopenTitle: "Reopen the request",
          reopenDescription:
            "Why are you reopening it? Say briefly whether the problem is back or you have more to add.",
          reopenPlaceholder: "For example: it still happens when I…",
          cancel: "Cancel",
          ticketPrefix: "Request",
          you: "You",
          systemLabel: "System",
          admin: "Team",
          replyPlaceholder: "Write a reply",
          send: "Send",
          removeFile: (name) => `Remove ${name}`,
        }
      : {
          errors: {
            fetchTickets: "Taleplerin yüklenemedi. Sayfayı yenileyip yeniden dene.",
            reopenLimit:
              "Bugün 5 talebi yeniden açtın; bu günlük sınır. Yarın yeniden deneyebilirsin.",
            reopenFailed: "Talep yeniden açılamadı. Bağlantını kontrol edip yeniden dene.",
            reopenReasonRequired: "Neden yeniden açtığını yaz.",
            replyRequired: "Bir mesaj yaz.",
            replyFailed: "Yanıtın gönderilemedi. Bağlantını kontrol edip yeniden dene.",
            dailyLimit:
              "Bugün 5 talep açtın; bu günlük sınır. Yarın yeniden deneyebilirsin.",
            invalidContent: "Konuyu ve mesajı düz metin olarak yaz.",
            submitFailed: "Talebin gönderilemedi. Bağlantını kontrol edip yeniden dene.",
            fileTooLarge: (name) => `${name} 5 MB'tan büyük.`,
            fileType: (name) => `${name} eklenemez; JPG, PNG, GIF, PDF ya da TXT olmalı.`,
            fileCount: "En fazla 3 dosya ekleyebilirsin.",
          },
          success: {
            reopened: "Talep yeniden açıldı.",
            submitted: (ticketNumber) => `Talebin alındı. Talep no: ${ticketNumber}`,
          },
          system: {
            reopened: (reason) =>
              `Talep kullanıcı tarafından yeniden açıldı.\nGerekçe: ${reason}`,
          },
          statuses: {
            open: "Açık",
            closed: "Kapandı",
            in_progress: "İnceleniyor",
            unknown: "Bilinmiyor",
          },
          categories: {
            complaint: "Şikâyet",
            suggestion: "Öneri",
            technical: "Teknik sorun",
            other: "Diğer",
            unknown: "Bilinmiyor",
          },
          loading: "Yükleniyor…",
          authRequired: "Giriş sayfasına yönlendiriliyorsun…",
          title: "Destek",
          subtitle:
            "Bir sorun, öneri ya da şikâyetin varsa talep aç; yanıtlarımızı burada görürsün.",
          hideForm: "Formu kapat",
          showForm: "Yeni talep",
          formTitle: "Yeni talep",
          category: "Kategori",
          categoryOptions: {
            complaint: "Şikâyet",
            suggestion: "Öneri",
            technical: "Teknik sorun",
            other: "Diğer",
          },
          subject: "Konu",
          subjectPlaceholder: "Ör. Etkinlik kaydım profilimde görünmüyor",
          message: "Mesaj",
          messagePlaceholder: "Ne oldu, ne bekliyordun? Ekran görüntüsü varsa ekle.",
          attachments: "Dosya ekle (isteğe bağlı)",
          attachmentHint: "En fazla 3 dosya, her biri en fazla 5 MB. JPG, PNG, GIF, PDF, TXT.",
          selectedFiles: "Seçilen dosyalar",
          filesUploading: "Dosyalar yükleniyor…",
          submitting: "Gönderiliyor…",
          submit: "Talebi gönder",
          yourTickets: "Taleplerin",
          totalTickets: (count) => `${count} talep`,
          emptyTitle: "Henüz talebin yok",
          emptyDescription:
            "Bir sorunun ya da önerin olduğunda yukarıdaki düğmeyle talep açabilirsin.",
          createFirst: "Yeni talep",
          assignedAdmin: "Ekipten biri ilgileniyor",
          reopen: "Yeniden aç",
          responseCount: (count) => `${count} yanıt`,
          attachmentCount: (count) => `${count} ek`,
          messageContent: "Mesajın",
          attachedFiles: "Ekler",
          download: "İndir",
          reopenTitle: "Talebi yeniden aç",
          reopenDescription:
            "Neden yeniden açıyorsun? Sorun sürüyorsa ya da ekleyeceğin bir şey varsa kısaca yaz.",
          reopenPlaceholder: "Ör. Sorun hâlâ sürüyor; şu adımda takılıyorum…",
          cancel: "Vazgeç",
          ticketPrefix: "Talep",
          you: "Sen",
          systemLabel: "Sistem",
          admin: "Ekip",
          replyPlaceholder: "Yanıt yaz",
          send: "Gönder",
          removeFile: (name) => `${name} dosyasını kaldır`,
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
  // Shown where they happen instead of as toasts
  const [listError, setListError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [formError, setFormError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [reopenError, setReopenError] = useState(null);
  const [replyError, setReplyError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(loginHref("/tickets"));
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

  const fetchUserTickets = async () => {
    try {
      setIsLoading(true);
      setListError(null);
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
      setListError(copy.errors.fetchTickets);
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
        setReopenError(copy.errors.reopenLimit);
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

      setNotice(copy.success.reopened);
      fetchUserTickets(); // Refresh the tickets
      return true;
    } catch (error) {
      logger.error("Error reopening ticket:", error);
      setReopenError(copy.errors.reopenFailed);
      return false;
    }
  };

  const uploadFiles = async (files) => {
    const attachments = [];
    const { ref, uploadBytes, getDownloadURL } = await import(
      "firebase/storage"
    );
    const { storage } = await import("@/lib/firebase/storage");

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
    setFileError(null);
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
        setFileError(copy.errors.fileTooLarge(file.name));
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setFileError(copy.errors.fileType(file.name));
        return false;
      }
      return true;
    });

    if (selectedFiles.length + validFiles.length > 3) {
      setFileError(copy.errors.fileCount);
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
    setReopenError(null);
    setNotice(null);
    setShowReopenModal(true);
  };

  const handleReopenSubmit = async () => {
    if (!reopenReason.trim()) {
      setReopenError(copy.errors.reopenReasonRequired);
      return;
    }

    setIsReopening(true);
    setReopenError(null);
    const success = await reopenTicket(selectedTicketId, reopenReason);

    if (success) {
      setShowReopenModal(false);
      setSelectedTicketId(null);
      setReopenReason("");
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
    setReplyError(null);
    setShowReplyModal(true);
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) {
      setReplyError(copy.errors.replyRequired);
      return;
    }

    setIsSubmittingReply(true);
    setReplyError(null);
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

      // The reply appears in the thread through the live subscription; that is the confirmation.
      setReplyMessage("");
    } catch (error) {
      logger.error("Error sending reply:", error);
      setReplyError(copy.errors.replyFailed);
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
    setFormError(null);
    setNotice(null);

    try {
      // Rate limiting check
      const canSubmit = await checkRateLimit(user.email);
      if (!canSubmit) {
        setFormError(copy.errors.dailyLimit);
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
        setFormError(copy.errors.invalidContent);
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

      setNotice(copy.success.submitted(ticketNumber));
      setFormData({ subject: "", message: "", category: "complaint" });
      setSelectedFiles([]);
      setShowForm(false);
      fetchUserTickets();
    } catch (error) {
      logger.error("Error submitting ticket:", error);
      setFormError(copy.errors.submitFailed);
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
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

  if (loading || isLoading) {
    return (
      <PageContainer>
        <p role="status" className="py-16 text-md text-muted-foreground">
          {copy.loading}
        </p>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <p role="status" className="py-16 text-md text-muted-foreground">
          {copy.authRequired}
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={copy.title}
        description={copy.subtitle}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <X aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            {showForm ? copy.hideForm : copy.showForm}
          </Button>
        }
      />

      {/* Ticket Form */}
      {showForm && (
        <Section title={copy.formTitle}>
          <form onSubmit={handleSubmit} className="max-w-2xl pt-2">
            <div className="grid gap-x-6 md:grid-cols-2">
              <Field id="ticket-category" label={copy.category}>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={cn(fieldClasses, "h-control py-2")}
                  required
                >
                  <option value="complaint">
                    {copy.categoryOptions.complaint}
                  </option>
                  <option value="suggestion">
                    {copy.categoryOptions.suggestion}
                  </option>
                  <option value="technical">
                    {copy.categoryOptions.technical}
                  </option>
                  <option value="other">{copy.categoryOptions.other}</option>
                </select>
              </Field>

              <Field id="ticket-subject" label={copy.subject}>
                <Input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder={copy.subjectPlaceholder}
                  required
                />
              </Field>
            </div>

            <Field id="ticket-message" label={copy.message}>
              <Textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={6}
                placeholder={copy.messagePlaceholder}
                required
              />
            </Field>

            {/* File Upload */}
            <Field
              id="ticket-files"
              label={copy.attachments}
              help={copy.attachmentHint}
              error={fileError}
            >
              <Input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.txt"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </Field>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium">
                  {copy.selectedFiles}{" "}
                  <span className="font-outlier tabular-nums text-muted-foreground">
                    ({selectedFiles.length}/3)
                  </span>
                </p>
                <ul className="border-t border-rule">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-3 border-b border-rule py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <p className="font-outlier text-xs tabular-nums text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        aria-label={copy.removeFile(file.name)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting || uploadingFiles}>
              {uploadingFiles ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  {copy.filesUploading}
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  {copy.submitting}
                </>
              ) : (
                <>
                  <Send aria-hidden="true" />
                  {copy.submit}
                </>
              )}
            </Button>
            <p role="alert" className="mt-2 min-h-[1lh] text-sm text-error">
              {formError}
            </p>
          </form>
        </Section>
      )}

      {/* Tickets List */}
      <Section
        title={copy.yourTickets}
        action={
          tickets.length > 0 ? (
            <p className="text-sm tabular-nums text-muted-foreground">
              {copy.totalTickets(tickets.length)}
            </p>
          ) : null
        }
      >
        <p role="status" className={notice ? "mb-4 text-sm text-ink-2" : "sr-only"}>
          {notice}
        </p>
        {listError && (
          <p role="alert" className="mb-4 text-sm text-error">
            {listError}
          </p>
        )}
        {tickets.length === 0 && !listError ? (
          <EmptyState
            title={copy.emptyTitle}
            description={copy.emptyDescription}
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus aria-hidden="true" />
                {copy.createFirst}
              </Button>
            }
          />
        ) : (
          <ul>
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="grid cursor-pointer gap-x-8 gap-y-3 border-b border-rule py-5 transition-colors duration-micro ease-out hover:bg-paper-2 md:grid-cols-[12rem_minmax(0,1fr)]"
                onClick={() => handleReplyClick(ticket)}
              >
                {/* Ticket meta */}
                <div className="min-w-0 space-y-1 font-outlier text-sm text-muted-foreground">
                  {ticket.ticketNumber && (
                    <p className="break-all text-ink">#{ticket.ticketNumber}</p>
                  )}
                  <p className="capitalize">
                    <time dateTime={ticket.createdAt || undefined}>
                      {formatLocalizedDate(ticket.createdAt, locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </p>
                  {ticket.responses?.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                      <span className="tabular-nums">
                        {copy.responseCount(ticket.responses.length)}
                      </span>
                    </p>
                  )}
                  {ticket.attachments?.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4" aria-hidden="true" />
                      <span className="tabular-nums">
                        {copy.attachmentCount(ticket.attachments.length)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="break-words font-display text-lg font-semibold">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReplyClick(ticket);
                      }}
                      className="rounded-sm text-left hover:underline hover:decoration-brand hover:decoration-2 hover:underline-offset-4"
                    >
                      {ticket.subject}
                    </button>
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusVariant(ticket.status)}>
                      {getStatusText(ticket.status)}
                    </Badge>
                    <Badge>{getCategoryText(ticket.category)}</Badge>
                    {ticket.assignedTo && <Badge>{copy.assignedAdmin}</Badge>}
                    {ticket.status === "closed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReopenClick(ticket.id);
                        }}
                      >
                        <RotateCcw aria-hidden="true" />
                        {copy.reopen}
                      </Button>
                    )}
                  </div>

                  {/* Ticket Content */}
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      {copy.messageContent}
                    </h4>
                    <p className="mt-1 max-w-measure whitespace-pre-wrap break-words text-ink-2">
                      {ticket.message}
                    </p>
                  </div>

                  {/* Attachments */}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                        {copy.attachedFiles}{" "}
                        <span className="font-outlier tabular-nums">
                          ({ticket.attachments.length})
                        </span>
                      </h4>
                      <ul className="border-t border-rule">
                        {ticket.attachments.map((attachment, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between gap-3 border-b border-rule py-2"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              {attachment.type.startsWith("image/") ? (
                                <ImageIcon
                                  className="h-4 w-4 shrink-0 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              ) : (
                                <FileText
                                  className="h-4 w-4 shrink-0 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {attachment.name}
                                </p>
                                <p className="font-outlier text-xs tabular-nums text-muted-foreground">
                                  {(attachment.size / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm text-sm font-medium text-brand underline decoration-1 underline-offset-4 transition-colors duration-micro ease-out hover:decoration-2"
                            >
                              <Download className="h-4 w-4" aria-hidden="true" />
                              {copy.download}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Conversation moved into modal */}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Reopen dialog */}
      <Dialog open={showReopenModal} onOpenChange={(open) => !open && !isReopening && closeReopenModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-10">{copy.reopenTitle}</DialogTitle>
            <DialogDescription id="reopen-description">{copy.reopenDescription}</DialogDescription>
          </DialogHeader>

          <Textarea
            value={reopenReason}
            onChange={(e) => {
              setReopenReason(e.target.value);
              setReopenError(null);
            }}
            placeholder={copy.reopenPlaceholder}
            rows={4}
            aria-labelledby="reopen-description"
            aria-invalid={reopenError ? true : undefined}
            required
          />
          <p role="alert" className="min-h-[1lh] text-sm text-error">
            {reopenError}
          </p>

          <DialogFooter className="gap-3 sm:space-x-0">
            <Button variant="outline" onClick={closeReopenModal} disabled={isReopening}>
              {copy.cancel}
            </Button>
            <Button
              onClick={handleReopenSubmit}
              loading={isReopening}
              disabled={!reopenReason.trim()}
            >
              {copy.reopen}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversation dialog */}
      <Dialog open={showReplyModal && Boolean(selectedTicketForReply)} onOpenChange={(open) => !open && closeReplyModal()}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
          {selectedTicketForReply && (
            <>
              {/* Header */}
              <div className="border-b border-rule py-3 pl-4 pr-14 md:pl-6">
                <DialogTitle className="truncate font-display text-lg font-bold">
                  {copy.ticketPrefix}{" "}
                  <span className="font-outlier text-base font-medium">
                    #{selectedTicketForReply.ticketNumber || selectedTicketForReply.id}
                  </span>
                </DialogTitle>
                <DialogDescription className="truncate text-sm text-muted-foreground">
                  {selectedTicketForReply.subject}
                </DialogDescription>
              </div>

              {/* Conversation */}
              <div className="flex h-[65vh] flex-col sm:h-[60vh]">
                <div
                  className="flex-1 overflow-y-auto px-4 md:px-6"
                  style={{
                    overscrollBehavior: "contain",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {/* Original ticket message (user) */}
                  <ThreadEntry
                    tone="user"
                    label={copy.you}
                    date={
                      selectedTicketForReply.createdAt
                        ? formatLocalizedDate(
                            selectedTicketForReply.createdAt,
                            locale,
                            withYearIfNotCurrent(selectedTicketForReply.createdAt, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          )
                        : null
                    }
                    message={selectedTicketForReply.message}
                  />
                  {/* Replies */}
                  {selectedTicketForReply.responses?.map((response, idx) => {
                    const isSystem = response.isSystemMessage;
                    const isUserR = response.isUserResponse === true;
                    // On user panel: user's messages are labelled "You", admin replies "Admin"
                    const alignRight = isUserR && !isSystem;
                    return (
                      <ThreadEntry
                        key={idx}
                        tone={isSystem ? "system" : alignRight ? "user" : "admin"}
                        label={
                          isSystem
                            ? copy.systemLabel
                            : alignRight
                            ? copy.you
                            : copy.admin
                        }
                        date={formatLocalizedDate(
                          response.createdAt,
                          locale,
                          withYearIfNotCurrent(response.createdAt, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        )}
                        message={response.message}
                      />
                    );
                  })}
                </div>
                {/* Composer */}
                <div className="border-t border-rule p-3 md:p-4">
                  <div className="flex items-end gap-3">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => {
                        setReplyMessage(e.target.value);
                        setReplyError(null);
                      }}
                      rows={2}
                      className="min-h-16 min-w-0 flex-1 text-sm"
                      placeholder={copy.replyPlaceholder}
                      aria-label={copy.replyPlaceholder}
                      required
                    />
                    <Button
                      onClick={handleReplySubmit}
                      loading={isSubmittingReply}
                      disabled={!replyMessage.trim()}
                    >
                      {copy.send}
                    </Button>
                  </div>
                  {replyError && (
                    <p role="alert" className="mt-2 text-sm text-error">
                      {replyError}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

// One entry in the ticket thread: author and time on one line, message below, hairline between entries.
function ThreadEntry({ tone, label, date, message }) {
  return (
    <div className="border-b border-rule py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span
          className={cn(
            "text-sm font-semibold",
            tone === "admin" && "text-brand",
            tone === "system" && "text-muted-foreground"
          )}
        >
          {label}
        </span>
        {date && (
          <span className="font-outlier text-xs text-muted-foreground">
            {date}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-1 max-w-measure whitespace-pre-wrap break-words text-sm",
          tone === "system" ? "text-muted-foreground" : "text-ink-2"
        )}
      >
        {message}
      </p>
    </div>
  );
}
