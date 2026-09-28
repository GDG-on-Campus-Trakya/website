"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Timer,
  Trophy,
  User,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { PageHeader, EmptyState } from "@/components/ui/page";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";

export default function GameHistoryPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [gameResults, setGameResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [filterHost, setFilterHost] = useState("all");
  const router = useRouter();

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
      fetchGameResults();
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  const fetchGameResults = async () => {
    try {
      setLoadingResults(true);
      const resultsRef = collection(db, "gameResults");
      const q = query(resultsRef, orderBy("finishedAt", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setGameResults(results);
    } catch (error) {
      logger.error("Error fetching game results:", error);
      toast.error("Oyun geçmişi yüklenirken hata oluştu!");
    } finally {
      setLoadingResults(false);
    }
  };

  const formatDuration = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}dk ${seconds}sn`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Bilinmiyor";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredResults = gameResults.filter((result) => {
    if (filterHost === "all") return true;
    if (filterHost === "me") return result.hostId === user?.email;
    return true;
  });

  // Calculate overall stats
  const totalGames = gameResults.length;
  const totalPlayers = gameResults.reduce((sum, g) => sum + (g.stats?.totalPlayers || 0), 0);
  const averagePlayersPerGame = totalGames > 0 ? Math.round(totalPlayers / totalGames) : 0;
  const myGames = gameResults.filter((g) => g.hostId === user?.email).length;

  if (loading || loadingResults) {
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
        title="Oyun Geçmişi"
        description="Tamamlanan Quiz oyunlarının detaylı sonuçları"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/quiz/manage">
              <ArrowLeft aria-hidden="true" />
              Quiz Yönetimine Dön
            </Link>
          </Button>
        }
      />

      {/* Statistics */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-8">
        <Stat label="Toplam Oyun" value={totalGames} />
        <Stat label="Toplam Oyuncu" value={totalPlayers} />
        <Stat label="Ort. Oyuncu" value={averagePlayersPerGame} />
        <Stat label="Benim Oyunlarım" value={myGames} />
      </dl>

      {/* Filter */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button
          variant={filterHost === "all" ? "default" : "outline"}
          aria-pressed={filterHost === "all"}
          onClick={() => setFilterHost("all")}
        >
          Tüm Oyunlar
        </Button>
        <Button
          variant={filterHost === "me" ? "default" : "outline"}
          aria-pressed={filterHost === "me"}
          onClick={() => setFilterHost("me")}
        >
          Benim Oyunlarım
        </Button>
      </div>

      {/* Results List */}
      {filteredResults.length === 0 ? (
        <EmptyState className="mt-6" title="Henüz tamamlanmış oyun yok" />
      ) : (
        <ul className="mt-6 border-t-2 border-ink">
          {filteredResults.map((result) => (
            <li
              key={result.id}
              className="cursor-pointer border-b border-rule py-5 transition-colors duration-micro hover:bg-secondary"
              onClick={() => setSelectedGame(selectedGame?.id === result.id ? null : result)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="mr-1 min-w-0 break-words font-display text-lg font-bold md:text-xl">
                      {result.quizTitle}
                    </h2>
                    <Badge className="font-outlier">{result.gameCode}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-outlier tabular-nums">{result.stats?.totalPlayers || 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-outlier tabular-nums">{result.totalQuestions}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-outlier tabular-nums">{formatDuration(result.duration)}</span>
                    </span>
                    <span className="hidden items-center gap-1.5 sm:inline-flex">
                      <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {result.hostName}
                    </span>
                    <span className="hidden items-center gap-1.5 sm:inline-flex">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-outlier tabular-nums">{formatDate(result.finishedAt)}</span>
                    </span>
                  </div>

                  {/* Winner */}
                  {result.winner && (
                    <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded border border-ink bg-warning px-3 py-2 text-ink">
                      <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{result.winner.name}</div>
                        <div className="text-sm">
                          <span className="tabular-nums">{result.winner.score}</span> puan •{" "}
                          <span className="tabular-nums">{result.winner.correctAnswers}</span> doğru
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-expanded={selectedGame?.id === result.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGame(selectedGame?.id === result.id ? null : result);
                  }}
                >
                  {selectedGame?.id === result.id ? (
                    <ChevronUp aria-hidden="true" />
                  ) : (
                    <ChevronDown aria-hidden="true" />
                  )}
                </Button>
              </div>

              {/* Detailed Stats */}
              {selectedGame?.id === result.id && (
                <div className="mt-6 border-t border-rule pt-6">
                  {/* Top 3 */}
                  {result.topThree && result.topThree.length > 0 && (
                    <div className="mb-8">
                      <h3 className="mb-3 font-display text-lg font-bold">İlk 3</h3>
                      <ol className="border-t border-ink">
                        {result.topThree.map((player, index) => (
                          <li
                            key={player.userId}
                            className="flex items-center gap-4 border-b border-rule py-3"
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded font-outlier text-sm font-semibold tabular-nums",
                                index === 0 ? "bg-warning text-ink" : "bg-paper-3 text-ink"
                              )}
                            >
                              {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-semibold">{player.name}</span>
                            <span className="font-display text-xl font-extrabold tabular-nums">
                              {player.score}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* All Players */}
                  <div>
                    <h3 className="mb-3 font-display text-lg font-bold">
                      Tüm Oyuncular ({result.players?.length || 0})
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Sıra</TableHead>
                          <TableHead>İsim</TableHead>
                          <TableHead className="hidden sm:table-cell">Bölüm</TableHead>
                          <TableHead className="text-center">Doğru</TableHead>
                          <TableHead className="hidden text-center sm:table-cell">Ort. Süre</TableHead>
                          <TableHead className="text-right">Puan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.players?.map((player, index) => (
                          <TableRow key={player.userId} className={index < 3 ? "bg-paper-2" : ""}>
                            <TableCell className="font-outlier font-semibold tabular-nums">#{player.rank}</TableCell>
                            <TableCell className="max-w-[120px] truncate sm:max-w-none">{player.name}</TableCell>
                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                              {player.department || "-"}
                            </TableCell>
                            <TableCell className="text-center tabular-nums text-success">
                              {player.correctAnswers}/{player.totalAnswers}
                            </TableCell>
                            <TableCell className="hidden text-center tabular-nums text-muted-foreground sm:table-cell">
                              {player.averageTimeSpent}s
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {player.score}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Stats Summary */}
                  <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-rule pt-6 md:grid-cols-4 md:gap-x-8">
                    <Stat label="En Yüksek" value={result.stats?.highestScore || 0} />
                    <Stat label="En Düşük" value={result.stats?.lowestScore || 0} />
                    <Stat label="Ortalama" value={result.stats?.averageScore || 0} />
                    <Stat label="Ort. Doğru" value={result.stats?.averageCorrectAnswers || 0} />
                  </dl>
                </div>
              )}
            </li>
          ))}
        </ul>
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
