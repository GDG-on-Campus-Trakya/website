"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPoll, getPollResults } from "@/utils/pollUtils";
import { logger } from "@/utils/logger";
import { getAllDatasets } from "@/utils/datasetUtils";
import { ArrowLeft, Check, Folder, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldClasses } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";

export default function PollAdminPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("create"); // create, history

  // Create poll state
  const [datasetFile, setDatasetFile] = useState(null);
  const [datasetData, setDatasetData] = useState(null);
  const [savedDatasets, setSavedDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [bracketSize, setBracketSize] = useState(64);
  const [creating, setCreating] = useState(false);
  const [pollCode, setPollCode] = useState("");

  // History state
  const [pollHistory, setPollHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (activeTab === "history") {
      loadPollHistory();
    } else if (activeTab === "create") {
      loadSavedDatasets();
    }
  }, [activeTab]);

  const loadSavedDatasets = async () => {
    try {
      const datasets = await getAllDatasets();
      setSavedDatasets(datasets);
    } catch (error) {
      logger.error("Error loading datasets:", error);
      toast.error("Veri setleri yüklenirken hata oluştu!");
    }
  };

  const handleDatasetSelect = (datasetId) => {
    setSelectedDatasetId(datasetId);
    const dataset = savedDatasets.find(d => d.id === datasetId);
    if (dataset) {
      setDatasetData({
        name: dataset.name,
        description: dataset.description,
        items: dataset.items
      });
      setDatasetFile(null);
    }
  };

  const loadPollHistory = async () => {
    setLoadingHistory(true);
    try {
      const results = await getPollResults(50);
      setPollHistory(results);
    } catch (error) {
      logger.error("Error loading poll history:", error);
      toast.error("Geçmiş yüklenirken hata oluştu!");
    }
    setLoadingHistory(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Sadece JSON dosyaları yüklenebilir!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data.name || !data.items || !Array.isArray(data.items)) {
          toast.error("Geçersiz veri formatı!");
          return;
        }

        if (data.items.length < 8) {
          toast.error("En az 8 öğe gerekli!");
          return;
        }

        setDatasetData(data);
        setDatasetFile(file);
        toast.success("Veri seti yüklendi!");
      } catch (error) {
        toast.error("JSON dosyası okunamadı!");
      }
    };

    reader.readAsText(file);
  };

  const handleCreatePoll = async () => {
    if (!datasetData) {
      toast.error("Önce bir veri seti yükleyin!");
      return;
    }

    if (datasetData.items.length < bracketSize) {
      toast.error(`Veri setinde en az ${bracketSize} öğe olmalı!`);
      return;
    }

    setCreating(true);

    try {
      const pollData = {
        datasetName: datasetData.name,
        datasetDescription: datasetData.description || "",
        items: datasetData.items,
        bracketSize,
        hostId: user.uid,
        hostName: user.displayName || user.email
      };

      const pollId = await createPoll(pollData);

      // Get poll code from pollId
      const code = pollId.split("_").pop();
      setPollCode(code);

      toast.success("Poll oluşturuldu!");
    } catch (error) {
      logger.error("Error creating poll:", error);
      toast.error("Poll oluşturulurken hata oluştu!");
    }

    setCreating(false);
  };

  const handleManagePoll = () => {
    if (!pollCode) return;
    router.push(`/admin/poll/host/${pollCode}`);
  };

  if (loading) {
    return <p className="py-12 text-ink-2">Yükleniyor...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Poll Yönetim Paneli"
        description="Poll oluşturun ve geçmişi görüntüleyin"
        actions={
          <Button variant="outline" onClick={() => router.push("/admin")}>
            <ArrowLeft aria-hidden="true" />
            Admin Panel
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-10 flex flex-wrap gap-3">
        <Button
          variant={activeTab === "create" ? "default" : "outline"}
          aria-pressed={activeTab === "create"}
          onClick={() => setActiveTab("create")}
        >
          Poll Oluştur
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          aria-pressed={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          Geçmiş
        </Button>
      </div>

      {/* Create Poll Tab */}
      {activeTab === "create" && (
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
          {/* Upload Dataset */}
          <Section
            title="1. Veri Seti Seç"
            className="mt-0 md:mt-0"
            action={
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/poll/datasets")}>
                <Folder aria-hidden="true" />
                Veri Setleri
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Saved Datasets Selection */}
              <Field id="poll-saved-dataset" label="Kayıtlı Veri Seti Seç">
                <select
                  value={selectedDatasetId}
                  onChange={(e) => handleDatasetSelect(e.target.value)}
                  className={cn(fieldClasses, "h-control")}
                >
                  <option value="">-- Veri Seti Seçin --</option>
                  {savedDatasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name} ({dataset.items?.length || 0} öğe)
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-rule"></div>
                <span className="text-sm text-muted-foreground">VEYA</span>
                <div className="flex-1 border-t border-rule"></div>
              </div>

              {/* JSON File Upload */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="poll-json-file">JSON Dosyası Yükle</Label>
                <input
                  id="poll-json-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:h-9 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-4 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-brand-hover"
                />
                <p className="text-sm text-muted-foreground">
                  En az 8 öğe içeren JSON dosyası yükleyin
                </p>
              </div>

              {datasetData && (
                <div className="flex items-start justify-between gap-3 rounded border border-success p-4">
                  <div className="min-w-0">
                    <div className="break-words font-semibold">{datasetData.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-outlier tabular-nums">{datasetData.items.length}</span> öğe
                    </div>
                  </div>
                  <Check className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                </div>
              )}
            </div>
          </Section>

          {/* Configure Poll */}
          <Section title="2. Ayarları Yapılandır" className="mt-0 md:mt-0">
            <div className="space-y-4">
              <Field
                id="poll-bracket-size"
                label="Turnuva Boyutu"
                help={`Toplam ${Math.log2(bracketSize)} raund olacak`}
              >
                <select
                  value={bracketSize}
                  onChange={(e) => setBracketSize(Number(e.target.value))}
                  className={cn(fieldClasses, "h-control")}
                >
                  <option value={8}>8 öğe</option>
                  <option value={16}>16 öğe</option>
                  <option value={32}>32 öğe</option>
                  <option value={64}>64 öğe</option>
                  <option value={128}>128 öğe</option>
                </select>
              </Field>

              <Button
                size="lg"
                className="w-full"
                onClick={handleCreatePoll}
                disabled={!datasetData || creating}
              >
                {creating ? "Oluşturuluyor..." : "Poll Oluştur"}
              </Button>
            </div>
          </Section>

          {/* Poll Created Success */}
          {pollCode && (
            <div className="border-t-2 border-success pt-6 lg:col-span-2">
              <h2 className="font-display text-xl font-bold">Poll Oluşturuldu!</h2>
              <div className="mt-4 font-outlier text-5xl font-semibold tracking-widest sm:text-6xl">
                {pollCode}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Oyuncular bu kodu kullanarak poll'a katılabilir
              </p>
              <Button size="lg" className="mt-6" onClick={handleManagePoll}>
                Poll'u Yönet
              </Button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          {loadingHistory ? (
            <p className="py-12 text-ink-2">Geçmiş yükleniyor...</p>
          ) : pollHistory.length === 0 ? (
            <EmptyState title="Henüz tamamlanmış poll yok" />
          ) : (
            <ul className="max-w-3xl border-t-2 border-ink">
              {pollHistory.map((poll) => (
                <li
                  key={poll.id}
                  className="cursor-pointer border-b border-rule py-5 transition-colors duration-micro hover:bg-secondary"
                  onClick={() => setSelectedPoll(selectedPoll?.id === poll.id ? null : poll)}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="break-words font-display text-lg font-bold">
                        {poll.datasetName}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Kod: <span className="font-outlier">{poll.pollCode}</span>
                      </p>
                    </div>
                    <div className="shrink-0 font-outlier text-sm text-muted-foreground">
                      {poll.finishedAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </div>
                  </div>

                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Kazanan:</dt>
                      <dd className="min-w-0 break-words text-right font-semibold">
                        {poll.winner?.name || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Oyuncu Sayısı:</dt>
                      <dd className="tabular-nums">{poll.totalPlayers}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Toplam Eşleşme:</dt>
                      <dd className="tabular-nums">{poll.stats.totalMatches}</dd>
                    </div>
                  </dl>

                  {selectedPoll?.id === poll.id && poll.winner && (
                    <div className="mt-4 border-t border-rule pt-4">
                      <div className="relative mb-3 aspect-square max-w-xs overflow-hidden rounded">
                        <img
                          src={poll.winner.imageUrl}
                          alt={poll.winner.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {poll.winner.name}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
