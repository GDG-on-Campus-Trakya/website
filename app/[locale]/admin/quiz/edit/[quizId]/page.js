"use client";
import { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
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
import { Check, Download, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input, fieldClasses } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Section } from "@/components/ui/page";

// Answer colours are data: red, blue, yellow, green in option order
const OPTION_MARKS = ["bg-mark-red", "bg-mark-blue", "bg-mark-yellow", "bg-mark-green"];

export default function EditQuizPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId;
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
  const [loadingQuiz, setLoadingQuiz] = useState(true);
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

  useEffect(() => {
    if (userRole && quizId) {
      loadQuiz();
    }
  }, [userRole, quizId]);

  const loadQuiz = async () => {
    try {
      setLoadingQuiz(true);
      const quizRef = doc(db, "quizzes", quizId);
      const quizDoc = await getDoc(quizRef);

      if (!quizDoc.exists()) {
        toast.error("Quiz bulunamadı!");
        router.push("/admin/quiz/manage");
        return;
      }

      const quizData = quizDoc.data();
      setQuizTitle(quizData.title || "");
      setQuizDescription(quizData.description || "");
      setQuizCategory(quizData.category || "Genel");
      setGameMode(quizData.gameMode || "classic");

      if (quizData.questions && quizData.questions.length > 0) {
        setQuestions(
          quizData.questions.map((q) => ({
            question: q.question || "",
            options: q.options || ["", "", "", ""],
            correctAnswer: q.correctAnswer || 0,
            timeLimit: q.timeLimit || 20,
            points: q.points || 1000,
            imageUrl: q.imageUrl || null,
            imageFile: null
          }))
        );
      }
    } catch (error) {
      logger.error("Error loading quiz:", error);
      toast.error("Quiz yüklenirken hata oluştu!");
    } finally {
      setLoadingQuiz(false);
    }
  };

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
      // Upload new images if any
      const questionsWithImages = await Promise.all(
        questions.map(async (q, index) => {
          let imageUrl = q.imageUrl;

          // If there's a new image file, upload it
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
        questionCount: questionsWithImages.length,
        questions: questionsWithImages,
        updatedAt: Timestamp.now(),
        updatedBy: user.email,
        updatedByName: user.displayName || user.email
      };

      const quizRef = doc(db, "quizzes", quizId);
      await updateDoc(quizRef, quizData);
      toast.success("Quiz başarıyla güncellendi!");

      setTimeout(() => {
        router.push("/admin/quiz/manage");
      }, 1500);
    } catch (error) {
      logger.error("Error updating quiz:", error);
      toast.error("Quiz güncellenirken hata oluştu!");
    } finally {
      setUploading(false);
    }
  };

  if (loading || loadingQuiz) {
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
        title="Quiz Düzenle"
        description="Quiz'i düzenleyin ve güncelleyin"
        actions={
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleJSONImport}
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload aria-hidden="true" />
              JSON Import
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={exportToJSON}
              disabled={!quizTitle || questions.length === 0}
            >
              <Download aria-hidden="true" />
              JSON Export
            </Button>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {/* Quiz Info */}
        <Section title="Quiz Bilgileri">
          <div className="space-y-2">
            <Field id="quiz-title" label="Başlık *">
              <Input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Quiz başlığını girin"
                required
              />
            </Field>

            <Field id="quiz-description" label="Açıklama">
              <Textarea
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Quiz açıklaması (opsiyonel)"
                rows="3"
              />
            </Field>

            <div className="grid gap-x-6 md:grid-cols-2">
              <Field id="quiz-category" label="Kategori">
                <select
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value)}
                  className={cn(fieldClasses, "h-control")}
                >
                  <option value="Genel">Genel</option>
                  <option value="Teknoloji">Teknoloji</option>
                  <option value="Programlama">Programlama</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Bilim">Bilim</option>
                  <option value="Tarih">Tarih</option>
                  <option value="Eğlence">Eğlence</option>
                </select>
              </Field>

              <Field
                id="quiz-game-mode"
                label="Oyun Modu"
                help={
                  gameMode === "kahoot"
                    ? "Her soru sonunda en hızlı doğru cevap veren kazanan olarak gösterilir. Final sıralaması yoktur."
                    : "Oyun sonunda tüm oyuncuların sıralaması gösterilir."
                }
              >
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  className={cn(fieldClasses, "h-control")}
                >
                  <option value="classic">Klasik (Final Sıralaması ile)</option>
                  <option value="kahoot">Kahoot Modu (Her soruda kazanan gösterilir)</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* Questions */}
        {questions.map((q, qIndex) => (
          <Section
            key={qIndex}
            title={`Soru ${qIndex + 1}`}
            action={
              questions.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeQuestion(qIndex)}
                >
                  Sil
                </Button>
              )
            }
          >
            <div className="space-y-2">
              {/* Image Upload */}
              <div className="flex flex-col gap-1.5 pb-2">
                <Label htmlFor={`q${qIndex}-image`}>Soru Görseli (Opsiyonel)</Label>
                {q.imageUrl ? (
                  <div className="relative max-w-md">
                    <img
                      src={q.imageUrl}
                      alt="Question"
                      className="aspect-[16/9] w-full rounded border border-rule object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(qIndex)}
                      className="absolute right-2 top-2"
                    >
                      Kaldır
                    </Button>
                  </div>
                ) : (
                  <>
                    <input
                      id={`q${qIndex}-image`}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleImageSelect(qIndex, e.target.files[0])}
                      disabled={currentImageUpload === qIndex}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:h-9 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-brand-hover"
                    />
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG veya WebP • Max 10MB • Otomatik &lt;100KB sıkıştırma
                    </p>
                  </>
                )}
                {currentImageUpload === qIndex && (
                  <p className="text-sm text-ink-2">Sıkıştırılıyor...</p>
                )}
              </div>

              <Field id={`q${qIndex}-question`} label="Soru Metni *">
                <Input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  placeholder="Soruyu girin"
                  required
                />
              </Field>

              <fieldset className="min-w-0">
                <legend className="mb-1.5 text-sm font-medium leading-none">
                  Seçenekler * (2-4 seçenek)
                </legend>
                <ul className="grid gap-x-6 gap-y-3 md:grid-cols-2">
                  {q.options.map((opt, oIndex) => {
                    const isCorrect = q.correctAnswer === oIndex;
                    return (
                      <li key={oIndex} className="flex items-center gap-2">
                        <span
                          className={cn("h-3 w-3 shrink-0 rounded-sm", OPTION_MARKS[oIndex])}
                          aria-hidden="true"
                        />
                        <div className="relative min-w-0 flex-1">
                          <Input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className={cn(isCorrect && "border-success pr-20")}
                            placeholder={`Seçenek ${oIndex + 1}`}
                            aria-label={`Seçenek ${oIndex + 1}`}
                            required
                          />
                          {isCorrect && (
                            <Badge
                              variant="success"
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 bg-background"
                            >
                              Doğru
                            </Badge>
                          )}
                        </div>

                        {/* Mark Correct Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                          aria-pressed={isCorrect}
                          className={cn(
                            "shrink-0",
                            isCorrect
                              ? "border-success text-success"
                              : "border-input text-muted-foreground"
                          )}
                          title="Doğru cevap olarak işaretle"
                          aria-label="Doğru cevap olarak işaretle"
                        >
                          <Check aria-hidden="true" />
                        </Button>

                        {/* Remove Option Button (only if > 2 options) */}
                        {q.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="shrink-0 text-error"
                            title="Seçeneği kaldır"
                            aria-label="Seçeneği kaldır"
                          >
                            <X aria-hidden="true" />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Add Option Button */}
                {q.options.length < 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(qIndex)}
                    className="mt-3"
                  >
                    + Seçenek Ekle
                  </Button>
                )}

                <p className="mt-2 text-sm text-muted-foreground">
                  Doğru cevabı seçmek için sağdaki butona tıklayın. En az 2, en fazla 4 seçenek ekleyebilirsiniz.
                </p>
              </fieldset>

              <div className="grid grid-cols-2 gap-x-4 pt-2 sm:gap-x-6">
                <Field id={`q${qIndex}-time`} label="Süre (saniye) *">
                  <Input
                    type="number"
                    value={q.timeLimit}
                    onChange={(e) => updateQuestion(qIndex, "timeLimit", parseInt(e.target.value))}
                    className="tabular-nums"
                    min="5"
                    max="120"
                    required
                  />
                </Field>
                <Field id={`q${qIndex}-points`} label="Puan">
                  <Input
                    type="number"
                    value={q.points}
                    onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                    className="tabular-nums"
                    min="100"
                    max="2000"
                    step="100"
                    required
                  />
                </Field>
              </div>
            </div>
          </Section>
        ))}

        {/* Add Question Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          className="mt-10 w-full border-dashed"
        >
          + Soru Ekle
        </Button>

        {/* Submit Buttons */}
        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/quiz/manage")}
            disabled={uploading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Güncelleniyor..." : "Quiz Güncelle"}
          </Button>
        </div>
      </form>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="light"
      />
    </div>
  );
}
