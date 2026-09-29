"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "@/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Search, Plus, Trash2, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/page";
import { logger } from "@/utils/logger";
import { checkUserRole, ROLES } from "@/utils/roleUtils";

export default function AdminPersonalityTestsPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    order: 1,
    questions: [],
    results: {},
  });
  const [coverImage, setCoverImage] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [draggingResultKey, setDraggingResultKey] = useState(null);

  // Check admin privileges
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

  // Load personality tests
  useEffect(() => {
    if (userRole === ROLES.ADMIN) {
      loadTests();
    }
  }, [userRole]);

  // Apply search
  useEffect(() => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      setFilteredTests(
        tests.filter(
          (test) =>
            test.title?.toLowerCase().includes(search) ||
            test.description?.toLowerCase().includes(search)
        )
      );
    } else {
      setFilteredTests(tests);
    }
  }, [tests, searchTerm]);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const testsRef = collection(db, "personality_tests");
      const snapshot = await getDocs(testsRef);
      const testsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      testsData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTests(testsData);
    } catch (error) {
      logger.error("Error loading tests:", error);
      toast.error("Testler yüklenirken hata oluştu!");
    }
    setIsLoading(false);
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      title: test.title || "",
      description: test.description || "",
      imageUrl: test.imageUrl || "",
      order: test.order || 1,
      questions: test.questions || [],
      results: test.results || {},
    });
    setShowForm(true);
  };

  const handleDelete = async (testId) => {
    if (!confirm("Bu testi silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteDoc(doc(db, "personality_tests", testId));
      toast.success("Test başarıyla silindi!");
      loadTests();
    } catch (error) {
      logger.error("Error deleting test:", error);
      toast.error("Test silinirken hata oluştu!");
    }
  };

  const uploadCoverImage = async (file) => {
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Lütfen bir resim dosyası seçin!");
      return;
    }

    setUploadingCover(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(
        storage,
        `personality_tests/covers/${timestamp}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData({ ...formData, imageUrl: url });
      toast.success("Kapak resmi yüklendi!");
    } catch (error) {
      logger.error("Error uploading cover image:", error);
      toast.error("Resim yüklenirken hata oluştu!");
    }
    setUploadingCover(false);
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    await uploadCoverImage(file);
  };

  const handleCoverDrop = async (e) => {
    e.preventDefault();
    setIsDraggingCover(false);

    const file = e.dataTransfer.files[0];
    await uploadCoverImage(file);
  };

  const handleCoverDragOver = (e) => {
    e.preventDefault();
    setIsDraggingCover(true);
  };

  const handleCoverDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingCover(false);
  };

  const uploadResultImage = async (file, resultKey) => {
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Lütfen bir resim dosyası seçin!");
      return;
    }

    try {
      const timestamp = Date.now();
      const storageRef = ref(
        storage,
        `personality_tests/results/${timestamp}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setFormData({
        ...formData,
        results: {
          ...formData.results,
          [resultKey]: {
            ...formData.results[resultKey],
            imageUrl: url,
          },
        },
      });
      toast.success("Sonuç resmi yüklendi!");
    } catch (error) {
      logger.error("Error uploading result image:", error);
      toast.error("Resim yüklenirken hata oluştu!");
    }
  };

  const handleResultImageUpload = async (e, resultKey) => {
    const file = e.target.files[0];
    await uploadResultImage(file, resultKey);
  };

  const handleResultDrop = async (e, resultKey) => {
    e.preventDefault();
    setDraggingResultKey(null);

    const file = e.dataTransfer.files[0];
    await uploadResultImage(file, resultKey);
  };

  const handleResultDragOver = (e, resultKey) => {
    e.preventDefault();
    setDraggingResultKey(resultKey);
  };

  const handleResultDragLeave = (e) => {
    e.preventDefault();
    setDraggingResultKey(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("Lütfen tüm zorunlu alanları doldurun!");
      return;
    }

    try {
      const testData = {
        ...formData,
        questionCount: formData.questions.length,
        updatedAt: serverTimestamp(),
      };

      if (editingTest) {
        await updateDoc(doc(db, "personality_tests", editingTest.id), testData);
        toast.success("Test güncellendi!");
      } else {
        testData.createdAt = serverTimestamp();
        await addDoc(collection(db, "personality_tests"), testData);
        toast.success("Test oluşturuldu!");
      }

      loadTests();
      handleFormClose();
    } catch (error) {
      logger.error("Error saving test:", error);
      toast.error("Test kaydedilirken hata oluştu!");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTest(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      order: 1,
      questions: [],
      results: {},
    });
    setCoverImage(null);
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: "",
          options: [],
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index][field] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push({
      text: "",
      points: {},
    });
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options = updatedQuestions[
      questionIndex
    ].options.filter((_, i) => i !== optionIndex);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex][field] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const addResult = () => {
    const key = prompt("Sonuç anahtarı girin (örn: gmail, youtube):");
    if (!key) return;

    setFormData({
      ...formData,
      results: {
        ...formData.results,
        [key]: {
          title: "",
          description: "",
          imageUrl: "",
          color: "#000000",
          traits: [],
        },
      },
    });
  };

  const removeResult = (key) => {
    const updatedResults = { ...formData.results };
    delete updatedResults[key];
    setFormData({ ...formData, results: updatedResults });
  };

  const updateResult = (key, field, value) => {
    setFormData({
      ...formData,
      results: {
        ...formData.results,
        [key]: {
          ...formData.results[key],
          [field]: value,
        },
      },
    });
  };

  const handleJsonImport = () => {
    try {
      const jsonData = JSON.parse(jsonInput);

      // Validate JSON structure
      if (!jsonData.title || !jsonData.questions || !jsonData.results) {
        toast.error("Geçersiz JSON formatı! title, questions ve results alanları gerekli.");
        return;
      }

      // Set form data from JSON
      setFormData({
        title: jsonData.title || "",
        description: jsonData.description || "",
        imageUrl: jsonData.imageUrl || "",
        order: jsonData.order || tests.length + 1,
        questions: jsonData.questions || [],
        results: jsonData.results || {},
      });

      setShowJsonImport(false);
      setShowForm(true);
      toast.success("JSON başarıyla içe aktarıldı! Görselleri yükleyebilirsiniz.");
    } catch (error) {
      logger.error("JSON parse error:", error);
      toast.error("Geçersiz JSON formatı!");
    }
  };

  if (loading) {
    return <p className="py-12 text-ink-2">Loading...</p>;
  }

  if (userRole !== ROLES.ADMIN) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        Access Denied
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Kişilik Testleri Yönetimi"
        description="Kişilik testlerini oluşturun, düzenleyin ve yönetin"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setShowJsonImport(true)}>
              <Upload aria-hidden="true" />
              JSON Import
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEditingTest(null);
                setFormData({
                  title: "",
                  description: "",
                  imageUrl: "",
                  order: tests.length + 1,
                  questions: [],
                  results: {},
                });
                setShowForm(true);
              }}
            >
              <Plus aria-hidden="true" />
              Yeni Test
            </Button>
          </>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          aria-label="Test ara..."
          placeholder="Test ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tests List */}
      {isLoading ? (
        <div className="space-y-3" role="status" aria-busy="true">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredTests.length > 0 ? (
        <ul className="border-t-2 border-ink">
          {filteredTests.map((test) => (
            <li
              key={test.id}
              className="flex flex-col gap-4 border-b border-rule py-5 sm:flex-row sm:items-start"
            >
              {test.imageUrl && (
                <img
                  src={test.imageUrl}
                  alt={test.title}
                  className="aspect-[16/9] w-full shrink-0 rounded object-cover sm:w-48"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-bold">
                  {test.title}
                </h3>
                <p className="mt-1 max-w-measure text-sm text-ink-2">
                  {test.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-outlier text-sm tabular-nums text-muted-foreground">
                  <span>{test.questionCount || 0} soru</span>
                  <span>Sıra: {test.order}</span>
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(test)}
                >
                  Düzenle
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(test.id)}
                >
                  Sil
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Test bulunamadı"
          description={'Yeni bir test oluşturmak için "Yeni Test" butonuna tıklayın.'}
        />
      )}

      {/* JSON Import Modal */}
      {showJsonImport && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4 animate-in fade-in-0 duration-short">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="json-import-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-rule bg-background text-foreground"
          >
            <div className="flex items-center justify-between gap-4 border-b border-rule p-4 sm:p-6">
              <h2 id="json-import-title" className="font-display text-2xl font-bold">
                JSON Import
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="İptal"
                onClick={() => {
                  setShowJsonImport(false);
                  setJsonInput("");
                }}
                className="-mr-2 shrink-0"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <p className="mb-4 text-ink-2">
                JSON dosyanızı yapıştırın. Format örneği:
              </p>

              <pre className="mb-4 overflow-x-auto rounded border border-rule bg-paper-2 p-4 font-mono text-sm text-ink-2">
{`{
  "title": "Test Başlığı",
  "description": "Test açıklaması",
  "order": 1,
  "questions": [
    {
      "question": "Soru metni?",
      "options": [
        {
          "text": "Seçenek 1",
          "points": { "result1": 3, "result2": 1 }
        }
      ]
    }
  ],
  "results": {
    "result1": {
      "title": "Sonuç Başlığı",
      "description": "Sonuç açıklaması",
      "color": "#FF0000",
      "traits": ["Özellik 1", "Özellik 2"]
    }
  }
}`}
              </pre>

              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                aria-label="JSON Import"
                placeholder="JSON verilerinizi buraya yapıştırın..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-rule p-4 sm:flex-row sm:p-6">
              <Button type="button" onClick={handleJsonImport}>
                <Upload aria-hidden="true" />
                İçe Aktar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowJsonImport(false);
                  setJsonInput("");
                }}
              >
                İptal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-modal overflow-y-auto bg-ink/60 p-4 animate-in fade-in-0 duration-short">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-form-title"
            className="mx-auto my-8 w-full max-w-4xl rounded-lg border border-rule bg-background text-foreground"
          >
            <div className="sticky top-0 z-raised flex items-center justify-between gap-4 rounded-t-lg border-b border-rule bg-background p-4 sm:p-6">
              <h2 id="test-form-title" className="font-display text-2xl font-bold">
                {editingTest ? "Test Düzenle" : "Yeni Test Oluştur"}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="İptal"
                onClick={handleFormClose}
                className="-mr-2 shrink-0"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 p-4 sm:p-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <h3 className="mb-2 font-display text-lg font-semibold">
                  Temel Bilgiler
                </h3>

                <Field id="test-title" label="Test Başlığı *">
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field id="test-description" label="Açıklama *">
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    required
                  />
                </Field>

                <Field id="test-order" label="Sıra" className="max-w-40">
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) })
                    }
                    className="font-outlier tabular-nums"
                    min={1}
                  />
                </Field>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="test-cover">Kapak Resmi</Label>

                  {/* Drag and Drop Area */}
                  <div
                    onDrop={handleCoverDrop}
                    onDragOver={handleCoverDragOver}
                    onDragLeave={handleCoverDragLeave}
                    className={cn(
                      "relative rounded border-2 border-dashed p-6 text-center transition-colors duration-micro",
                      isDraggingCover
                        ? "border-brand bg-paper-2"
                        : "border-input bg-background",
                      uploadingCover
                        ? "cursor-not-allowed opacity-55"
                        : "cursor-pointer hover:bg-secondary"
                    )}
                  >
                    {formData.imageUrl ? (
                      <div className="space-y-3">
                        <img
                          src={formData.imageUrl}
                          alt="Cover"
                          className="aspect-[16/9] w-full rounded object-cover"
                        />
                        <p className="text-sm text-muted-foreground">
                          Yeni resim yüklemek için sürükle-bırak veya tıkla
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <p className="font-medium">
                          {isDraggingCover ? 'Bırakın...' : 'Resmi sürükle-bırak veya tıkla'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, GIF (Max 5MB)
                        </p>
                      </div>
                    )}

                    <input
                      id="test-cover"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      disabled={uploadingCover}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />

                    {uploadingCover && (
                      <div className="absolute inset-0 flex items-center justify-center rounded bg-background/70">
                        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-4 border-t-2 border-ink pt-3">
                  <h3 className="font-display text-lg font-semibold">
                    Sorular ({formData.questions.length})
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus aria-hidden="true" />
                    Soru Ekle
                  </Button>
                </div>

                {formData.questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="space-y-3 border-b border-rule py-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-base font-semibold">
                        Soru {qIndex + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Sil"
                        onClick={() => removeQuestion(qIndex)}
                        className="-mr-2 text-error"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>

                    <Input
                      type="text"
                      aria-label="Soru metni"
                      placeholder="Soru metni"
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(qIndex, "question", e.target.value)
                      }
                    />

                    <div>
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <span className="text-sm text-ink-2">
                          Seçenekler ({question.options.length})
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(qIndex)}
                        >
                          Seçenek Ekle
                        </Button>
                      </div>

                      {question.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className="border-t border-rule py-3"
                        >
                          <div className="flex items-start gap-2">
                            <Input
                              type="text"
                              aria-label="Seçenek metni"
                              placeholder="Seçenek metni"
                              value={option.text}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, "text", e.target.value)
                              }
                              className="min-w-0 flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Sil"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="shrink-0 text-error"
                            >
                              <X aria-hidden="true" />
                            </Button>
                          </div>
                          <div className="mt-1 break-all font-outlier text-xs text-muted-foreground">
                            Puanlar: {JSON.stringify(option.points)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Results */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-4 border-t-2 border-ink pt-3">
                  <h3 className="font-display text-lg font-semibold">
                    Sonuçlar ({Object.keys(formData.results).length})
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addResult}>
                    <Plus aria-hidden="true" />
                    Sonuç Ekle
                  </Button>
                </div>

                {Object.entries(formData.results).map(([key, result]) => (
                  <div
                    key={key}
                    className="space-y-3 border-b border-rule py-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="min-w-0 break-words font-display text-base font-semibold">
                        {key}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Sil"
                        onClick={() => removeResult(key)}
                        className="-mr-2 shrink-0 text-error"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>

                    <Input
                      type="text"
                      aria-label="Başlık"
                      placeholder="Başlık"
                      value={result.title}
                      onChange={(e) =>
                        updateResult(key, "title", e.target.value)
                      }
                    />

                    <Textarea
                      aria-label="Açıklama"
                      placeholder="Açıklama"
                      value={result.description}
                      onChange={(e) =>
                        updateResult(key, "description", e.target.value)
                      }
                      rows={2}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Renk
                          <input
                            type="color"
                            value={result.color}
                            onChange={(e) =>
                              updateResult(key, "color", e.target.value)
                            }
                            className="mt-1.5 block h-control w-full cursor-pointer rounded border border-input bg-background p-1"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Result Image Drag and Drop */}
                    <div>
                      <p className="mb-1.5 text-sm font-medium leading-none">
                        Sonuç Resmi
                      </p>
                      <div
                        onDrop={(e) => handleResultDrop(e, key)}
                        onDragOver={(e) => handleResultDragOver(e, key)}
                        onDragLeave={handleResultDragLeave}
                        className={cn(
                          "relative cursor-pointer rounded border-2 border-dashed p-4 text-center transition-colors duration-micro hover:bg-secondary",
                          draggingResultKey === key
                            ? "border-brand bg-paper-2"
                            : "border-input bg-background"
                        )}
                      >
                        {result.imageUrl ? (
                          <div className="space-y-2">
                            <img
                              src={result.imageUrl}
                              alt={result.title}
                              className="aspect-[16/9] w-full rounded object-cover"
                            />
                            <p className="text-xs text-muted-foreground">
                              Yeni resim için sürükle-bırak veya tıkla
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 py-4">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <p className="text-sm">
                              {draggingResultKey === key ? 'Bırakın...' : 'Resmi sürükle-bırak veya tıkla'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, GIF
                            </p>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          aria-label="Sonuç Resmi"
                          onChange={(e) => handleResultImageUpload(e, key)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row">
                <Button type="submit">
                  {editingTest ? "Güncelle" : "Oluştur"}
                </Button>
                <Button type="button" variant="outline" onClick={handleFormClose}>
                  İptal
                </Button>
              </div>
            </form>
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
