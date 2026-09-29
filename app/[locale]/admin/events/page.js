"use client";
// admin/events/page.js
import { useEffect, useState } from "react";
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

export default function AdminEventsPage() {
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
      toast.success("Etkinlik başarıyla oluşturuldu!");
      resetForm();
    } catch (error) {
      logger.error("Error adding event:", error);
      toast.error("Etkinlik oluşturulurken bir hata oluştu!");
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
      toast.success("Etkinlik başarıyla güncellendi!");
      setEvents((prev) =>
        prev.map((event) =>
          event.firestoreId === formData.firestoreId ? formData : event
        )
      );
      resetForm();
    } catch (error) {
      logger.error("Error updating event:", error);
      toast.error("Etkinlik güncellenirken bir hata oluştu!");
    }
  };

  // Delete event
  const handleDeleteEvent = async (firestoreId) => {
    if (
      !confirm(
        "Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "events", firestoreId));
      toast.success("Etkinlik başarıyla silindi!");
      setEvents((prev) =>
        prev.filter((event) => event.firestoreId !== firestoreId)
      );
    } catch (error) {
      logger.error("Error deleting event:", error);
      toast.error("Etkinlik silinirken bir hata oluştu!");
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
          toast.error(`Bu etkinlik için son email gönderiminden ${remainingMinutes} dakika sonra tekrar email gönderebilirsiniz.`);
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
        alert("No users registered for this event.");
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

      toast.success("Email'ler başarıyla gönderildi!");
    } catch (error) {
      logger.error("Error sending emails:", error);
      alert(error.message || "Error sending emails. Please try again later.");
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
      alert(
        error.message || "Error generating QR code. Please try again later."
      );
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
    return <p className="py-12 text-ink-2">Loading...</p>;
  }

  if (!isAdmin) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        Access Denied
      </p>
    );
  }

  const rowAction = "h-11 md:h-9";
  const codeChip = "rounded-sm bg-paper-2 px-1.5 py-0.5 font-outlier text-xs";
  const codeBlock = "rounded-sm bg-paper-2 p-2 font-outlier text-xs";

  return (
    <div>
      <PageHeader
        title="Etkinlik Yönetimi"
        description="Tüm etkinlikleri görüntüleyin ve yönetin"
      />

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 md:max-w-2xl">
        <Stat label="Aktif Etkinlik" value={getCurrentEvents().length} />
        <Stat label="Arşivlenen" value={getArchivedEvents().length} />
        <Stat
          label="Sponsorlu"
          value={
            getCurrentEvents().filter((e) => e.sponsors && e.sponsors.length > 0)
              .length
          }
        />
        <Stat
          label="Kategoriler"
          value={new Set(getCurrentEvents().map((e) => e.category)).size}
        />
      </dl>

      {/* Add / Edit Event Form */}
      <Section
        title={isEditing ? "Etkinlik Düzenle" : "Yeni Etkinlik Ekle"}
        className="md:mt-16"
      >
        <form
          onSubmit={isEditing ? handleUpdateEvent : handleAddEvent}
          className="max-w-3xl space-y-4"
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            <Field id="event-name" label="Etkinlik Adı" required>
              <Input
                type="text"
                name="name"
                placeholder="Etkinlik adını girin..."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Field>
            <Field id="event-name-en" label="English Event Name">
              <Input
                type="text"
                name="nameEn"
                placeholder="Enter the event name in English..."
                value={formData.nameEn}
                onChange={handleChange}
              />
            </Field>
            <Field id="event-category" label="Kategori" required>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={cn(fieldClasses, "h-control")}
              >
                <option value="Konferans">Konferans</option>
                <option value="DevFest">DevFest</option>
                <option value="Gezi">Gezi</option>
                <option value="Eğitim">Eğitim</option>
              </select>
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="event-description">Açıklama *</Label>
              <Button
                type="button"
                variant="link"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Düzenle" : "Önizleme"}
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
                placeholder="Etkinlik açıklamasını girin... (Markdown destekli)"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
              />
            )}
          </div>

          <Field id="event-description-en" label="English Description">
            <Textarea
              name="descriptionEn"
              placeholder="Enter the event description in English..."
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
              <span className="font-medium">Markdown Formatını Nasıl Kullanacağım?</span>
            </summary>
            <div className="space-y-5 pb-5 pt-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">Temel Formatlar</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>**kalın metin**</code> → <strong>kalın metin</strong></p>
                  <p><code className={codeChip}>*italik metin*</code> → <em>italik metin</em></p>
                  <p><code className={codeChip}>~~çizili metin~~</code> → <s>çizili metin</s></p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">Başlıklar</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}># Büyük Başlık</code></p>
                  <p><code className={codeChip}>## Orta Başlık</code></p>
                  <p><code className={codeChip}>### Küçük Başlık</code></p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">Linkler</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>[Metin](https://example.com)</code></p>
                  <p className="text-xs text-muted-foreground">Kare parantez içine gösterilecek metni, normal parantez içine de URL'yi yazın.</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">Kod</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>`inline kod`</code> → inline kod</p>
                  <p className="text-xs text-muted-foreground">Kod bloğu için üç backtick (`) kullanın:</p>
                  <div className={codeBlock}>
                    ```<br/>
                    kodunuz burada<br/>
                    ```
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">Listeler</h4>
                <div className="space-y-3 text-sm text-ink-2">
                  <div>
                    <p className="mb-1">Maddeli Liste:</p>
                    <div className={codeBlock}>
                      - Madde 1<br/>
                      - Madde 2<br/>
                      - Madde 3
                    </div>
                  </div>
                  <div>
                    <p className="mb-1">Numaralı Liste:</p>
                    <div className={codeBlock}>
                      1. Madde 1<br/>
                      2. Madde 2<br/>
                      3. Madde 3
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink">Dikkat Kutusu (Bloktur)</h4>
                <div className="space-y-2 text-sm text-ink-2">
                  <p><code className={codeChip}>&gt; Önemli bilgi</code></p>
                  <p className="text-xs text-muted-foreground">Başına &gt; koyduğunuz satırlar dikkat kutusu olarak gösterilir.</p>
                </div>
              </div>

              <div className="border-t border-rule pt-3">
                <p className="text-xs text-muted-foreground">
                  <strong>İpucu:</strong> Sağ üstteki "Önizleme" butonunu kullanarak yazarken nasıl görüneceğini görebilirsiniz!
                </p>
              </div>
            </div>
          </details>

          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            <Field id="event-date" label="Tarih" required>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="font-outlier"
              />
            </Field>
            <Field id="event-time" label="Saat" required>
              <Input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="font-outlier"
              />
            </Field>
            <Field id="event-location" label="Konum" required>
              <Input
                type="text"
                name="location"
                placeholder="Etkinlik konumunu girin..."
                value={formData.location}
                onChange={handleChange}
                required
              />
            </Field>
            <Field id="event-location-en" label="English Location">
              <Input
                type="text"
                name="locationEn"
                placeholder="Enter the event location in English..."
                value={formData.locationEn}
                onChange={handleChange}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium leading-none">Etkinlik Resmi</span>
            <ImageUpload
              onImageUpload={handleImageUpload}
              currentImageUrl={formData.imageUrl}
              folder={StoragePaths.EVENTS}
              prefix="event_"
              placeholder="Etkinlik Resmi Yükle"
            />
          </div>

          <Field id="event-file-url" label="Doküman URL'si">
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
            <span className="text-sm font-medium leading-none">Sponsorlar</span>
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
                    ? `${formData.sponsors.length} sponsor seçildi`
                    : "Sponsor seçin"}
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
                      {sponsor?.name || "Bilinmeyen Sponsor"}
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
              {isEditing ? "Etkinlik Güncelle" : "Etkinlik Ekle"}
            </Button>
          </div>
        </form>
      </Section>

      {/* Manage Events */}
      <Section title={`Tüm Etkinlikler (${events.length})`} className="md:mt-16">
        <div className="mb-2 flex gap-6 border-b border-rule">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            aria-current={activeTab === "current" ? "true" : undefined}
            className="-mb-px min-h-11 whitespace-nowrap border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors duration-micro hover:text-ink aria-[current=true]:border-brand aria-[current=true]:font-semibold aria-[current=true]:text-ink"
          >
            Aktif Etkinlikler ({getCurrentEvents().length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            aria-current={activeTab === "archive" ? "true" : undefined}
            className="-mb-px min-h-11 whitespace-nowrap border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors duration-micro hover:text-ink aria-[current=true]:border-brand aria-[current=true]:font-semibold aria-[current=true]:text-ink"
          >
            Arşiv ({getArchivedEvents().length})
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
                    ? "Henüz aktif etkinlik bulunmuyor"
                    : "Arşivlenmiş etkinlik bulunmuyor"
                }
                description={
                  activeTab === "current"
                    ? "İlk etkinliği eklemek için yukarıdaki formu kullanın"
                    : "1 haftadan eski etkinlikler burada görünür"
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
                              <span className="tabular-nums">{event.sponsors.length}</span> sponsor
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
                        Düzenle
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className={rowAction}
                        onClick={() => handleDeleteEvent(event.firestoreId)}
                      >
                        Sil
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
                            ? "Arşivlenen etkinlikler için email gönderilemez"
                            : ""
                        }
                      >
                        Email Gönder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={rowAction}
                        onClick={() => handleGenerateQRCode(event.id)}
                        disabled={isArchived}
                        title={
                          isArchived
                            ? "Arşivlenen etkinlikler için QR kod oluşturulamaz"
                            : ""
                        }
                      >
                        QR Kodu
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
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4 animate-in fade-in-0 duration-short"
          style={{ overscrollBehavior: 'contain' }}
          onClick={() => setQRCodeModalOpen(false)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border border-rule bg-background p-6 text-foreground"
            style={{ overscrollBehavior: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-bold">QR Kodu</h2>

            <div className="my-6 border-y border-rule py-6">
              <img
                src={currentQRCodeDataURL}
                alt="QR Kodu"
                className="mx-auto w-full max-w-xs"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm text-muted-foreground">QR Kodu ID:</p>
              <p className="break-all font-outlier text-md font-semibold">
                {currentQRCodeId}
              </p>
            </div>

            <Button onClick={() => setQRCodeModalOpen(false)} className="w-full">
              Kapat
            </Button>
          </div>
        </div>
      )}

      <ToastContainer theme="light" />
    </div>
  );
}
