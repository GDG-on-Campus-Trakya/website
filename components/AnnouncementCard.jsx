"use client";

import {
  Trophy,
  Gift,
  Calendar,
  Clock,
  Sparkles,
  Crown,
} from "lucide-react";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

export default function AnnouncementCard({ announcement }) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          winner: "WINNER",
          raffleResult: "Raffle Result",
          announcement: "Announcement",
        }
      : {
          winner: "KAZANAN",
          raffleResult: "Çekiliş Sonucu",
          announcement: "Duyuru",
        };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatLocalizedDate(date, locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const title = getLocalizedField(announcement, "title", locale);
  const content = getLocalizedField(announcement, "content", locale);
  const eventName =
    getLocalizedField(announcement, "eventName", locale) ||
    getLocalizedField(announcement, "name", locale);

  if (announcement.type === "raffle_result") {
    return (
      <div className="relative overflow-hidden max-w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse" />

        <div className="relative bg-gray-900/80 backdrop-blur-sm border-2 border-yellow-400/50 rounded-2xl shadow-2xl hover:shadow-yellow-400/20 transition-all duration-300 group">
          <div className="absolute top-2 right-2 text-yellow-400 opacity-70 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="absolute top-2 left-2 text-yellow-400 opacity-50 group-hover:opacity-80 transition-opacity">
            <Sparkles
              className="w-4 h-4 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-1">
                {title} {"\u{1F389}"}
              </h3>
              <p className="text-yellow-300/80 font-medium">{eventName}</p>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-6 mb-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8 text-yellow-400 mr-2" />
                <span className="text-yellow-300 font-semibold text-lg">
                  {copy.winner}
                </span>
                <Trophy className="w-8 h-8 text-yellow-400 ml-2" />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="text-3xl font-bold text-yellow-400 mb-2 break-words">
                  {announcement.winnerName || announcement.winner}
                </div>
                <div className="flex items-center justify-center text-green-400">
                  <Gift className="w-5 h-5 mr-2" />
                  <span className="font-semibold text-lg">
                    {announcement.prize}
                  </span>
                </div>
              </div>

              <div
                className="text-4xl animate-bounce"
                style={{ animationDelay: "0.2s" }}
              >
                {"\u{1F3C6}\u{1F38A}\u{1F973}\u{1F388}\u2728"}
              </div>
            </div>

            {content && (
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <div className="whitespace-pre-line text-gray-200 leading-relaxed text-center">
                  {content}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-yellow-400/20">
              <div className="flex items-center space-x-2 text-yellow-300/80">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {formatDate(announcement.createdAt)}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-yellow-400 text-sm font-medium">
                  {copy.raffleResult}
                </span>
                <div className="text-2xl animate-pulse">{"\u{1F3AF}"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-full">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-400">{title}</h3>
            {eventName && <p className="text-sm text-gray-400">{eventName}</p>}
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-400">
          <Clock className="w-4 h-4 mr-1" />
          {formatDate(announcement.createdAt)}
        </div>
      </div>

      <div className="whitespace-pre-line text-gray-300 leading-relaxed mb-4">
        {content}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{copy.announcement}</span>
        </div>

        <div className="text-2xl">{"\u{1F4E2}"}</div>
      </div>
    </div>
  );
}
