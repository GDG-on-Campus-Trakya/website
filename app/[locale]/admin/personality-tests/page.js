"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "@/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Upload,
  X,
  Save,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { logger } from "@/utils/logger";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    adminPanel: "Admin Panel",
    pageTitle: "Kişilik Testleri Yönetimi",
    pageSubtitle: "Kişilik testlerini oluşturun, düzenleyin ve yönetin",
    searchPlaceholder: "Test ara...",
    jsonImport: "JSON Import",
    newTest: "Yeni Test",
    soruSuffix: (n) => `${n} soru`,
    orderLabel: (n) => `Sıra: ${n}`,
    edit: "Düzenle",
    delete: "Sil",
    noTestsFound: "Test bulunamadı",
    noTestsHint: 'Yeni bir test oluşturmak için "Yeni Test" butonuna tıklayın.',
    jsonImportTitle: "JSON Import",
    pasteJsonHint: "JSON dosyanızı yapıştırın. Format örneği:",
    jsonExample: `{
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
}`,
    jsonInputPlaceholder: "JSON verilerinizi buraya yapıştırın...",
    importBtn: "İçe Aktar",
    cancel: "İptal",
    editTestTitle: "Test Düzenle",
    newTestTitle: "Yeni Test Oluştur",
    basicInfo: "Temel Bilgiler",
    testTitle: "Test Başlığı *",
    description: "Açıklama *",
    order: "Sıra",
    coverImage: "Kapak Resmi",
    dragNewImage: "Yeni resim yüklemek için sürükle-bırak veya tıkla",
    dropHere: "Bırakın...",
    dragOrClick: "Resmi sürükle-bırak veya tıkla",
    coverImageFormats: "PNG, JPG, GIF (Max 5MB)",
    questions: (n) => `Sorular (${n})`,
    addQuestion: "Soru Ekle",
    questionLabel: (n) => `Soru ${n}`,
    questionTextPlaceholder: "Soru metni",
    options: (n) => `Seçenekler (${n})`,
    addOption: "Seçenek Ekle",
    optionTextPlaceholder: "Seçenek metni",
    pointsLabel: "Puanlar:",
    results: (n) => `Sonuçlar (${n})`,
    addResult: "Sonuç Ekle",
    titlePlaceholder: "Başlık",
    descriptionPlaceholder: "Açıklama",
    color: "Renk",
    resultImage: "Sonuç Resmi",
    dragNewImageShort: "Yeni resim için sürükle-bırak veya tıkla",
    resultImageFormats: "PNG, JPG, GIF",
    update: "Güncelle",
    create: "Oluştur",
    // Toasts / prompts
    loadTestsError: "Testler yüklenirken hata oluştu!",
    confirmDeleteTest: "Bu testi silmek istediğinizden emin misiniz?",
    deleteSuccess: "Test başarıyla silindi!",
    deleteError: "Test silinirken hata oluştu!",
    selectImageFile: "Lütfen bir resim dosyası seçin!",
    coverUploaded: "Kapak resmi yüklendi!",
    imageUploadError: "Resim yüklenirken hata oluştu!",
    resultUploaded: "Sonuç resmi yüklendi!",
    fillRequired: "Lütfen tüm zorunlu alanları doldurun!",
    testUpdated: "Test güncellendi!",
    testCreated: "Test oluşturuldu!",
    saveError: "Test kaydedilirken hata oluştu!",
    resultKeyPrompt: "Sonuç anahtarı girin (örn: gmail, youtube):",
    invalidJsonStructure:
      "Geçersiz JSON formatı! title, questions ve results alanları gerekli.",
    jsonImported: "JSON başarıyla içe aktarıldı! Görselleri yükleyebilirsiniz.",
    invalidJson: "Geçersiz JSON formatı!",
  },
  en: {
    adminPanel: "Admin Panel",
    pageTitle: "Personality Tests Management",
    pageSubtitle: "Create, edit and manage personality tests",
    searchPlaceholder: "Search test...",
    jsonImport: "JSON Import",
    newTest: "New Test",
    soruSuffix: (n) => `${n} questions`,
    orderLabel: (n) => `Order: ${n}`,
    edit: "Edit",
    delete: "Delete",
    noTestsFound: "No tests found",
    noTestsHint: 'Click the "New Test" button to create a new test.',
    jsonImportTitle: "JSON Import",
    pasteJsonHint: "Paste your JSON file. Format example:",
    jsonExample: `{
  "title": "Test Title",
  "description": "Test description",
  "order": 1,
  "questions": [
    {
      "question": "Question text?",
      "options": [
        {
          "text": "Option 1",
          "points": { "result1": 3, "result2": 1 }
        }
      ]
    }
  ],
  "results": {
    "result1": {
      "title": "Result Title",
      "description": "Result description",
      "color": "#FF0000",
      "traits": ["Trait 1", "Trait 2"]
    }
  }
}`,
    jsonInputPlaceholder: "Paste your JSON data here...",
    importBtn: "Import",
    cancel: "Cancel",
    editTestTitle: "Edit Test",
    newTestTitle: "Create New Test",
    basicInfo: "Basic Information",
    testTitle: "Test Title *",
    description: "Description *",
    order: "Order",
    coverImage: "Cover Image",
    dragNewImage: "Drag and drop or click to upload a new image",
    dropHere: "Drop it...",
    dragOrClick: "Drag and drop or click an image",
    coverImageFormats: "PNG, JPG, GIF (Max 5MB)",
    questions: (n) => `Questions (${n})`,
    addQuestion: "Add Question",
    questionLabel: (n) => `Question ${n}`,
    questionTextPlaceholder: "Question text",
    options: (n) => `Options (${n})`,
    addOption: "Add Option",
    optionTextPlaceholder: "Option text",
    pointsLabel: "Points:",
    results: (n) => `Results (${n})`,
    addResult: "Add Result",
    titlePlaceholder: "Title",
    descriptionPlaceholder: "Description",
    color: "Color",
    resultImage: "Result Image",
    dragNewImageShort: "Drag and drop or click for a new image",
    resultImageFormats: "PNG, JPG, GIF",
    update: "Update",
    create: "Create",
    // Toasts / prompts
    loadTestsError: "An error occurred while loading tests!",
    confirmDeleteTest: "Are you sure you want to delete this test?",
    deleteSuccess: "Test deleted successfully!",
    deleteError: "An error occurred while deleting the test!",
    selectImageFile: "Please select an image file!",
    coverUploaded: "Cover image uploaded!",
    imageUploadError: "An error occurred while uploading the image!",
    resultUploaded: "Result image uploaded!",
    fillRequired: "Please fill in all required fields!",
    testUpdated: "Test updated!",
    testCreated: "Test created!",
    saveError: "An error occurred while saving the test!",
    resultKeyPrompt: "Enter a result key (e.g. gmail, youtube):",
    invalidJsonStructure:
      "Invalid JSON format! The title, questions and results fields are required.",
    jsonImported: "JSON imported successfully! You can now upload images.",
    invalidJson: "Invalid JSON format!",
  },
};

export default function AdminPersonalityTestsPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
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
      toast.error(copy.loadTestsError);
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
    if (!confirm(copy.confirmDeleteTest)) return;

    try {
      await deleteDoc(doc(db, "personality_tests", testId));
      toast.success(copy.deleteSuccess);
      loadTests();
    } catch (error) {
      logger.error("Error deleting test:", error);
      toast.error(copy.deleteError);
    }
  };

  const uploadCoverImage = async (file) => {
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error(copy.selectImageFile);
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
      toast.success(copy.coverUploaded);
    } catch (error) {
      logger.error("Error uploading cover image:", error);
      toast.error(copy.imageUploadError);
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
      toast.error(copy.selectImageFile);
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
      toast.success(copy.resultUploaded);
    } catch (error) {
      logger.error("Error uploading result image:", error);
      toast.error(copy.imageUploadError);
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
      toast.error(copy.fillRequired);
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
        toast.success(copy.testUpdated);
      } else {
        testData.createdAt = serverTimestamp();
        await addDoc(collection(db, "personality_tests"), testData);
        toast.success(copy.testCreated);
      }

      loadTests();
      handleFormClose();
    } catch (error) {
      logger.error("Error saving test:", error);
      toast.error(copy.saveError);
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
    const key = prompt(copy.resultKeyPrompt);
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
        toast.error(copy.invalidJsonStructure);
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
      toast.success(copy.jsonImported);
    } catch (error) {
      logger.error("JSON parse error:", error);
      toast.error(copy.invalidJson);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-gray-200">{a.loading}</p>
      </div>
    );
  }

  if (userRole !== ROLES.ADMIN) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">{a.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{copy.adminPanel}</span>
            </button>
            <div className="border-l border-gray-500 h-8"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                {copy.pageTitle}
              </h1>
              <p className="text-gray-300">
                {copy.pageSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/60 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Buttons */}
            <button
              onClick={() => setShowJsonImport(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 font-medium"
            >
              <Upload className="w-5 h-5" />
              <span>{copy.jsonImport}</span>
            </button>

            <button
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>{copy.newTest}</span>
            </button>
          </div>
        </div>

        {/* Tests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {test.imageUrl && (
                    <img
                      src={test.imageUrl}
                      alt={test.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-100 mb-2">
                      {test.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {test.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>{copy.soruSuffix(test.questionCount || 0)}</span>
                      <span>{copy.orderLabel(test.order)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(test)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>{copy.edit}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{copy.delete}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-800 rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    {copy.noTestsFound}
                  </h3>
                  <p className="text-gray-300">
                    {copy.noTestsHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* JSON Import Modal */}
        {showJsonImport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-100">
                  {copy.jsonImportTitle}
                </h2>
                <button
                  onClick={() => {
                    setShowJsonImport(false);
                    setJsonInput("");
                  }}
                  className="text-gray-400 hover:text-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <p className="text-gray-300 mb-4">
                  {copy.pasteJsonHint}
                </p>

                <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg mb-4 text-sm overflow-x-auto">
{copy.jsonExample}
                </pre>

                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={copy.jsonInputPlaceholder}
                  rows={15}
                  className="w-full px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
              </div>

              <div className="p-6 border-t border-gray-700 flex space-x-4">
                <button
                  onClick={handleJsonImport}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  <Upload className="w-5 h-5" />
                  <span>{copy.importBtn}</span>
                </button>
                <button
                  onClick={() => {
                    setShowJsonImport(false);
                    setJsonInput("");
                  }}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  {copy.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl my-8">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
                <h2 className="text-2xl font-bold text-gray-100">
                  {editingTest ? copy.editTestTitle : copy.newTestTitle}
                </h2>
                <button
                  onClick={handleFormClose}
                  className="text-gray-400 hover:text-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-100">
                    {copy.basicInfo}
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {copy.testTitle}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {copy.description}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {copy.order}
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {copy.coverImage}
                    </label>

                    {/* Drag and Drop Area */}
                    <div
                      onDrop={handleCoverDrop}
                      onDragOver={handleCoverDragOver}
                      onDragLeave={handleCoverDragLeave}
                      className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center transition-all
                        ${isDraggingCover
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 bg-gray-700/30'
                        }
                        ${uploadingCover ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
                      `}
                    >
                      {formData.imageUrl ? (
                        <div className="space-y-3">
                          <img
                            src={formData.imageUrl}
                            alt="Cover"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <p className="text-sm text-gray-400">
                            {copy.dragNewImage}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 mx-auto text-gray-400" />
                          <p className="text-gray-300 font-medium">
                            {isDraggingCover ? copy.dropHere : copy.dragOrClick}
                          </p>
                          <p className="text-sm text-gray-400">
                            {copy.coverImageFormats}
                          </p>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        disabled={uploadingCover}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      {uploadingCover && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-100">
                      {copy.questions(formData.questions.length)}
                    </h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{copy.addQuestion}</span>
                    </button>
                  </div>

                  {formData.questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="bg-gray-700 p-4 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-md font-semibold text-gray-100">
                          {copy.questionLabel(qIndex + 1)}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder={copy.questionTextPlaceholder}
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(qIndex, "question", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-gray-600 text-gray-100 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            {copy.options(question.options.length)}
                          </span>
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            {copy.addOption}
                          </button>
                        </div>

                        {question.options.map((option, oIndex) => (
                          <div
                            key={oIndex}
                            className="bg-gray-600 p-3 rounded space-y-2"
                          >
                            <div className="flex items-start space-x-2">
                              <input
                                type="text"
                                placeholder={copy.optionTextPlaceholder}
                                value={option.text}
                                onChange={(e) =>
                                  updateOption(qIndex, oIndex, "text", e.target.value)
                                }
                                className="flex-1 px-3 py-1 bg-gray-500 text-gray-100 border border-gray-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(qIndex, oIndex)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-400">
                              {copy.pointsLabel} {JSON.stringify(option.points)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-100">
                      {copy.results(Object.keys(formData.results).length)}
                    </h3>
                    <button
                      type="button"
                      onClick={addResult}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{copy.addResult}</span>
                    </button>
                  </div>

                  {Object.entries(formData.results).map(([key, result]) => (
                    <div
                      key={key}
                      className="bg-gray-700 p-4 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-md font-semibold text-gray-100">
                          {key}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeResult(key)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder={copy.titlePlaceholder}
                        value={result.title}
                        onChange={(e) =>
                          updateResult(key, "title", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-gray-600 text-gray-100 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <textarea
                        placeholder={copy.descriptionPlaceholder}
                        value={result.description}
                        onChange={(e) =>
                          updateResult(key, "description", e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2 bg-gray-600 text-gray-100 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            {copy.color}
                          </label>
                          <input
                            type="color"
                            value={result.color}
                            onChange={(e) =>
                              updateResult(key, "color", e.target.value)
                            }
                            className="w-full h-10 bg-gray-600 border border-gray-500 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Result Image Drag and Drop */}
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          {copy.resultImage}
                        </label>
                        <div
                          onDrop={(e) => handleResultDrop(e, key)}
                          onDragOver={(e) => handleResultDragOver(e, key)}
                          onDragLeave={handleResultDragLeave}
                          className={`
                            relative border-2 border-dashed rounded-lg p-4 text-center transition-all
                            ${draggingResultKey === key
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-600 bg-gray-700/30'
                            }
                            cursor-pointer hover:border-green-400
                          `}
                        >
                          {result.imageUrl ? (
                            <div className="space-y-2">
                              <img
                                src={result.imageUrl}
                                alt={result.title}
                                className="w-full h-32 object-cover rounded"
                              />
                              <p className="text-xs text-gray-400">
                                {copy.dragNewImageShort}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 py-4">
                              <Upload className="w-8 h-8 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-300">
                                {draggingResultKey === key ? copy.dropHere : copy.dragOrClick}
                              </p>
                              <p className="text-xs text-gray-400">
                                {copy.resultImageFormats}
                              </p>
                            </div>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleResultImageUpload(e, key)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingTest ? copy.update : copy.create}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFormClose}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    {copy.cancel}
                  </button>
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
          theme="dark"
        />
      </div>
    </div>
  );
}
