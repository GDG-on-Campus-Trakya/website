"use client";
import { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import {
  compressImage,
  uploadCompressedImage,
  validateImageFile
} from "@/utils/imageUtils";

export default function CreateQuizPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizCategory, setQuizCategory] = useState("Genel");
  const [gameMode, setGameMode] = useState("classic");
  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", ""],
      correctAnswer: 0,
      timeLimit: 20,
      points: 1000,
      imageUrl: null,
      imageFile: null
    }
  ]);
  const [uploading, setUploading] = useState(false);
  const [currentImageUpload, setCurrentImageUpload] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      const role = await checkUserRole(user.email);
      if (role !== ROLES.ADMIN) {
        toast.error("Bu sayfaya erişim yetkiniz yok!");
        router.push("/admin");
        return;
      }

      setUserRole(role);
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", ""],
        correctAnswer: 0,
        timeLimit: 20,
        points: 1000,
        imageUrl: null,
        imageFile: null
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error("En az 1 soru olmalı!");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length >= 4) {
      toast.error("Maksimum 4 seçenek ekleyebilirsiniz!");
      return;
    }
    newQuestions[qIndex].options.push("");
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 2) {
      toast.error("En az 2 seçenek olmalı!");
      return;
    }

    // Critical: Handle correctAnswer index adjustments
    if (newQuestions[qIndex].correctAnswer === oIndex) {
      // Removing the correct answer - reset to first option
      newQuestions[qIndex].correctAnswer = 0;
      toast.warning("Doğru cevap ilk seçenek olarak ayarlandı!");
    } else if (newQuestions[qIndex].correctAnswer > oIndex) {
      // Removing option before correct answer - decrement index
      newQuestions[qIndex].correctAnswer--;
    }

    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const handleImageSelect = async (qIndex, file) => {
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, true);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setCurrentImageUpload(qIndex);

    try {
      // Compress image
      const compressedBlob = await compressImage(file, 100);
      const compressedSizeKB = (compressedBlob.size / 1024).toFixed(2);

      toast.success(`Resim sıkıştırıldı: ${compressedSizeKB} KB`);

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedBlob);

      // Store compressed blob
      const newQuestions = [...questions];
      newQuestions[qIndex].imageFile = compressedBlob;
      newQuestions[qIndex].imageUrl = previewUrl;
      setQuestions(newQuestions);
    } catch (error) {
      logger.error("Image compression error:", error);
      toast.error("Resim sıkıştırma hatası!");
    } finally {
      setCurrentImageUpload(null);
    }
  };

  const removeImage = (qIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].imageUrl && newQuestions[qIndex].imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newQuestions[qIndex].imageUrl);
    }
    newQuestions[qIndex].imageUrl = null;
    newQuestions[qIndex].imageFile = null;
    setQuestions(newQuestions);
  };

  const handleJSONImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        // Validate JSON structure
        if (!json.title) {
          toast.error("JSON'da 'title' alanı eksik!");
          return;
        }

        if (!json.questions || !Array.isArray(json.questions)) {
          toast.error("JSON'da 'questions' dizisi eksik!");
          return;
        }

        // Validate each question
        for (let i = 0; i < json.questions.length; i++) {
          const q = json.questions[i];
          if (!q.question || !q.options || q.options.length < 2 || q.options.length > 4) {
            toast.error(`Soru ${i + 1} geçersiz format! (2-4 seçenek gerekli)`);
            return;
          }
          if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
            toast.error(`Soru ${i + 1}: correctAnswer 0-${q.options.length - 1} arası olmalı!`);
            return;
          }
        }

        // Import data
        setQuizTitle(json.title);
        setQuizDescription(json.description || "");
        setQuizCategory(json.category || "Genel");
        setGameMode(json.gameMode || "classic");

        setQuestions(
          json.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            timeLimit: q.timeLimit || 20,
            points: q.points || 1000,
            imageUrl: null,
            imageFile: null
          }))
        );

        toast.success(`${json.questions.length} soru başarıyla yüklendi!`);
      } catch (error) {
        logger.error("JSON parse error:", error);
        toast.error("Geçersiz JSON formatı!");
      }
    };

    reader.readAsText(file);
    event.target.value = null; // Reset input
  };

  const exportToJSON = () => {
    const exportData = {
      title: quizTitle,
      description: quizDescription,
      category: quizCategory,
      gameMode: gameMode,
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        timeLimit: q.timeLimit,
        points: q.points
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quizTitle || "quiz"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON export tamamlandı!");
  };

  const validateQuiz = () => {
    if (!quizTitle.trim()) {
      toast.error("Quiz başlığı gerekli!");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`Soru ${i + 1}: Soru metni gerekli!`);
        return false;
      }

      // Validate option count range
      if (q.options.length < 2 || q.options.length > 4) {
        toast.error(`Soru ${i + 1}: 2-4 arası seçenek olmalı!`);
        return false;
      }

      const emptyOptions = q.options.filter((opt) => !opt.trim());
      if (emptyOptions.length > 0) {
        toast.error(`Soru ${i + 1}: Tüm seçenekler doldurulmalı!`);
        return false;
      }

      // Validate correctAnswer is within bounds
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        toast.error(`Soru ${i + 1}: Geçersiz doğru cevap indeksi!`);
        return false;
      }

      if (q.timeLimit < 5 || q.timeLimit > 120) {
        toast.error(`Soru ${i + 1}: Süre 5-120 saniye arasında olmalı!`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateQuiz()) return;

    setUploading(true);

    try {
      // Upload images first
      const questionsWithImages = await Promise.all(
        questions.map(async (q, index) => {
          let imageUrl = null;

          if (q.imageFile) {
            const imagePath = `quiz-images/${Date.now()}_q${index}.jpg`;
            imageUrl = await uploadCompressedImage(q.imageFile, imagePath);
            toast.success(`Soru ${index + 1} resmi yüklendi!`);
          }

          return {
            id: `q${index + 1}`,
            question: q.question.trim(),
            options: q.options.map((opt) => opt.trim()),
            correctAnswer: q.correctAnswer,
            timeLimit: q.timeLimit,
            points: q.points,
            imageUrl
          };
        })
      );

      const quizData = {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        category: quizCategory,
        gameMode: gameMode,
        createdBy: user.email,
        createdByName: user.displayName || user.email,
        createdAt: Timestamp.now(),
        questionCount: questionsWithImages.length,
        questions: questionsWithImages,
        isActive: true,
        playCount: 0,
        lastPlayedAt: null
      };

      await addDoc(collection(db, "quizzes"), quizData);
      toast.success("Quiz başarıyla oluşturuldu!");

      setTimeout(() => {
        router.push("/admin/quiz/manage");
      }, 1500);
    } catch (error) {
      logger.error("Error creating quiz:", error);
      toast.error("Quiz oluşturulurken hata oluştu!");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">Yükleniyor...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Erişim Reddedildi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Quiz Oluştur</h1>
          <p className="text-sm sm:text-base text-gray-300">Yeni bir canlı quiz'i oluşturun</p>
        </div>

        {/* Import/Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleJSONImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            📥 JSON Import
          </button>
          <button
            type="button"
            onClick={exportToJSON}
            disabled={!quizTitle || questions.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            📤 JSON Export
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Quiz Info */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Quiz Bilgileri</h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-white mb-2 text-sm sm:text-base">Başlık *</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                  placeholder="Quiz başlığını girin"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm sm:text-base">Açıklama</label>
                <textarea
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                  placeholder="Quiz açıklaması (opsiyonel)"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm sm:text-base">Kategori</label>
                <select
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                >
                  <option value="Genel">Genel</option>
                  <option value="Teknoloji">Teknoloji</option>
                  <option value="Programlama">Programlama</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Bilim">Bilim</option>
                  <option value="Tarih">Tarih</option>
                  <option value="Eğlence">Eğlence</option>
                </select>
              </div>

              <div>
                <label className="block text-white mb-2 text-sm sm:text-base">Oyun Modu</label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                >
                  <option value="classic">Klasik (Final Sıralaması ile)</option>
                  <option value="kahoot">Kahoot Modu (Her soruda kazanan gösterilir)</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  {gameMode === "kahoot"
                    ? "Her soru sonunda en hızlı doğru cevap veren kazanan olarak gösterilir. Final sıralaması yoktur."
                    : "Oyun sonunda tüm oyuncuların sıralaması gösterilir."}
                </p>
              </div>
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">Soru {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="px-2 sm:px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Sil
                  </button>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-white mb-2 text-sm sm:text-base">Soru Görseli (Opsiyonel)</label>
                  {q.imageUrl ? (
                    <div className="relative">
                      <img
                        src={q.imageUrl}
                        alt="Question"
                        className="w-full max-w-md h-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(qIndex)}
                        className="absolute top-2 right-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        Kaldır
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleImageSelect(qIndex, e.target.files[0])}
                        disabled={currentImageUpload === qIndex}
                        className="block w-full text-sm text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-600 file:text-white
                          hover:file:bg-purple-700
                          file:cursor-pointer"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        JPG, PNG veya WebP • Max 10MB • Otomatik &lt;100KB sıkıştırma
                      </p>
                    </div>
                  )}
                  {currentImageUpload === qIndex && (
                    <p className="text-yellow-400 text-sm mt-2">Sıkıştırılıyor...</p>
                  )}
                </div>

                <div>
                  <label className="block text-white mb-2 text-sm sm:text-base">Soru Metni *</label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                    placeholder="Soruyu girin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 text-sm sm:text-base">
                    Seçenekler * (2-4 seçenek)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="relative flex gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className={`flex-1 px-3 sm:px-4 py-2 pr-10 bg-white/5 border rounded-lg text-white focus:outline-none text-sm sm:text-base ${
                            q.correctAnswer === oIndex
                              ? "border-green-500 bg-green-500/10"
                              : "border-white/20"
                          }`}
                          placeholder={`Seçenek ${oIndex + 1}`}
                          required
                        />

                        {/* Mark Correct Button */}
                        <button
                          type="button"
                          onClick={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-xs ${
                            q.correctAnswer === oIndex
                              ? "bg-green-500"
                              : "bg-white/20 hover:bg-white/30"
                          } transition-colors`}
                          title="Doğru cevap olarak işaretle"
                        >
                          {q.correctAnswer === oIndex && "✓"}
                        </button>

                        {/* Remove Option Button (only if > 2 options) */}
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="px-2 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors text-xs"
                            title="Seçeneği kaldır"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Option Button */}
                  {q.options.length < 4 && (
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      + Seçenek Ekle
                    </button>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Doğru cevabı seçmek için sağdaki butona tıklayın. En az 2, en fazla 4 seçenek ekleyebilirsiniz.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white mb-2 text-sm sm:text-base">Süre (saniye) *</label>
                    <input
                      type="number"
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(qIndex, "timeLimit", parseInt(e.target.value))
                      }
                      className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                      min="5"
                      max="120"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm sm:text-base">Puan</label>
                    <input
                      type="number"
                      value={q.points}
                      onChange={(e) =>
                        updateQuestion(qIndex, "points", parseInt(e.target.value))
                      }
                      className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                      min="100"
                      max="2000"
                      step="100"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-2 sm:py-3 bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            + Soru Ekle
          </button>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin/quiz/manage")}
              className="w-full sm:flex-1 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              disabled={uploading}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="w-full sm:flex-1 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 text-sm sm:text-base"
            >
              {uploading ? "Yükleniyor..." : "Quiz Oluştur"}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="dark"
      />
    </div>
  );
}
