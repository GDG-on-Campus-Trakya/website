"use client";
import { useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "@/i18n/navigation";
import { auth, storage } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { toast, ToastContainer } from "react-toastify";
import { Upload, FileIcon, X, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Section } from "@/components/ui/page";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";

export default function FileUploadPage() {
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
      toast.error("Dosya boyutu 50MB'dan küçük olmalıdır!");
      return;
    }

    setSelectedFile(file);
    toast.success(`Dosya seçildi: ${file.name}`);
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
          toast.error("Dosya yüklenirken hata oluştu!");
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
            toast.success("Dosya başarıyla yüklendi!");
            clearFile();
          } catch (error) {
            console.error("Get URL error:", error);
            toast.error("URL alınırken hata oluştu!");
          }
          setIsUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Beklenmeyen bir hata oluştu!");
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(id);
      toast.success("URL kopyalandı!");
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error("URL kopyalanamadı!");
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
    return <p className="py-12 text-ink-2">Yükleniyor...</p>;
  }

  if (!userRole) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        Erişim Reddedildi
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dosya Yükleme"
        description="PDF, görsel ve diğer dosyaları yükleyin ve herkese açık URL alın"
      />

      <div className="max-w-4xl">
        {/* Upload Section */}
        <Section title="Dosya Yükle">
          {!selectedFile ? (
            <div
              className="cursor-pointer rounded border border-dashed border-input p-8 text-center transition-colors duration-micro hover:bg-secondary"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="mb-1 text-md text-ink">Dosya seç veya sürükle</p>
              <p className="text-sm text-muted-foreground">PDF, görsel, video vb. (Max 50MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-y border-rule py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileIcon className="h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="break-words font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  disabled={isUploading}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Yükleniyor...</span>
                    <span className="font-outlier tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-sm bg-paper-3">
                    <div
                      className="h-2 rounded-sm bg-brand transition-[width] duration-short ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                loading={isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? (
                  <span>Yükleniyor...</span>
                ) : (
                  <>
                    <Upload aria-hidden="true" />
                    <span>Yükle</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </Section>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Section title={`Yüklenen Dosyalar (${uploadedFiles.length})`}>
            <ul>
              {uploadedFiles.map((file) => (
                <li key={file.id} className="space-y-3 border-b border-rule py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="break-words font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground tabular-nums">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromList(file.id)}
                      title="Listeden kaldır"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={file.url}
                      readOnly
                      className="min-w-0 flex-1 font-outlier text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(file.url, file.id)}
                    >
                      {copiedUrl === file.id ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                    </Button>
                    <Button asChild variant="outline">
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        Aç
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Info */}
        <Section title="Bilgi">
          <ul className="max-w-measure space-y-1 text-sm text-ink-2">
            <li>• Yüklenen dosyalar herkese açık URL ile erişilebilir olacaktır</li>
            <li>• PDF dosyaları tarayıcıda doğrudan görüntülenebilir</li>
            <li>• URL'yi kopyalayıp web sitesinde kullanabilirsiniz</li>
            <li>• Dosyalar Firebase Storage'da saklanır</li>
          </ul>
        </Section>
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
        theme="light"
      />
    </div>
  );
}
