"use client";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPoll, getPollResults } from "@/utils/pollUtils";
import { logger } from "@/utils/logger";
import { getAllDatasets } from "@/utils/datasetUtils";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    datasetsLoadError: "Veri setleri yüklenirken hata oluştu!",
    historyLoadError: "Geçmiş yüklenirken hata oluştu!",
    onlyJson: "Sadece JSON dosyaları yüklenebilir!",
    invalidFormat: "Geçersiz veri formatı!",
    minItemsRequired: "En az 8 öğe gerekli!",
    datasetLoaded: "Veri seti yüklendi!",
    jsonReadError: "JSON dosyası okunamadı!",
    uploadDatasetFirst: "Önce bir veri seti yükleyin!",
    minItemsForBracket: (n) => `Veri setinde en az ${n} öğe olmalı!`,
    pollCreated: "Poll oluşturuldu!",
    pollCreateError: "Poll oluşturulurken hata oluştu!",
    adminPanel: "Admin Panel",
    pageTitle: "Poll Yönetim Paneli",
    pageSubtitle: "Poll oluşturun ve geçmişi görüntüleyin",
    createPollTab: "Poll Oluştur",
    historyTab: "Geçmiş",
    selectDatasetHeading: "1. Veri Seti Seç",
    datasetsButton: "📁 Veri Setleri",
    selectSavedDataset: "Kayıtlı Veri Seti Seç",
    selectDatasetPlaceholder: "-- Veri Seti Seçin --",
    itemsCount: (n) => `${n} öğe`,
    or: "VEYA",
    uploadJsonFile: "JSON Dosyası Yükle",
    uploadJsonHint: "En az 8 öğe içeren JSON dosyası yükleyin",
    configureHeading: "2. Ayarları Yapılandır",
    bracketSize: "Turnuva Boyutu",
    bracketOption: (n) => `${n} öğe`,
    totalRoundsHint: (n) => `Toplam ${n} raund olacak`,
    creating: "Oluşturuluyor...",
    createPollButton: "Poll Oluştur",
    pollCreatedHeading: "Poll Oluşturuldu!",
    playersCanJoin: "Oyuncular bu kodu kullanarak poll'a katılabilir",
    managePoll: "Poll'u Yönet",
    historyLoading: "Geçmiş yükleniyor...",
    noCompletedPolls: "Henüz tamamlanmış poll yok",
    code: "Kod",
    winner: "Kazanan",
    playerCount: "Oyuncu Sayısı",
    totalMatches: "Toplam Eşleşme",
  },
  en: {
    datasetsLoadError: "An error occurred while loading datasets!",
    historyLoadError: "An error occurred while loading history!",
    onlyJson: "Only JSON files can be uploaded!",
    invalidFormat: "Invalid data format!",
    minItemsRequired: "At least 8 items are required!",
    datasetLoaded: "Dataset loaded!",
    jsonReadError: "Could not read JSON file!",
    uploadDatasetFirst: "Upload a dataset first!",
    minItemsForBracket: (n) => `The dataset must have at least ${n} items!`,
    pollCreated: "Poll created!",
    pollCreateError: "An error occurred while creating the poll!",
    adminPanel: "Admin Panel",
    pageTitle: "Poll Management Panel",
    pageSubtitle: "Create polls and view history",
    createPollTab: "Create Poll",
    historyTab: "History",
    selectDatasetHeading: "1. Select Dataset",
    datasetsButton: "📁 Datasets",
    selectSavedDataset: "Select Saved Dataset",
    selectDatasetPlaceholder: "-- Select Dataset --",
    itemsCount: (n) => `${n} items`,
    or: "OR",
    uploadJsonFile: "Upload JSON File",
    uploadJsonHint: "Upload a JSON file with at least 8 items",
    configureHeading: "2. Configure Settings",
    bracketSize: "Bracket Size",
    bracketOption: (n) => `${n} items`,
    totalRoundsHint: (n) => `There will be ${n} rounds in total`,
    creating: "Creating...",
    createPollButton: "Create Poll",
    pollCreatedHeading: "Poll Created!",
    playersCanJoin: "Players can join the poll using this code",
    managePoll: "Manage Poll",
    historyLoading: "Loading history...",
    noCompletedPolls: "No completed polls yet",
    code: "Code",
    winner: "Winner",
    playerCount: "Player Count",
    totalMatches: "Total Matches",
  },
};

export default function PollAdminPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
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
      toast.error(copy.datasetsLoadError);
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
      toast.error(copy.historyLoadError);
    }
    setLoadingHistory(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error(copy.onlyJson);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data.name || !data.items || !Array.isArray(data.items)) {
          toast.error(copy.invalidFormat);
          return;
        }

        if (data.items.length < 8) {
          toast.error(copy.minItemsRequired);
          return;
        }

        setDatasetData(data);
        setDatasetFile(file);
        toast.success(copy.datasetLoaded);
      } catch (error) {
        toast.error(copy.jsonReadError);
      }
    };

    reader.readAsText(file);
  };

  const handleCreatePoll = async () => {
    if (!datasetData) {
      toast.error(copy.uploadDatasetFirst);
      return;
    }

    if (datasetData.items.length < bracketSize) {
      toast.error(copy.minItemsForBracket(bracketSize));
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

      toast.success(copy.pollCreated);
    } catch (error) {
      logger.error("Error creating poll:", error);
      toast.error(copy.pollCreateError);
    }

    setCreating(false);
  };

  const handleManagePoll = () => {
    if (!pollCode) return;
    router.push(`/admin/poll/host/${pollCode}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">{a.loading}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{copy.pageTitle}</h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                {copy.pageSubtitle}
              </p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:opacity-80 text-sm sm:text-base"
            >
              ← {copy.adminPanel}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
                activeTab === "create"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-white border border-gray-700"
              }`}
            >
              {copy.createPollTab}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
                activeTab === "history"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-white border border-gray-700"
              }`}
            >
              {copy.historyTab}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Create Poll Tab */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Dataset */}
            <div className="bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{copy.selectDatasetHeading}</h2>
                <button
                  onClick={() => router.push("/admin/poll/datasets")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm"
                >
                  {copy.datasetsButton}
                </button>
              </div>

              <div className="space-y-4">
                {/* Saved Datasets Selection */}
                <div>
                  <label className="block text-white mb-2 font-semibold text-sm sm:text-base">
                    {copy.selectSavedDataset}
                  </label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => handleDatasetSelect(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm sm:text-base"
                  >
                    <option value="">{copy.selectDatasetPlaceholder}</option>
                    {savedDatasets.map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name} ({copy.itemsCount(dataset.items?.length || 0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-gray-700"></div>
                  <span className="text-gray-400 text-sm">{copy.or}</span>
                  <div className="flex-1 border-t border-gray-700"></div>
                </div>

                {/* JSON File Upload */}
                <div>
                  <label className="block text-white mb-2 font-semibold text-sm sm:text-base">
                    {copy.uploadJsonFile}
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="w-full text-white text-sm sm:text-base"
                  />
                  <p className="text-gray-400 text-xs sm:text-sm mt-2">
                    {copy.uploadJsonHint}
                  </p>
                </div>

                {datasetData && (
                  <div className="border border-gray-700 rounded-lg p-4 bg-green-500/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm sm:text-base">
                          {datasetData.name}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {copy.itemsCount(datasetData.items.length)}
                        </div>
                      </div>
                      <span className="text-green-500 text-xl sm:text-2xl">✓</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configure Poll */}
            <div className="bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">{copy.configureHeading}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold text-sm sm:text-base">
                    {copy.bracketSize}
                  </label>
                  <select
                    value={bracketSize}
                    onChange={(e) => setBracketSize(Number(e.target.value))}
                    className="w-full px-4 py-2 sm:py-3 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm sm:text-base"
                  >
                    <option value={8}>{copy.bracketOption(8)}</option>
                    <option value={16}>{copy.bracketOption(16)}</option>
                    <option value={32}>{copy.bracketOption(32)}</option>
                    <option value={64}>{copy.bracketOption(64)}</option>
                    <option value={128}>{copy.bracketOption(128)}</option>
                  </select>
                  <p className="text-gray-400 text-xs sm:text-sm mt-2">
                    {copy.totalRoundsHint(Math.log2(bracketSize))}
                  </p>
                </div>

                <button
                  onClick={handleCreatePoll}
                  disabled={!datasetData || creating}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {creating ? copy.creating : copy.createPollButton}
                </button>
              </div>
            </div>

            {/* Poll Created Success */}
            {pollCode && (
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 rounded-xl p-6 sm:p-8">
                  <div className="text-center">
                    <div className="text-4xl sm:text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                      {copy.pollCreatedHeading}
                    </h3>
                    <div className="text-4xl sm:text-6xl font-bold text-white mb-6 tracking-widest">
                      {pollCode}
                    </div>
                    <p className="text-gray-400 mb-6 text-sm sm:text-base">
                      {copy.playersCanJoin}
                    </p>
                    <button
                      onClick={handleManagePoll}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-base sm:text-lg"
                    >
                      {copy.managePoll}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {loadingHistory ? (
              <div className="text-center py-12">
                <p className="text-white">{copy.historyLoading}</p>
              </div>
            ) : pollHistory.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
                <div className="text-4xl sm:text-6xl mb-4">📊</div>
                <p className="text-gray-400 text-sm sm:text-base">
                  {copy.noCompletedPolls}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pollHistory.map((poll) => (
                  <div
                    key={poll.id}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer"
                    onClick={() => setSelectedPoll(selectedPoll?.id === poll.id ? null : poll)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {poll.datasetName}
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {copy.code}: {poll.pollCode}
                        </p>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {poll.finishedAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{copy.winner}:</span>
                        <span className="text-white font-semibold">
                          {poll.winner?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{copy.playerCount}:</span>
                        <span className="text-white">{poll.totalPlayers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{copy.totalMatches}:</span>
                        <span className="text-white">{poll.stats.totalMatches}</span>
                      </div>
                    </div>

                    {selectedPoll?.id === poll.id && poll.winner && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="aspect-square relative rounded-lg overflow-hidden mb-3">
                          <img
                            src={poll.winner.imageUrl}
                            alt={poll.winner.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-center text-white font-bold text-sm sm:text-base">
                          🏆 {poll.winner.name}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
