"use client";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Heart, Eye, MessageSquare, RefreshCw, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, fieldClasses } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { uploadImage, StoragePaths } from "@/utils/storageUtils";
import UserMentionInput from "@/components/UserMentionInput";

export default function AdminProjectsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    titleEn: "",
    description: "",
    descriptionEn: "",
    githubLink: "",
    image: null,
    collaborators: [],
    status: "active",
    archived: false,
  });

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

  useEffect(() => {
    const fetchProjects = async () => {
      if (!isAdmin) return;
      
      try {
        const projectsQuery = query(
          collection(db, "projects"),
          orderBy("createdAt", "desc")
        );
        const projectSnapshot = await getDocs(projectsQuery);
        setProjects(
          projectSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        logger.error("Error fetching projects:", error);
        toast.error("Projeler yüklenirken bir hata oluştu!");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [isAdmin]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showSocialModal) {
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
  }, [showSocialModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
      }));
    }
  };

  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, user]
    }));
  };

  const removeCollaborator = (userUid) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(collab => collab.uid !== userUid)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Lütfen tüm zorunlu alanları doldurun!");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = editingProject?.imageUrl || "";
      
      if (formData.image) {
        const uploadResult = await uploadImage(
          formData.image,
          StoragePaths.PROJECTS || "projects",
          "project_"
        );
        imageUrl = uploadResult.url;
      }

      const projectData = {
        title: formData.title,
        titleEn: formData.titleEn || "",
        description: formData.description,
        descriptionEn: formData.descriptionEn || "",
        githubLink: formData.githubLink || "",
        imageUrl: imageUrl,
        collaborators: formData.collaborators.map(collab => ({
          uid: collab.uid,
          email: collab.email,
          name: collab.name || collab.email,
          photoURL: collab.photoURL || "",
        })),
        status: formData.status,
        archived: formData.archived,
        updatedAt: serverTimestamp(),
      };

      if (editingProject) {
        // Update existing project
        await updateDoc(doc(db, "projects", editingProject.id), projectData);
        toast.success("Proje başarıyla güncellendi!");
      } else {
        // Create new project
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdBy: user.uid,
          createdByName: user.displayName || user.email,
          createdAt: serverTimestamp(),
          // Social features
          likes: [],
          comments: [],
          views: 0,
          // Admin features
          status: "active", // active, completed, paused
          archived: false,
        });
        toast.success("Proje başarıyla eklendi!");
      }

      setFormData({
        title: "",
        titleEn: "",
        description: "",
        descriptionEn: "",
        githubLink: "",
        image: null,
        collaborators: [],
        status: "active",
        archived: false,
      });
      setShowAddForm(false);
      setEditingProject(null);

      // Refresh projects
      const projectsQuery = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
      );
      const projectSnapshot = await getDocs(projectsQuery);
      setProjects(
        projectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      logger.error("Error saving project:", error);
      toast.error(editingProject ? "Proje güncellenirken bir hata oluştu!" : "Proje eklenirken bir hata oluştu!");
    } finally {
      setUploading(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      titleEn: project.titleEn || "",
      description: project.description,
      descriptionEn: project.descriptionEn || "",
      githubLink: project.githubLink || "",
      image: null,
      collaborators: project.collaborators || [],
      status: project.status || "active",
      archived: project.archived || false,
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      titleEn: "",
      description: "",
      descriptionEn: "",
      githubLink: "",
      image: null,
      collaborators: [],
      status: "active",
      archived: false,
    });
    setShowAddForm(false);
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (window.confirm(`"${projectTitle}" projesini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
        setProjects(prev => prev.filter(project => project.id !== projectId));
        toast.success("Proje başarıyla silindi!");
      } catch (error) {
        logger.error("Error deleting project:", error);
        toast.error("Proje silinirken bir hata oluştu!");
      }
    }
  };

  const handleManageSocial = (project) => {
    setSelectedProject(project);
    setShowSocialModal(true);
  };

  const handleResetViews = async (projectId) => {
    if (window.confirm("Görüntülenme sayısını sıfırlamak istediğinizden emin misiniz?")) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          views: 0
        });
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, views: 0 } : p
        ));
        setSelectedProject(prev => ({ ...prev, views: 0 }));
        toast.success("Görüntülenme sayısı sıfırlandı!");
      } catch (error) {
        logger.error("Error resetting views:", error);
        toast.error("Görüntülenme sayısı sıfırlanırken bir hata oluştu!");
      }
    }
  };

  const handleResetLikes = async (projectId) => {
    if (window.confirm("Tüm beğenileri silmek istediğinizden emin misiniz?")) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          likes: []
        });
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, likes: [] } : p
        ));
        setSelectedProject(prev => ({ ...prev, likes: [] }));
        toast.success("Tüm beğeniler silindi!");
      } catch (error) {
        logger.error("Error resetting likes:", error);
        toast.error("Beğeniler silinirken bir hata oluştu!");
      }
    }
  };

  const handleDeleteComment = async (projectId, commentId) => {
    if (window.confirm("Bu yorumu silmek istediğinizden emin misiniz?")) {
      try {
        const project = projects.find(p => p.id === projectId);
        const updatedComments = project.comments.filter(c => c.id !== commentId);
        
        await updateDoc(doc(db, "projects", projectId), {
          comments: updatedComments
        });
        
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, comments: updatedComments } : p
        ));
        setSelectedProject(prev => ({ ...prev, comments: updatedComments }));
        toast.success("Yorum silindi!");
      } catch (error) {
        logger.error("Error deleting comment:", error);
        toast.error("Yorum silinirken bir hata oluştu!");
      }
    }
  };

  if (loading || loadingProjects) {
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
        title="Projeler Yönetimi"
        description="Tüm projeleri görüntüleyin ve yönetin"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/projects">Projeler Sayfası</Link>
            </Button>
            <Button
              type="button"
              onClick={() => showAddForm ? handleCancelEdit() : setShowAddForm(true)}
            >
              {showAddForm ? "İptal" : "Yeni Proje Ekle"}
            </Button>
          </>
        }
      />

      {/* Projects Stats */}
      <Section title="İstatistikler">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Stat label="Toplam Proje" value={projects.length} />
          <Stat
            label="İşbirlikçili Projeler"
            value={projects.filter(p => p.collaborators && p.collaborators.length > 0).length}
          />
          <Stat
            label="GitHub Linkli"
            value={projects.filter(p => p.githubLink).length}
          />
        </dl>
      </Section>

      {/* Add Project Form */}
      {showAddForm && (
        <Section title={editingProject ? "Proje Düzenle" : "Yeni Proje Ekle"}>
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-2">
            <Field id="project-title" label="Proje Başlığı *">
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Proje başlığını girin"
              />
            </Field>
            <Field id="project-title-en" label="English Project Title">
              <Input
                type="text"
                name="titleEn"
                value={formData.titleEn}
                onChange={handleInputChange}
                placeholder="Enter the English project title"
              />
            </Field>

            <Field id="project-description" label="Açıklama *">
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Proje hakkında kısa bir açıklama yazın"
              />
            </Field>
            <Field id="project-description-en" label="English Description">
              <Textarea
                name="descriptionEn"
                value={formData.descriptionEn}
                onChange={handleInputChange}
                rows={4}
                placeholder="Write a short English description for the project"
              />
            </Field>

            <Field id="project-github" label="GitHub Linki">
              <Input
                type="url"
                name="githubLink"
                value={formData.githubLink}
                onChange={handleInputChange}
                placeholder="https://github.com/username/project"
              />
            </Field>

            <div className="flex flex-col gap-1.5 pb-2">
              <Label htmlFor="project-image">Proje Görseli</Label>
              {editingProject?.imageUrl && (
                <div className="mb-1">
                  <p className="mb-2 text-sm text-muted-foreground">Mevcut görsel:</p>
                  <img
                    src={editingProject.imageUrl}
                    alt="Mevcut proje görseli"
                    className="aspect-[4/3] w-32 rounded border border-rule object-cover"
                  />
                </div>
              )}
              <Input
                id="project-image"
                type="file"
                accept="image/*,image/heic,image/heif"
                onChange={handleImageChange}
                className="h-auto py-2"
              />
              {editingProject?.imageUrl && (
                <p className="text-sm text-muted-foreground">
                  Yeni bir görsel seçerseniz mevcut görsel değiştirilecektir.
                </p>
              )}
            </div>

            <div className="pb-4">
              <p className="mb-1.5 text-sm font-medium leading-none">İşbirlikçiler</p>
              <UserMentionInput
                onUserSelect={handleUserSelect}
                selectedUsers={formData.collaborators}
                placeholder="Kullanıcı emaili ile ara ve ekle..."
              />

              {/* Selected Collaborators */}
              {formData.collaborators.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-muted-foreground">Seçilen işbirlikçiler:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.collaborators.map((collab) => (
                      <div
                        key={collab.uid}
                        className="flex items-center gap-2 rounded border border-rule bg-secondary py-1 pl-2 pr-1 text-sm"
                      >
                        <img
                          src={collab.photoURL || "/logo.svg"}
                          alt={collab.name}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span>{collab.name || collab.email}</span>
                        <button
                          type="button"
                          onClick={() => removeCollaborator(collab.uid)}
                          className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-micro hover:bg-paper-3 hover:text-ink"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-status">Proje Durumu</Label>
                <select
                  id="project-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={cn(fieldClasses, "h-control py-2")}
                >
                  <option value="active">Aktif</option>
                  <option value="completed">Tamamlanmış</option>
                  <option value="paused">Beklemede</option>
                </select>
              </div>

              <div className="flex min-h-control items-center md:mt-6">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="archived"
                    checked={formData.archived}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      archived: e.target.checked
                    }))}
                    className="h-5 w-5 shrink-0 rounded-sm border border-input accent-brand"
                  />
                  Projeyi Arşivle
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button type="submit" disabled={uploading}>
                {uploading ?
                  (editingProject ? "Güncelleniyor..." : "Ekleniyor...") :
                  (editingProject ? "Proje Güncelle" : "Proje Ekle")
                }
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                İptal
              </Button>
            </div>
          </form>
        </Section>
      )}

      {/* Projects Table */}
      <Section title={`Tüm Projeler (${projects.length})`}>
        {projects.length === 0 ? (
          <EmptyState
            title="Henüz proje bulunmuyor."
            action={
              <Button asChild>
                <Link href="/projects">İlk Projeyi Ekle</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Proje</TableHead>
                <TableHead>İşbirlikçiler</TableHead>
                <TableHead>Sosyal Veriler</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      {project.imageUrl && (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="h-12 w-12 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {project.title}
                        </div>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {project.description}
                        </div>
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand underline underline-offset-4 hover:decoration-2"
                          >
                            GitHub ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {project.collaborators && project.collaborators.length > 0 ? (
                        project.collaborators.slice(0, 3).map((collab, index) => (
                          <Badge key={index}>
                            <img
                              src={collab.photoURL || "/logo.svg"}
                              alt={collab.name}
                              className="h-4 w-4 rounded-full object-cover"
                            />
                            <span>
                              {collab.name?.split(' ')[0] || collab.email.split('@')[0]}
                            </span>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                      {project.collaborators && project.collaborators.length > 3 && (
                        <span className="font-outlier text-xs tabular-nums text-muted-foreground">
                          +{project.collaborators.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 font-outlier text-xs tabular-nums text-ink-2">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{project.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{project.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{project.comments?.length || 0}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageSocial(project)}
                      >
                        Yönet
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-outlier tabular-nums text-ink-2">
                    {project.createdAt ? (
                      new Date(project.createdAt.toDate()).toLocaleDateString('tr-TR')
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProject(project)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id, project.title)}
                      >
                        Sil
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Social Data Management Modal */}
      {showSocialModal && selectedProject && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4 animate-in fade-in-0 duration-short"
          onClick={() => setShowSocialModal(false)}
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-rule bg-background text-foreground"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Modal Header */}
            <div className="border-b border-rule p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 id="social-modal-title" className="font-display text-xl font-bold">
                    Sosyal Veri Yönetimi
                  </h3>
                  <p className="mt-1 break-words text-ink-2">{selectedProject.title}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Kapat"
                  onClick={() => setShowSocialModal(false)}
                  className="-mr-2 -mt-2 shrink-0"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div
              className="max-h-[calc(90vh-140px)] overflow-y-auto p-4 sm:p-6"
              style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Stats and Actions */}
                <div>
                  <h4 className="mb-4 font-display text-lg font-semibold">İstatistikler ve İşlemler</h4>

                  {/* Stats */}
                  <dl className="mb-6 grid grid-cols-3 gap-4 border-y border-rule py-4">
                    <Stat label="Beğeni" value={selectedProject.likes?.length || 0} />
                    <Stat label="Görüntülenme" value={selectedProject.views || 0} />
                    <Stat label="Yorum" value={selectedProject.comments?.length || 0} />
                  </dl>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleResetViews(selectedProject.id)}
                      className="h-auto min-h-control w-full whitespace-normal py-2"
                    >
                      <RefreshCw aria-hidden="true" />
                      Görüntülenme Sayısını Sıfırla
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleResetLikes(selectedProject.id)}
                      className="h-auto min-h-control w-full whitespace-normal py-2"
                    >
                      <Trash2 aria-hidden="true" />
                      Tüm Beğenileri Sil
                    </Button>
                  </div>
                </div>

                {/* Comments Management */}
                <div className="min-w-0">
                  <h4 className="mb-4 font-display text-lg font-semibold">Yorumlar ({selectedProject.comments?.length || 0})</h4>

                  <div className="max-h-96 overflow-y-auto border-t border-rule">
                    {selectedProject.comments && selectedProject.comments.length > 0 ? (
                      selectedProject.comments
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((comment) => (
                        <div key={comment.id} className="border-b border-rule py-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={comment.userPhoto || "/logo.svg"}
                              alt={comment.userName}
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-medium">{comment.userName}</p>
                                  <p className="font-outlier text-xs tabular-nums text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString('tr-TR', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Sil"
                                  onClick={() => handleDeleteComment(selectedProject.id, comment.id)}
                                  className="-mr-2 -mt-2 shrink-0 text-error"
                                >
                                  <Trash2 aria-hidden="true" />
                                </Button>
                              </div>
                              <p className="break-words text-sm leading-relaxed text-ink-2">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-6 text-sm text-muted-foreground">Henüz yorum bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-rule p-4 sm:p-6">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSocialModal(false)}
                >
                  Kapat
                </Button>
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
