"use client";
// admin/sponsors/page.js
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
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
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/utils";

export default function AdminSponsorsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sponsor state
  const [sponsors, setSponsors] = useState([]);

  // Auto-refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Sponsor form data and editing
  const [sponsorFormData, setSponsorFormData] = useState({
    firestoreId: "",
    name: "",
    img_url: "",
    website_url: "",
  });

  const router = useRouter();

  // Check if the user is admin
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

  // Fetch sponsors
  const fetchSponsors = async () => {
    try {
      const sponsorSnapshot = await getDocs(collection(db, "sponsors"));
      setSponsors(
        sponsorSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      logger.error("Error fetching sponsors:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSponsors();
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

  // Handle input changes for sponsor form
  const handleSponsorChange = (e) => {
    const { name, value } = e.target;
    setSponsorFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset sponsor form
  const resetSponsorForm = () => {
    setSponsorFormData({
      firestoreId: "",
      name: "",
      img_url: "",
      website_url: "",
    });
  };

  // Add a new sponsor
  const handleAddSponsor = async (e) => {
    e.preventDefault();
    try {
      const newSponsor = {
        name: sponsorFormData.name,
        img_url: sponsorFormData.img_url,
        website_url: sponsorFormData.website_url,
      };
      const docRef = await addDoc(collection(db, "sponsors"), newSponsor);
      setSponsors((prev) => [
        ...prev,
        { firestoreId: docRef.id, ...newSponsor },
      ]);
      resetSponsorForm();
      toast.success("Sponsor başarıyla eklendi!");
    } catch (error) {
      logger.error("Error adding sponsor:", error);
      toast.error("Sponsor eklenirken bir hata oluştu!");
    }
  };

  // Edit an existing sponsor
  const handleEditSponsor = (sponsor) => {
    setSponsorFormData(sponsor);
  };

  // Update an existing sponsor
  const handleUpdateSponsor = async (e) => {
    e.preventDefault();
    try {
      const sponsorRef = doc(db, "sponsors", sponsorFormData.firestoreId);
      await setDoc(
        sponsorRef,
        {
          name: sponsorFormData.name,
          img_url: sponsorFormData.img_url,
          website_url: sponsorFormData.website_url,
        },
        { merge: true }
      );
      setSponsors((prev) =>
        prev.map((s) =>
          s.firestoreId === sponsorFormData.firestoreId
            ? { ...s, ...sponsorFormData }
            : s
        )
      );
      resetSponsorForm();
      toast.success("Sponsor başarıyla güncellendi!");
    } catch (error) {
      logger.error("Error updating sponsor:", error);
      toast.error("Sponsor güncellenirken bir hata oluştu!");
    }
  };

  // Delete sponsor
  const handleDeleteSponsor = async (firestoreId) => {
    if (
      !confirm(
        "Bu sponsoru silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "sponsors", firestoreId));
      setSponsors((prev) =>
        prev.filter((sponsor) => sponsor.firestoreId !== firestoreId)
      );
      toast.success("Sponsor başarıyla silindi!");
    } catch (error) {
      logger.error("Error deleting sponsor:", error);
      toast.error("Sponsor silinirken bir hata oluştu!");
    }
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

  const isEditing = !!sponsorFormData.firestoreId;

  return (
    <div>
      <PageHeader
        title="Sponsor Yönetimi"
        description="Tüm sponsorları görüntüleyin ve yönetin"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft aria-hidden="true" />
              Admin Paneline Geri Dön
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <dl className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Stat label="Toplam Sponsor" value={sponsors.length} />
        <Stat
          label="Aktif Sponsorlar"
          value={sponsors.filter((s) => s.website_url && s.img_url).length}
        />
        <Stat label="Bu Ay Eklenen" value={0} />
      </dl>

      {/* Sponsor Form */}
      <Section title={isEditing ? "Sponsor Düzenle" : "Yeni Sponsor Ekle"}>
        <form
          onSubmit={isEditing ? handleUpdateSponsor : handleAddSponsor}
          className="grid max-w-2xl gap-2"
        >
          <Field id="sponsor-name" label="Sponsor Adı *">
            <Input
              type="text"
              name="name"
              placeholder="Sponsor adını girin..."
              value={sponsorFormData.name}
              onChange={handleSponsorChange}
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Field id="sponsor-img-url" label="Logo URL *">
              <Input
                type="url"
                name="img_url"
                placeholder="https://example.com/logo.png"
                value={sponsorFormData.img_url}
                onChange={handleSponsorChange}
                required
              />
            </Field>
            <Field id="sponsor-website-url" label="Website URL *">
              <Input
                type="url"
                name="website_url"
                placeholder="https://sponsor-website.com"
                value={sponsorFormData.website_url}
                onChange={handleSponsorChange}
                required
              />
            </Field>
          </div>

          {/* Preview */}
          {sponsorFormData.img_url && (
            <div className="mb-4 border-t border-rule pt-4">
              <p className="mb-3 text-sm font-medium text-ink">Logo Önizlemesi:</p>
              <div className="flex items-center gap-4">
                <img
                  src={sponsorFormData.img_url}
                  alt="Sponsor Logo Preview"
                  className="h-16 w-16 shrink-0 rounded border border-rule bg-paper-2 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {sponsorFormData.name || "Sponsor Adı"}
                  </p>
                  <p className="break-all text-sm text-muted-foreground">
                    {sponsorFormData.website_url || "Website URL"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">
              {isEditing ? "Sponsor Güncelle" : "Sponsor Ekle"}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={resetSponsorForm}>
                İptal Et
              </Button>
            )}
          </div>
        </form>
      </Section>

      {/* Manage Sponsors */}
      <Section title={`Tüm Sponsorlar (${sponsors.length})`}>
        {sponsors.length === 0 ? (
          <EmptyState
            title="Henüz sponsor bulunmuyor"
            description="İlk sponsoru eklemek için yukarıdaki formu kullanın"
          />
        ) : (
          <ul>
            {sponsors.map((sponsor) => (
              <li
                key={sponsor.firestoreId}
                className="flex flex-col gap-4 border-b border-rule py-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-rule bg-paper-2">
                    {sponsor.img_url ? (
                      <img
                        src={sponsor.img_url}
                        alt={sponsor.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={cn(
                        "h-full w-full items-center justify-center bg-paper-3",
                        sponsor.img_url ? "hidden" : "flex"
                      )}
                    >
                      <span className="font-display text-lg font-semibold text-ink">
                        {sponsor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-ink">{sponsor.name}</h3>
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-brand underline underline-offset-4 hover:decoration-2"
                    >
                      {sponsor.website_url}
                    </a>
                  </div>
                </div>

                <div className="flex shrink-0 gap-3">
                  <Button variant="outline" onClick={() => handleEditSponsor(sponsor)}>
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteSponsor(sponsor.firestoreId)}
                  >
                    Sil
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

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
