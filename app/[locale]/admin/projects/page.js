"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
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
import { motion, AnimatePresence } from "framer-motion";
import { uploadImage, StoragePaths } from "@/utils/storageUtils";
import UserMentionInput from "@/components/UserMentionInput";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    pageTitle: "Projeler Yönetimi",
    pageSubtitle: "Tüm projeleri görüntüleyin ve yönetin",
    adminPanel: "← Admin Paneli",
    projectsPage: "Projeler Sayfası",
    newProject: "Yeni Proje Ekle",
    statsTitle: "İstatistikler",
    totalProjects: "Toplam Proje",
    collaborativeProjects: "İşbirlikçili Projeler",
    githubLinked: "GitHub Linkli",
    editProject: "Proje Düzenle",
    projectTitle: "Proje Başlığı *",
    projectTitlePlaceholder: "Proje başlığını girin",
    englishTitle: "English Project Title",
    englishTitlePlaceholder: "Enter the English project title",
    description: "Açıklama *",
    descriptionPlaceholder: "Proje hakkında kısa bir açıklama yazın",
    englishDescription: "English Description",
    englishDescriptionPlaceholder:
      "Write a short English description for the project",
    githubLink: "GitHub Linki",
    projectImage: "Proje Görseli",
    currentImage: "Mevcut görsel:",
    currentImageAlt: "Mevcut proje görseli",
    imageReplaceNote:
      "Yeni bir görsel seçerseniz mevcut görsel değiştirilecektir.",
    collaborators: "İşbirlikçiler",
    collaboratorsPlaceholder: "Kullanıcı emaili ile ara ve ekle...",
    selectedCollaborators: "Seçilen işbirlikçiler:",
    projectStatus: "Proje Durumu",
    statusActive: "Aktif",
    statusCompleted: "Tamamlanmış",
    statusPaused: "Beklemede",
    archiveProject: "Projeyi Arşivle",
    updating: "Güncelleniyor...",
    adding: "Ekleniyor...",
    updateProjectBtn: "Proje Güncelle",
    addProjectBtn: "Proje Ekle",
    allProjects: (n) => `Tüm Projeler (${n})`,
    noProjects: "Henüz proje bulunmuyor.",
    addFirstProject: "İlk Projeyi Ekle",
    colProject: "Proje",
    colCollaborators: "İşbirlikçiler",
    colSocialData: "Sosyal Veriler",
    colDate: "Tarih",
    colActions: "İşlemler",
    manage: "Yönet",
    socialDataManagement: "Sosyal Veri Yönetimi",
    statsAndActions: "İstatistikler ve İşlemler",
    likes: "Beğeni",
    views: "Görüntülenme",
    comments: "Yorum",
    resetViews: "Görüntülenme Sayısını Sıfırla",
    resetLikes: "Tüm Beğenileri Sil",
    commentsCount: (n) => `Yorumlar (${n})`,
    noComments: "Henüz yorum bulunmuyor.",
    fillRequired: "Lütfen tüm zorunlu alanları doldurun!",
    projectUpdated: "Proje başarıyla güncellendi!",
    projectAdded: "Proje başarıyla eklendi!",
    saveError: (editing) =>
      editing
        ? "Proje güncellenirken bir hata oluştu!"
        : "Proje eklenirken bir hata oluştu!",
    loadError: "Projeler yüklenirken bir hata oluştu!",
    confirmDeleteProject: (title) =>
      `"${title}" projesini silmek istediğinizden emin misiniz?`,
    projectDeleted: "Proje başarıyla silindi!",
    deleteError: "Proje silinirken bir hata oluştu!",
    confirmResetViews:
      "Görüntülenme sayısını sıfırlamak istediğinizden emin misiniz?",
    viewsReset: "Görüntülenme sayısı sıfırlandı!",
    viewsResetError: "Görüntülenme sayısı sıfırlanırken bir hata oluştu!",
    confirmResetLikes: "Tüm beğenileri silmek istediğinizden emin misiniz?",
    likesReset: "Tüm beğeniler silindi!",
    likesResetError: "Beğeniler silinirken bir hata oluştu!",
    confirmDeleteComment: "Bu yorumu silmek istediğinizden emin misiniz?",
    commentDeleted: "Yorum silindi!",
    commentDeleteError: "Yorum silinirken bir hata oluştu!",
  },
  en: {
    pageTitle: "Projects Management",
    pageSubtitle: "View and manage all projects",
    adminPanel: "← Admin Panel",
    projectsPage: "Projects Page",
    newProject: "Add New Project",
    statsTitle: "Statistics",
    totalProjects: "Total Projects",
    collaborativeProjects: "Collaborative Projects",
    githubLinked: "GitHub Linked",
    editProject: "Edit Project",
    projectTitle: "Project Title *",
    projectTitlePlaceholder: "Enter the project title",
    englishTitle: "English Project Title",
    englishTitlePlaceholder: "Enter the English project title",
    description: "Description *",
    descriptionPlaceholder: "Write a short description about the project",
    englishDescription: "English Description",
    englishDescriptionPlaceholder:
      "Write a short English description for the project",
    githubLink: "GitHub Link",
    projectImage: "Project Image",
    currentImage: "Current image:",
    currentImageAlt: "Current project image",
    imageReplaceNote:
      "If you select a new image, the current image will be replaced.",
    collaborators: "Collaborators",
    collaboratorsPlaceholder: "Search and add by user email...",
    selectedCollaborators: "Selected collaborators:",
    projectStatus: "Project Status",
    statusActive: "Active",
    statusCompleted: "Completed",
    statusPaused: "Paused",
    archiveProject: "Archive Project",
    updating: "Updating...",
    adding: "Adding...",
    updateProjectBtn: "Update Project",
    addProjectBtn: "Add Project",
    allProjects: (n) => `All Projects (${n})`,
    noProjects: "No projects yet.",
    addFirstProject: "Add the First Project",
    colProject: "Project",
    colCollaborators: "Collaborators",
    colSocialData: "Social Data",
    colDate: "Date",
    colActions: "Actions",
    manage: "Manage",
    socialDataManagement: "Social Data Management",
    statsAndActions: "Statistics and Actions",
    likes: "Likes",
    views: "Views",
    comments: "Comments",
    resetViews: "Reset View Count",
    resetLikes: "Delete All Likes",
    commentsCount: (n) => `Comments (${n})`,
    noComments: "No comments yet.",
    fillRequired: "Please fill in all required fields!",
    projectUpdated: "Project updated successfully!",
    projectAdded: "Project added successfully!",
    saveError: (editing) =>
      editing
        ? "An error occurred while updating the project!"
        : "An error occurred while adding the project!",
    loadError: "An error occurred while loading projects!",
    confirmDeleteProject: (title) =>
      `Are you sure you want to delete the "${title}" project?`,
    projectDeleted: "Project deleted successfully!",
    deleteError: "An error occurred while deleting the project!",
    confirmResetViews: "Are you sure you want to reset the view count?",
    viewsReset: "View count reset!",
    viewsResetError: "An error occurred while resetting the view count!",
    confirmResetLikes: "Are you sure you want to delete all likes?",
    likesReset: "All likes deleted!",
    likesResetError: "An error occurred while deleting the likes!",
    confirmDeleteComment: "Are you sure you want to delete this comment?",
    commentDeleted: "Comment deleted!",
    commentDeleteError: "An error occurred while deleting the comment!",
  },
};

export default function AdminProjectsPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
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
        toast.error(copy.loadError);
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
      toast.error(copy.fillRequired);
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
        toast.success(copy.projectUpdated);
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
        toast.success(copy.projectAdded);
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
      toast.error(copy.saveError(!!editingProject));
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
    if (window.confirm(copy.confirmDeleteProject(projectTitle))) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
        setProjects(prev => prev.filter(project => project.id !== projectId));
        toast.success(copy.projectDeleted);
      } catch (error) {
        logger.error("Error deleting project:", error);
        toast.error(copy.deleteError);
      }
    }
  };

  const handleManageSocial = (project) => {
    setSelectedProject(project);
    setShowSocialModal(true);
  };

  const handleResetViews = async (projectId) => {
    if (window.confirm(copy.confirmResetViews)) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          views: 0
        });
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, views: 0 } : p
        ));
        setSelectedProject(prev => ({ ...prev, views: 0 }));
        toast.success(copy.viewsReset);
      } catch (error) {
        logger.error("Error resetting views:", error);
        toast.error(copy.viewsResetError);
      }
    }
  };

  const handleResetLikes = async (projectId) => {
    if (window.confirm(copy.confirmResetLikes)) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          likes: []
        });
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, likes: [] } : p
        ));
        setSelectedProject(prev => ({ ...prev, likes: [] }));
        toast.success(copy.likesReset);
      } catch (error) {
        logger.error("Error resetting likes:", error);
        toast.error(copy.likesResetError);
      }
    }
  };

  const handleDeleteComment = async (projectId, commentId) => {
    if (window.confirm(copy.confirmDeleteComment)) {
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
        toast.success(copy.commentDeleted);
      } catch (error) {
        logger.error("Error deleting comment:", error);
        toast.error(copy.commentDeleteError);
      }
    }
  };

  if (loading || loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-200">{a.loading}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">{a.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
              {copy.pageTitle}
            </h1>
            <p className="text-gray-300 mt-1">
              {copy.pageSubtitle}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {copy.adminPanel}
            </Link>
            <Link
              href="/projects"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {copy.projectsPage}
            </Link>
            <button
              onClick={() => showAddForm ? handleCancelEdit() : setShowAddForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              {showAddForm ? a.cancel : copy.newProject}
            </button>
          </div>
        </div>

        {/* Projects Stats */}
        <div className="bg-gray-800/70 backdrop-blur-sm shadow-md rounded-lg p-6 mb-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">
            {copy.statsTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700/50">
              <h3 className="text-lg font-medium text-blue-200">{copy.totalProjects}</h3>
              <p className="text-2xl font-bold text-blue-400">{projects.length}</p>
            </div>
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/50">
              <h3 className="text-lg font-medium text-green-200">{copy.collaborativeProjects}</h3>
              <p className="text-2xl font-bold text-green-400">
                {projects.filter(p => p.collaborators && p.collaborators.length > 0).length}
              </p>
            </div>
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-700/50">
              <h3 className="text-lg font-medium text-purple-200">{copy.githubLinked}</h3>
              <p className="text-2xl font-bold text-purple-400">
                {projects.filter(p => p.githubLink).length}
              </p>
            </div>
          </div>
        </div>

        {/* Add Project Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/70 backdrop-blur-sm shadow-md rounded-lg p-6 mb-6 border border-gray-700/50"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-200">
                {editingProject ? copy.editProject : copy.newProject}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {copy.projectTitle}
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={copy.projectTitlePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {copy.englishTitle}
                  </label>
                  <input
                    type="text"
                    name="titleEn"
                    value={formData.titleEn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={copy.englishTitlePlaceholder}
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {copy.description}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={copy.descriptionPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {copy.englishDescription}
                  </label>
                  <textarea
                    name="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={copy.englishDescriptionPlaceholder}
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {copy.githubLink}
                  </label>
                  <input
                    type="url"
                    name="githubLink"
                    value={formData.githubLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://github.com/username/project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {copy.projectImage}
                  </label>
                  {editingProject?.imageUrl && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-300 mb-2">{copy.currentImage}</p>
                      <img
                        src={editingProject.imageUrl}
                        alt={copy.currentImageAlt}
                        className="w-32 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,image/heic,image/heif"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editingProject?.imageUrl && (
                    <p className="text-xs text-gray-400 mt-1">
                      {copy.imageReplaceNote}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    {copy.collaborators}
                  </label>
                  <UserMentionInput
                    onUserSelect={handleUserSelect}
                    selectedUsers={formData.collaborators}
                    placeholder={copy.collaboratorsPlaceholder}
                  />
                  
                  {/* Selected Collaborators */}
                  {formData.collaborators.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-300">{copy.selectedCollaborators}</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.collaborators.map((collab) => (
                          <div
                            key={collab.uid}
                            className="flex items-center gap-2 bg-blue-900/30 text-blue-200 px-3 py-1 rounded-full text-sm border border-blue-700/50"
                          >
                            <img
                              src={collab.photoURL || "/logo.svg"}
                              alt={collab.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span>{collab.name || collab.email}</span>
                            <button
                              type="button"
                              onClick={() => removeCollaborator(collab.uid)}
                              className="ml-1 text-blue-300 hover:text-blue-100"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      {copy.projectStatus}
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">{copy.statusActive}</option>
                      <option value="completed">{copy.statusCompleted}</option>
                      <option value="paused">{copy.statusPaused}</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
                      <input
                        type="checkbox"
                        name="archived"
                        checked={formData.archived}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          archived: e.target.checked
                        }))}
                        className="w-4 h-4 text-blue-400 bg-gray-900 border-gray-500 rounded focus:ring-blue-500"
                      />
                      {copy.archiveProject}
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ?
                      (editingProject ? copy.updating : copy.adding) :
                      (editingProject ? copy.updateProjectBtn : copy.addProjectBtn)
                    }
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    {a.cancel}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Table */}
        <div className="bg-gray-800/70 backdrop-blur-sm shadow-md rounded-lg overflow-hidden border border-gray-700/50">
          <div className="px-6 py-4 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-gray-200">
              {copy.allProjects(projects.length)}
            </h2>
          </div>
          
          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-lg">{copy.noProjects}</p>
              <Link
                href="/projects"
                className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {copy.addFirstProject}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {copy.colProject}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {copy.colCollaborators}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {copy.colSocialData}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {copy.colDate}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {copy.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                  {projects.map((project) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-700/60"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {project.imageUrl && (
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-100">
                              {project.title}
                            </div>
                            <div className="text-sm text-gray-400 max-w-xs truncate">
                              {project.description}
                            </div>
                            {project.githubLink && (
                              <a
                                href={project.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-800"
                              >
                                GitHub ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {project.collaborators && project.collaborators.length > 0 ? (
                            project.collaborators.slice(0, 3).map((collab, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-blue-900/30 px-2 py-1 rounded-full text-xs border border-blue-700/50"
                              >
                                <img
                                  src={collab.photoURL || "/logo.svg"}
                                  alt={collab.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-blue-200">
                                  {collab.name?.split(' ')[0] || collab.email.split('@')[0]}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                          {project.collaborators && project.collaborators.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{project.collaborators.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-xs text-gray-300">
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                              <span>{project.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 6h-2l-9-4-9 4v2h2l9-4 9 4v2zm-9 5.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              <span>{project.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
                              </svg>
                              <span>{project.comments?.length || 0}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleManageSocial(project)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition-colors"
                          >
                            {copy.manage}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {project.createdAt ? (
                          new Date(project.createdAt.toDate()).toLocaleDateString(locale === "en" ? 'en-US' : 'tr-TR')
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-blue-400 hover:text-blue-900 transition-colors"
                          >
                            {a.edit}
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.title)}
                            className="text-red-400 hover:text-red-900 transition-colors"
                          >
                            {a.delete}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Social Data Management Modal */}
      <AnimatePresence>
        {showSocialModal && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSocialModal(false)}
            style={{ overscrollBehavior: 'contain' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              style={{ overscrollBehavior: 'contain' }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-600">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-100">
                      {copy.socialDataManagement}
                    </h3>
                    <p className="text-gray-300 mt-1">{selectedProject.title}</p>
                  </div>
                  <button
                    onClick={() => setShowSocialModal(false)}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div 
                className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
                style={{ 
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Stats and Actions */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-100 mb-4">{copy.statsAndActions}</h4>
                      
                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-red-900/30 p-4 rounded-lg text-center border border-red-700/50">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </div>
                          <p className="text-2xl font-bold text-red-400">{selectedProject.likes?.length || 0}</p>
                          <p className="text-xs text-red-300">{copy.likes}</p>
                        </div>
                        
                        <div className="bg-blue-900/30 p-4 rounded-lg text-center border border-blue-700/50">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 6h-2l-9-4-9 4v2h2l9-4 9 4v2zm-9 5.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </div>
                          <p className="text-2xl font-bold text-blue-400">{selectedProject.views || 0}</p>
                          <p className="text-xs text-blue-300">{copy.views}</p>
                        </div>
                        
                        <div className="bg-green-900/30 p-4 rounded-lg text-center border border-green-700/50">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
                            </svg>
                          </div>
                          <p className="text-2xl font-bold text-green-400">{selectedProject.comments?.length || 0}</p>
                          <p className="text-xs text-green-300">{copy.comments}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => handleResetViews(selectedProject.id)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {copy.resetViews}
                        </button>
                        
                        <button
                          onClick={() => handleResetLikes(selectedProject.id)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {copy.resetLikes}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments Management */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-100 mb-4">{copy.commentsCount(selectedProject.comments?.length || 0)}</h4>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProject.comments && selectedProject.comments.length > 0 ? (
                        selectedProject.comments
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((comment) => (
                          <div key={comment.id} className="bg-gray-700/60 p-4 rounded-lg border border-gray-600/50">
                            <div className="flex items-start gap-3">
                              <img
                                src={comment.userPhoto || "/logo.svg"}
                                alt={comment.userName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-gray-100 text-sm">{comment.userName}</p>
                                    <p className="text-xs text-gray-400">
                                      {new Date(comment.createdAt).toLocaleDateString(locale === "en" ? 'en-US' : 'tr-TR', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteComment(selectedProject.id, comment.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed">{comment.text}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">{copy.noComments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-600">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSocialModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {a.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
