"use client";
// admin/events/page.js
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { auth, db } from "@/firebase";
import ImageUpload from "@/components/ImageUpload";
import { StoragePaths } from "@/utils/storageUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Calendar, ChevronDown, ChevronRight, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, fieldClasses } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import { adminCopy } from "@/utils/adminCopy";
import { useConfirm } from "@/components/ConfirmProvider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const COPY = {
  tr: {
    pageTitle: "Etkinlik yönetimi",
    pageSubtitle: "Tüm etkinlikleri görüntüleyin ve yönetin",
    statActiveEvents: "Aktif etkinlik",
    statArchived: "Arşivlenen",
    statSponsored: "Sponsorlu",
    statCategories: "Kategoriler",
    tabActiveEvents: (n) => `Aktif Etkinlikler (${n})`,
    tabArchive: (n) => `Arşiv (${n})`,
    editEventHeading: "Etkinlik düzenle",
    addEventHeading: "Yeni etkinlik ekle",
    eventNameLabel: "Etkinlik adı",
    eventNamePlaceholder: "Etkinlik adını girin…",
    englishEventName: "English event name",
    englishEventNamePlaceholder: "Enter the event name in English…",
    categoryLabel: "Kategori",
    catConference: "Konferans",
    catTrip: "Gezi",
    catTraining: "Eğitim",
    descriptionLabel: "Açıklama *",
    edit: "Düzenle",
    preview: "Önizleme",
    descriptionPlaceholder: "Etkinlik açıklamasını girin… (Markdown destekli)",
    englishDescription: "English description",
    englishDescriptionPlaceholder: "Enter the event description in English…",
    markdownHelpToggle: "Markdown formatını nasıl kullanacağım?",
    markdownBasicFormats: "Temel formatlar",
    markdownBoldText: "kalın metin",
    markdownItalicText: "italik metin",
    markdownStrikeText: "çizili metin",
    markdownHeadings: "Başlıklar",
    markdownBigHeading: "# Büyük başlık",
    markdownMediumHeading: "## Orta başlık",
    markdownSmallHeading: "### Küçük başlık",
    markdownLinks: "Linkler",
    markdownLinkText: "[Metin](https://example.com)",
    markdownLinkHint:
      "Kare parantez içine gösterilecek metni, normal parantez içine de URL'yi yazın.",
    markdownCode: "Kod",
    markdownInlineCode: "`inline kod`",
    markdownInlineCodeResult: "inline kod",
    markdownCodeBlockHint: "Kod bloğu için üç backtick (`) kullanın:",
    markdownCodeHere: "kodunuz burada",
    markdownLists: "Listeler",
    markdownBulletList: "Maddeli liste:",
    markdownItem: "Madde",
    markdownNumberedList: "Numaralı liste:",
    markdownCalloutBox: "Dikkat kutusu (bloktur)",
    markdownCalloutText: "> Önemli bilgi",
    markdownCalloutHint:
      "Başına > koyduğunuz satırlar dikkat kutusu olarak gösterilir.",
    markdownTipLabel: "İpucu:",
    markdownTipText:
      'Sağ üstteki "Önizleme" butonunu kullanarak yazarken nasıl görüneceğini görebilirsiniz!',
    dateLabel: "Tarih",
    timeLabel: "Saat",
    locationLabel: "Konum",
    locationPlaceholder: "Etkinlik konumunu girin…",
    englishLocation: "English location",
    englishLocationPlaceholder: "Enter the event location in English…",
    eventImageLabel: "Etkinlik resmi",
    eventImagePlaceholder: "Etkinlik resmi yükle",
    documentUrlLabel: "Doküman URL'si",
    sponsorsLabel: "Sponsorlar",
    sponsorsSelected: (n) => `${n} sponsor seçildi`,
    selectSponsor: "Sponsor seçin",
    unknownSponsor: "Bilinmeyen sponsor",
    updateEventButton: "Etkinlik güncelle",
    addEventButton: "Etkinlik ekle",
    allEventsHeading: (n) => `Tüm Etkinlikler (${n})`,
    emptyCurrentTitle: "Henüz aktif etkinlik bulunmuyor",
    emptyArchiveTitle: "Arşivlenmiş etkinlik bulunmuyor",
    emptyCurrentHint: "İlk etkinliği eklemek için yukarıdaki formu kullanın",
    emptyArchiveHint: "1 haftadan eski etkinlikler burada görünür",
    sponsorCount: (n) => `${n} sponsor`,
    deleteEvent: "Sil",
    sendEmail: "Email gönder",
    cantEmailArchived: "Arşivlenen etkinlikler için email gönderilemez",
    qrCode: "QR kodu",
    cantQrArchived: "Arşivlenen etkinlikler için QR kod oluşturulamaz",
    qrCodeModalTitle: "QR kodu",
    qrCodeAlt: "QR kodu",
    qrCodeIdLabel: "QR kodu ID:",
    closeButton: "Kapat",
    // Toasts / confirms / alerts
    confirmDeleteEvent:
      "Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    eventCreated: "Etkinlik başarıyla oluşturuldu",
    eventCreateError: "Etkinlik oluşturulurken bir hata oluştu.",
    eventUpdated: "Etkinlik başarıyla güncellendi",
    eventUpdateError: "Etkinlik güncellenirken bir hata oluştu.",
    eventDeleted: "Etkinlik başarıyla silindi",
    eventDeleteError: "Etkinlik silinirken bir hata oluştu.",
    emailRateLimit: (n) =>
      `Bu etkinlik için son email gönderiminden ${n} dakika sonra tekrar email gönderebilirsiniz.`,
    emailsSent: "E-postalar gönderildi.",
    noRegistrations: "Bu etkinliğe kayıtlı kimse yok.",
    emailError: "E-postalar gönderilemedi. Biraz sonra yeniden dene.",
    qrError: "QR kod oluşturulamadı. Yeniden dene.",
  },
  en: {
    pageTitle: "Event management",
    pageSubtitle: "View and manage all events",
    statActiveEvents: "Active events",
    statArchived: "Archived",
    statSponsored: "Sponsored",
    statCategories: "Categories",
    tabActiveEvents: (n) => `Active Events (${n})`,
    tabArchive: (n) => `Archive (${n})`,
    editEventHeading: "Edit event",
    addEventHeading: "Add new event",
    eventNameLabel: "Event name",
    eventNamePlaceholder: "Enter the event name…",
    englishEventName: "English event name",
    englishEventNamePlaceholder: "Enter the event name in English…",
    categoryLabel: "Category",
    catConference: "Conference",
    catTrip: "Trip",
    catTraining: "Training",
    descriptionLabel: "Description *",
    edit: "Edit",
    preview: "Preview",
    descriptionPlaceholder: "Enter the event description… (Markdown supported)",
    englishDescription: "English description",
    englishDescriptionPlaceholder: "Enter the event description in English…",
    markdownHelpToggle: "How do I use Markdown formatting?",
    markdownBasicFormats: "Basic formats",
    markdownBoldText: "bold text",
    markdownItalicText: "italic text",
    markdownStrikeText: "strikethrough text",
    markdownHeadings: "Headings",
    markdownBigHeading: "# Large heading",
    markdownMediumHeading: "## Medium heading",
    markdownSmallHeading: "### Small heading",
    markdownLinks: "Links",
    markdownLinkText: "[Text](https://example.com)",
    markdownLinkHint:
      "Put the text to display inside square brackets and the URL inside parentheses.",
    markdownCode: "Code",
    markdownInlineCode: "`inline code`",
    markdownInlineCodeResult: "inline code",
    markdownCodeBlockHint: "Use three backticks (`) for a code block:",
    markdownCodeHere: "your code here",
    markdownLists: "Lists",
    markdownBulletList: "Bulleted list:",
    markdownItem: "Item",
    markdownNumberedList: "Numbered list:",
    markdownCalloutBox: "Callout box (block)",
    markdownCalloutText: "> Important info",
    markdownCalloutHint:
      "Lines that start with > are displayed as a callout box.",
    markdownTipLabel: "Tip:",
    markdownTipText:
      'Use the "Preview" button in the top right to see how it will look as you type!',
    dateLabel: "Date",
    timeLabel: "Time",
    locationLabel: "Location",
    locationPlaceholder: "Enter the event location…",
    englishLocation: "English location",
    englishLocationPlaceholder: "Enter the event location in English…",
    eventImageLabel: "Event image",
    eventImagePlaceholder: "Upload event image",
    documentUrlLabel: "Document URL",
    sponsorsLabel: "Sponsors",
    sponsorsSelected: (n) => `${n} sponsor(s) selected`,
    selectSponsor: "Select a sponsor",
    unknownSponsor: "Unknown sponsor",
    updateEventButton: "Update event",
    addEventButton: "Add event",
    allEventsHeading: (n) => `All Events (${n})`,
    emptyCurrentTitle: "No active events yet",
    emptyArchiveTitle: "No archived events",
    emptyCurrentHint: "Use the form above to add your first event",
    emptyArchiveHint: "Events older than 1 week appear here",
    sponsorCount: (n) => `${n} sponsor(s)`,
    deleteEvent: "Delete",
    sendEmail: "Send email",
    cantEmailArchived: "Emails cannot be sent for archived events",
    qrCode: "QR code",
    cantQrArchived: "QR codes cannot be generated for archived events",
    qrCodeModalTitle: "QR code",
    qrCodeAlt: "QR code",
    qrCodeIdLabel: "QR code ID:",
    closeButton: "Close",
    // Toasts / confirms / alerts
    confirmDeleteEvent:
      "Are you sure you want to delete this event? This action cannot be undone.",
    eventCreated: "Event created successfully",
    eventCreateError: "An error occurred while creating the event.",
    eventUpdated: "Event updated successfully",
    eventUpdateError: "An error occurred while updating the event.",
    eventDeleted: "Event deleted successfully",
    eventDeleteError: "An error occurred while deleting the event.",
    emailRateLimit: (n) =>
      `You can send another email for this event ${n} minutes after the last one.`,
    emailsSent: "E-mails sent.",
    noRegistrations: "No one is registered for this event.",
    emailError: "The e-mails were not sent. Try again in a while.",
    qrError: "The QR code was not generated. Try again.",
  },
};

export default function AdminEventsPage() {
  const confirm = useConfirm();
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Events & Sponsors
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);

  // Auto-refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Event form management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // 'current' or 'archive'
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    id: "", // TODO: bunu sonra revize etmeliyiz ama çok da gerek yok
    name: "",
    nameEn: "",
    description: "",
    descriptionEn: "",
    date: "",
    time: "",
    imageUrl: "",
    location: "",
    locationEn: "",
    sponsors: [],
    category: "Konferans",
    file_url: "",
  });

  const router = useRouter();

  // Check if user is admin
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

  // Fetch events & sponsors
  const fetchData = async () => {
    try {
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const sponsorSnapshot = await getDocs(collection(db, "sponsors"));

      setEvents(
        eventsSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }))
      );

      setSponsors(
        sponsorSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      logger.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, refreshKey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Helper functions for event categorization
  const isEventArchived = (eventDate) => {
    if (!eventDate) return false;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(eventDate) < oneWeekAgo;
  };

  const getCurrentEvents = () => {
    return events.filter((event) => !isEventArchived(event.date));
  };

  const getArchivedEvents = () => {
    return events.filter((event) => isEventArchived(event.date));
  };

  // Form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageUpload = (imageData) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: imageData.url,
      imagePath: imageData.path,
    }));
  };

  // Add event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const newEvent = {
        ...formData,
        id: uuidv4(),
      };
      await addDoc(collection(db, "events"), newEvent);
      toast.success(copy.eventCreated);
      resetForm();
    } catch (error) {
      logger.error("Error adding event:", error);
      toast.error(copy.eventCreateError);
    }
  };

  // Edit event
  const handleEditEvent = (event) => {
    setIsEditing(true);
    setFormData(event);
  };

  // Update event
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventRef = doc(db, "events", String(formData.firestoreId));
      await setDoc(eventRef, { ...formData }, { merge: true });
      toast.success(copy.eventUpdated);
      setEvents((prev) =>
        prev.map((event) =>
          event.firestoreId === formData.firestoreId ? formData : event
        )
      );
      resetForm();
    } catch (error) {
      logger.error("Error updating event:", error);
      toast.error(copy.eventUpdateError);
    }
  };

  // Delete event
  const handleDeleteEvent = async (firestoreId) => {
    if (!(await confirm(copy.confirmDeleteEvent, { destructive: true }))) return;

    try {
      await deleteDoc(doc(db, "events", firestoreId));
      toast.success(copy.eventDeleted);
      setEvents((prev) =>
        prev.filter((event) => event.firestoreId !== firestoreId)
      );
    } catch (error) {
      logger.error("Error deleting event:", error);
      toast.error(copy.eventDeleteError);
    }
  };

  // Reset form
  const resetForm = () => {
    setIsEditing(false);
    setFormData({
      id: "",
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      date: "",
      time: "",
      imageUrl: "",
      location: "",
      locationEn: "",
      sponsors: [],
      category: "Konferans",
      file_url: "",
    });
  };

  // Update this function in your AdminEventsPage component
  const handleSendEmailToRegisteredUsers = async (eventId) => {
    try {
      // Rate limiting: Check last email sent time for this event
      const emailLogRef = doc(db, "emailLogs", eventId);
      const emailLogSnap = await getDoc(emailLogRef);

      if (emailLogSnap.exists()) {
        const lastSentAt = emailLogSnap.data().lastSentAt.toDate();
        const now = new Date();
        const timeDiff = now - lastSentAt;
        const hoursSinceLastSent = timeDiff / (1000 * 60 * 60); // Convert to hours

        // Minimum 1 hour between email sends for same event
        if (hoursSinceLastSent < 1) {
          const remainingMinutes = Math.ceil((60 - (hoursSinceLastSent * 60)));
          toast.error(copy.emailRateLimit(remainingMinutes));
          return;
        }
      }
      // Fetch registrations for the event
      const registrationsRef = collection(db, "registrations");
      const registrationsQuery = query(
        registrationsRef,
        where("eventId", "==", eventId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registeredUserIds = registrationsSnapshot.docs.map(
        (doc) => doc.data().userId
      );

      if (registeredUserIds.length === 0) {
        toast.info(copy.noRegistrations);
        return;
      }

      // Fetch user emails in batches and filter by wantsToGetEmails
      const usersCollectionRef = collection(db, "users");
      let userEmails = [];
      const batchSize = 10;

      for (let i = 0; i < registeredUserIds.length; i += batchSize) {
        const batch = registeredUserIds.slice(i, i + batchSize);
        const usersQuery = query(
          usersCollectionRef,
          where("__name__", "in", batch),
          where("wantsToGetEmails", "==", true) // Filter users who want to receive emails
        );
        const usersSnapshot = await getDocs(usersQuery);

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.email) {
            userEmails.push(userData.email);
          }
        });
      }

      const event = events.find((e) => e.id === eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Use the correct API route path
      const response = await fetch("/api/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userEmails,
          subject: `Update: ${event.name}`,
          text: `Dear participant,\n\nThis is an update regarding the event "${event.name}" scheduled for ${event.date} at ${event.time}.\n\nLocation: ${event.location}\n\nThank you for your registration!\n\nBest regards,\nGDG Trakya Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Event Update: ${event.name}</h2>
              <p>Dear participant,</p>
              <p>This is an update regarding the event you registered for:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Location:</strong> ${event.location}</p>
              </div>
              <p>Thank you for your registration!</p>
              <p>Best regards,<br>GDG On Campus Trakya Team</p>
            </div>
          `,
          adminEmail: user.email, // Pass admin's email for verification
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send emails");
      }

      // Log successful email send with timestamp
      await setDoc(emailLogRef, {
        eventId: eventId,
        lastSentAt: new Date(),
        sentBy: user.email,
        recipientCount: userEmails.length,
      });

      toast.success(copy.emailsSent);
    } catch (error) {
      logger.error("Error sending emails:", error);
      toast.error(copy.emailError);
    }
  };

  // Function to generate QR code
  const handleGenerateQRCode = async (eventId) => {
    try {
      // Check if a QR code already exists for the event
      const qrCodesRef = collection(db, "eventQrCodes");
      const qrCodeQuery = query(qrCodesRef, where("eventId", "==", eventId));
      const qrCodeSnapshot = await getDocs(qrCodeQuery);

      if (!qrCodeSnapshot.empty) {
        // QR code exists, display it
        const existingQRCodeData = qrCodeSnapshot.docs[0].data();
        const qrCodeId = qrCodeSnapshot.docs[0].id;
        const qrCodeDataURL = await QRCode.toDataURL(existingQRCodeData.code);

        setCurrentQRCodeDataURL(qrCodeDataURL);
        setCurrentQRCodeId(qrCodeId);
        setQRCodeModalOpen(true);
        return;
      }

      // Fetch the event details
      const event = events.find((e) => e.id === eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Get Firebase ID token for secure authentication
      const idToken = await user.getIdToken();

      // Call the API route to generate QR code
      const response = await fetch("/api/qrCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Secure authentication
        },
        body: JSON.stringify({
          eventId: eventId,
          adminEmail: user.email, // Pass admin's email for verification
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to generate QR code");
      }

      const { qrCodeDataURL, qrCodeId } = await response.json();

      // Display the QR code to the admin (you can use a modal or a new page)
      setCurrentQRCodeDataURL(qrCodeDataURL);
      setCurrentQRCodeId(qrCodeId);
      setQRCodeModalOpen(true);
    } catch (error) {
      logger.error("Error generating QR code:", error);
      toast.error(copy.qrError);
    }
  };

  const [qrCodeModalOpen, setQRCodeModalOpen] = useState(false);
  const [currentQRCodeDataURL, setCurrentQRCodeDataURL] = useState("");
  const [currentQRCodeId, setCurrentQRCodeId] = useState("");

  // Modal scroll lock effect
  useEffect(() => {
    if (qrCodeModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [qrCodeModalOpen]);

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

  const rowAction = "h-11 md:h-9";
  const codeChip = "rounded-sm bg-paper-2 px-1.5 py-0.5 font-outlier text-xs";
  const codeBlock = "rounded-sm bg-paper-2 p-2 font-outlier text-xs";

  return (
    <div>
      <PageHeader
        title={copy.pageTitle}
        description={copy.pageSubtitle}
      />

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 md:max-w-2xl">
        <Stat label={copy.statActiveEvents} value={getCurrentEvents().length} />
        <Stat label={copy.statArchived} value={getArchivedEvents().length} />
        <Stat
          label={copy.statSponsored}
          value={
            getCurrentEvents().filter((e) => e.sponsors && e.sponsors.length > 0)
              .length
          }
        />
        <Stat
          label={copy.statCategories}
          value={new Set(getCurrentEvents().map((e) => e.category)).size}
        />
      </dl>

      {/* Add / Edit Event Form */}
      <Section
        title={isEditing ? copy.editEventHeading : copy.addEventHeading}
        className="md:mt-16"
      >
        <form
          onSubmit={isEditing ? handleUpdateEvent : handleAddEvent}
          className="max-w-3xl space-y-4"
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            <Field id="event-name" label={copy.eventNameLabel} required>
              <Input
                type="text"
                name="name"
                placeholder={copy.eventNamePlaceholder}
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Field>
            <Field id="event-name-en" label={copy.englishEventName}>
              <Input
                type="text"
                name="nameEn"
                placeholder={copy.englishEventNamePlaceholder}
                value={formData.nameEn}
                onChange={handleChange}
              />
            </Field>
            <Field id="event-category" label={copy.categoryLabel} required>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={cn(fieldClasses, "h-control")}
              >
                <option value="Konferans">{copy.catConference}</option>
                <option value="DevFest">DevFest</option>
                <option value="Gezi">{copy.catTrip}</option>
                <option value="Eğitim">{copy.catTraining}</option>
              </select>
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="event-description">{copy.descriptionLabel}</Label>
              <Button
                type="button"
                variant="link"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? copy.edit : copy.preview}
              </Button>
            </div>
            {showPreview ? (
              <div
                id="event-description"
                className="min-h-[120px] w-full rounded border border-input bg-background px-3 py-2"
              >
                <MarkdownRenderer content={formData.description} />
              </div>
            ) : (
              <Textarea
                id="event-description"
                name="description"
                placeholder={copy.descriptionPlaceholder}
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
              />
            )}
          </div>

          <Field id="event-description-en" label={copy.englishDescription}>
            <Textarea
              name="descriptionEn"
              placeholder={copy.englishDescriptionPlaceholder}
              value={formData.descriptionEn}
              onChange={handleChange}
              rows={4}
            />
          </Field>

          {/* Markdown Help Guide */}
          <details className="group border-y border-rule">
            <summary className="flex min-h-11 cursor-pointer select-none list-none items-center gap-2 text-sm text-muted-foreground transition-colors duration-micro hover:text-ink">
              <ChevronRight
                className="h-4 w-4 shrink-0 transition-transform duration-short ease-out group-open:rotate-90"
                aria-hidden="true"
              />
              <span className="font-medium">{copy.markdownHelpToggle}</span>
            </summary>
            <div className="space-y-5 pb-5 pt-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">{copy.markdownBasicFormats}</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>**{copy.markdownBoldText}**</code> → <strong>{copy.markdownBoldText}</strong></p>
                  <p><code className={codeChip}>*{copy.markdownItalicText}*</code> → <em>{copy.markdownItalicText}</em></p>
                  <p><code className={codeChip}>~~{copy.markdownStrikeText}~~</code> → <s>{copy.markdownStrikeText}</s></p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">{copy.markdownHeadings}</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>{copy.markdownBigHeading}</code></p>
                  <p><code className={codeChip}>{copy.markdownMediumHeading}</code></p>
                  <p><code className={codeChip}>{copy.markdownSmallHeading}</code></p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">{copy.markdownLinks}</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>{copy.markdownLinkText}</code></p>
                  <p className="text-xs text-muted-foreground">{copy.markdownLinkHint}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">{copy.markdownCode}</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>{copy.markdownInlineCode}</code> → {copy.markdownInlineCodeResult}</p>
                  <p className="text-xs text-muted-foreground">{copy.markdownCodeBlockHint}</p>
                  <div className={codeBlock}>
                    ```<br/>
                    {copy.markdownCodeHere}<br/>
                    ```
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">{copy.markdownLists}</h4>
                <div className="space-y-3 text-sm text-ink-2">
                  <div>
                    <p className="mb-1">{copy.markdownBulletList}</p>
                    <div className={codeBlock}>
                      - {copy.markdownItem} 1<br/>
                      - {copy.markdownItem} 2<br/>
                      - {copy.markdownItem} 3
                    </div>
                  </div>
                  <div>
                    <p className="mb-1">{copy.markdownNumberedList}</p>
                    <div className={codeBlock}>
                      1. {copy.markdownItem} 1<br/>
                      2. {copy.markdownItem} 2<br/>
                      3. {copy.markdownItem} 3
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">{copy.markdownCalloutBox}</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>&gt; {copy.markdownCalloutText.replace("> ", "")}</code></p>
                  <p className="text-xs text-muted-foreground">{copy.markdownCalloutHint}</p>
                </div>
              </div>

              <div className="border-t border-rule pt-3">
                <p className="text-xs text-muted-foreground">
                  <strong>{copy.markdownTipLabel}</strong> {copy.markdownTipText}
                </p>
              </div>
            </div>
          </details>

          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            <Field id="event-date" label={copy.dateLabel} required>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="font-outlier"
              />
            </Field>
            <Field id="event-time" label={copy.timeLabel} required>
              <Input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="font-outlier"
              />
            </Field>
            <Field id="event-location" label={copy.locationLabel} required>
              <Input
                type="text"
                name="location"
                placeholder={copy.locationPlaceholder}
                value={formData.location}
                onChange={handleChange}
                required
              />
            </Field>
            <Field id="event-location-en" label={copy.englishLocation}>
              <Input
                type="text"
                name="locationEn"
                placeholder={copy.englishLocationPlaceholder}
                value={formData.locationEn}
                onChange={handleChange}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium leading-none">{copy.eventImageLabel}</span>
            <ImageUpload
              onImageUpload={handleImageUpload}
              currentImageUrl={formData.imageUrl}
              folder={StoragePaths.EVENTS}
              prefix="event_"
              placeholder={copy.eventImagePlaceholder}
            />
          </div>

          <Field id="event-file-url" label={copy.documentUrlLabel}>
            <Input
              type="url"
              name="file_url"
              placeholder="https://example.com/document.pdf"
              value={formData.file_url}
              onChange={handleChange}
            />
          </Field>

          {/* Sponsors Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium leading-none">{copy.sponsorsLabel}</span>
            <div className="relative">
              <button
                type="button"
                className={cn(
                  fieldClasses,
                  "flex h-control items-center justify-between gap-2 text-left"
                )}
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="min-w-0 truncate">
                  {formData.sponsors.length > 0
                    ? copy.sponsorsSelected(formData.sponsors.length)
                    : copy.selectSponsor}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-dropdown mt-1 max-h-60 w-full overflow-auto rounded-lg border border-rule bg-background shadow-whisper">
                  {sponsors.map((sponsor) => (
                    <button
                      type="button"
                      key={sponsor.firestoreId}
                      className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-micro hover:bg-secondary"
                      onClick={() => {
                        if (
                          !formData.sponsors.includes(sponsor.firestoreId)
                        ) {
                          setFormData((prev) => ({
                            ...prev,
                            sponsors: [...prev.sponsors, sponsor.firestoreId],
                          }));
                        }
                        setIsDropdownOpen(false);
                      }}
                    >
                      <img
                        src={sponsor.img_url}
                        alt={sponsor.name}
                        className="h-8 w-8 rounded object-contain"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <span className="min-w-0 font-medium">{sponsor.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Display selected sponsors */}
            {formData.sponsors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.sponsors.map((sponsorId, index) => {
                  const sponsor = sponsors.find(
                    (s) => s.firestoreId === sponsorId
                  );
                  return (
                    <Badge key={index} className="gap-2 py-1 text-sm">
                      {sponsor?.name || copy.unknownSponsor}
                      <button
                        type="button"
                        className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-micro hover:text-ink"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            sponsors: prev.sponsors.filter(
                              (id) => id !== sponsorId
                            ),
                          }))
                        }
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              {isEditing ? copy.updateEventButton : copy.addEventButton}
            </Button>
          </div>
        </form>
      </Section>

      {/* Manage Events */}
      <Section title={copy.allEventsHeading(events.length)} className="md:mt-16">
        <div className="mb-2 flex gap-6 border-b border-rule">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            aria-current={activeTab === "current" ? "true" : undefined}
            className="-mb-px min-h-11 whitespace-nowrap border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors duration-micro hover:text-ink aria-[current=true]:border-brand aria-[current=true]:font-semibold aria-[current=true]:text-ink"
          >
            {copy.tabActiveEvents(getCurrentEvents().length)}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            aria-current={activeTab === "archive" ? "true" : undefined}
            className="-mb-px min-h-11 whitespace-nowrap border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors duration-micro hover:text-ink aria-[current=true]:border-brand aria-[current=true]:font-semibold aria-[current=true]:text-ink"
          >
            {copy.tabArchive(getArchivedEvents().length)}
          </button>
        </div>

        {(() => {
          const displayEvents =
            activeTab === "current" ? getCurrentEvents() : getArchivedEvents();

          if (displayEvents.length === 0) {
            return (
              <EmptyState
                title={
                  activeTab === "current"
                    ? copy.emptyCurrentTitle
                    : copy.emptyArchiveTitle
                }
                description={
                  activeTab === "current"
                    ? copy.emptyCurrentHint
                    : copy.emptyArchiveHint
                }
                className="border-t-0"
              />
            );
          }

          return (
            <ul>
              {displayEvents.map((event) => {
                const isArchived = isEventArchived(event.date);
                return (
                  <li
                    key={event.firestoreId}
                    className="grid gap-4 border-b border-rule py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8"
                  >
                    {/* Event Info */}
                    <div className="flex min-w-0 items-start gap-4">
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="aspect-square w-16 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-lg font-bold">{event.name}</h3>
                          <Badge>{event.category}</Badge>
                        </div>
                        <div className="mb-3 line-clamp-2 text-ink-2">
                          <MarkdownRenderer
                            content={event.description}
                            className="[&>*]:mb-0 [&>*]:leading-tight"
                          />
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="font-outlier tabular-nums">
                              {event.date} - {event.time}
                            </span>
                          </div>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0">{event.location}</span>
                          </div>
                          {event.sponsors && event.sponsors.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="tabular-nums">{copy.sponsorCount(event.sponsors.length)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-start gap-2 lg:w-52 lg:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className={rowAction}
                        onClick={() => handleEditEvent(event)}
                        disabled={isArchived}
                      >
                        {a.edit}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className={rowAction}
                        onClick={() => handleDeleteEvent(event.firestoreId)}
                      >
                        {a.delete}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={rowAction}
                        onClick={() =>
                          handleSendEmailToRegisteredUsers(event.id)
                        }
                        disabled={isArchived}
                        title={
                          isArchived
                            ? copy.cantEmailArchived
                            : ""
                        }
                      >
                        {copy.sendEmail}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={rowAction}
                        onClick={() => handleGenerateQRCode(event.id)}
                        disabled={isArchived}
                        title={
                          isArchived
                            ? copy.cantQrArchived
                            : ""
                        }
                      >
                        {copy.qrCode}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </Section>

      {/* QR Code Modal */}
      {qrCodeModalOpen && (
        <Dialog open onOpenChange={(open) => { if (!open) { setQRCodeModalOpen(false); } }}>
          <DialogContent aria-describedby={undefined} className="max-h-[90dvh] max-w-md overflow-y-auto rounded-lg border border-rule bg-background p-6 text-foreground">
            <DialogTitle className="pr-10 font-display text-2xl font-bold">{copy.qrCodeModalTitle}</DialogTitle>

            <div className="my-6 border-y border-rule py-6">
              <img
                src={currentQRCodeDataURL}
                alt={copy.qrCodeAlt}
                className="mx-auto w-full max-w-xs"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm text-muted-foreground">{copy.qrCodeIdLabel}</p>
              <p className="break-all font-outlier text-md font-semibold">
                {currentQRCodeId}
              </p>
            </div>

            <Button onClick={() => setQRCodeModalOpen(false)} className="w-full">
              {copy.closeButton}
            </Button>
          </DialogContent>
        </Dialog>
      )}

      <ToastContainer theme="light" />
    </div>
  );
}
