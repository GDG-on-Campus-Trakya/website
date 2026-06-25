"use client";
import { useState, useRef } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "@/i18n/navigation";
import { auth, storage } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { toast, ToastContainer } from "react-toastify";
import { Upload, FileIcon, X, Copy, Check, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    backToAdmin: "Admin Paneline Dön",
    pageTitle: "Dosya Yükleme",
    pageSubtitle: "PDF, görsel ve diğer dosyaları yükleyin ve herkese açık URL alın",
    uploadFile: "Dosya Yükle",
    dropOrSelect: "Dosya seç veya sürükle",
    fileTypesHint: "PDF, görsel, video vb. (Max 50MB)",
    uploading: "Yükleniyor...",
    upload: "Yükle",
    uploadedFiles: (n) => `Yüklenen Dosyalar (${n})`,
    removeFromList: "Listeden kaldır",
    open: "Aç",
    info: "Bilgi",
    infoItem1: "Yüklenen dosyalar herkese açık URL ile erişilebilir olacaktır",
    infoItem2: "PDF dosyaları tarayıcıda doğrudan görüntülenebilir",
    infoItem3: "URL'yi kopyalayıp web sitesinde kullanabilirsiniz",
    infoItem4: "Dosyalar Firebase Storage'da saklanır",
    fileSizeError: "Dosya boyutu 50MB'dan küçük olmalıdır!",
    fileSelected: (name) => `Dosya seçildi: ${name}`,
    uploadError: "Dosya yüklenirken hata oluştu!",
    uploadSuccess: "Dosya başarıyla yüklendi!",
    getUrlError: "URL alınırken hata oluştu!",
    unexpectedError: "Beklenmeyen bir hata oluştu!",
    urlCopied: "URL kopyalandı!",
    urlCopyError: "URL kopyalanamadı!",
  },
  en: {
    backToAdmin: "Back to Admin Panel",
    pageTitle: "File Upload",
    pageSubtitle: "Upload PDFs, images and other files and get a public URL",
    uploadFile: "Upload File",
    dropOrSelect: "Select or drag a file",
    fileTypesHint: "PDF, image, video, etc. (Max 50MB)",
    uploading: "Uploading...",
    upload: "Upload",
    uploadedFiles: (n) => `Uploaded Files (${n})`,
    removeFromList: "Remove from list",
    open: "Open",
    info: "Info",
    infoItem1: "Uploaded files will be accessible via a public URL",
    infoItem2: "PDF files can be viewed directly in the browser",
    infoItem3: "You can copy the URL and use it on the website",
    infoItem4: "Files are stored in Firebase Storage",
    fileSizeError: "File size must be smaller than 50MB!",
    fileSelected: (name) => `File selected: ${name}`,
    uploadError: "An error occurred while uploading the file!",
    uploadSuccess: "File uploaded successfully!",
    getUrlError: "An error occurred while getting the URL!",
    unexpectedError: "An unexpected error occurred!",
    urlCopied: "URL copied!",
    urlCopyError: "Could not copy URL!",
  },
};

export default function FileUploadPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      const role = await checkUserRole(user.email);
      if (role !== ROLES.ADMIN) {
        router.push("/");
        return;
      }

      setUserRole(role);
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 50MB limit for general files
    if (file.size > 50 * 1024 * 1024) {
      toast.error(copy.fileSizeError);
      return;
    }

    setSelectedFile(file);
    toast.success(copy.fileSelected(file.name));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateFileName = (originalName) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
    return `${baseName}_${timestamp}_${randomStr}.${extension}`;
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileName = generateFileName(selectedFile.name);
      const storageRef = ref(storage, `public-files/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, selectedFile, {
        contentType: selectedFile.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          originalName: selectedFile.name,
        },
      });

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error("Upload error:", error);
          toast.error(copy.uploadError);
          setIsUploading(false);
        },
        async () => {
          try {
            let downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Create proxy URL through our API to avoid SSL issues with .firebasestorage.app
            const filePath = uploadTask.snapshot.ref.fullPath;
            const proxyURL = `/api/files/${filePath}`;

            // Get the base URL for full URL display
            const baseUrl = window.location.origin;
            const fullProxyURL = `${baseUrl}${proxyURL}`;

            const newFile = {
              id: Date.now(),
              name: selectedFile.name,
              url: fullProxyURL,
              path: uploadTask.snapshot.ref.fullPath,
              size: selectedFile.size,
              type: selectedFile.type,
              uploadedAt: new Date().toISOString(),
            };

            setUploadedFiles(prev => [newFile, ...prev]);
            toast.success(copy.uploadSuccess);
            clearFile();
          } catch (error) {
            console.error("Get URL error:", error);
            toast.error(copy.getUrlError);
          }
          setIsUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(copy.unexpectedError);
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(id);
      toast.success(copy.urlCopied);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error(copy.urlCopyError);
    }
  };

  const removeFromList = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-gray-300">{a.loading}</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-red-500">{a.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {copy.backToAdmin}
        </Link>

        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {copy.pageTitle}
          </h1>
          <p className="text-gray-300">{copy.pageSubtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload Section */}
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">{copy.uploadFile}</h2>

          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg mb-2">{copy.dropOrSelect}</p>
              <p className="text-gray-400 text-sm">{copy.fileTypesHint}</p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileIcon className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{copy.uploading}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{copy.uploading}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{copy.upload}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              {copy.uploadedFiles(uploadedFiles.length)}
            </h2>

            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-gray-700/50 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileIcon className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromList(file.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title={copy.removeFromList}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={file.url}
                      readOnly
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(file.url, file.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors flex items-center space-x-1"
                    >
                      {copiedUrl === file.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors text-sm"
                    >
                      {copy.open}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
          <h3 className="text-blue-400 font-medium mb-2">{copy.info}</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• {copy.infoItem1}</li>
            <li>• {copy.infoItem2}</li>
            <li>• {copy.infoItem3}</li>
            <li>• {copy.infoItem4}</li>
          </ul>
        </div>
      </div>

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
