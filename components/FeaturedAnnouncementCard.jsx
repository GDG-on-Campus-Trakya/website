'use client';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from "@/i18n/navigation";
import { Calendar, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const COPY = {
  tr: {
    noDate: 'Tarih yok',
    featured: 'Öne Çıkan Duyuru',
    readMore: 'Devamını Oku',
  },
  en: {
    noDate: 'No date',
    featured: 'Featured Announcement',
    readMore: 'Read More',
  },
};

export default function FeaturedAnnouncementCard({ announcement }) {
  const locale = useLocale() === 'en' ? 'en' : 'tr';
  const copy = COPY[locale];
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const formatDate = (dateString) => {
    if (!dateString) return copy.noDate;
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy, HH:mm');
    } catch (error) {
      return copy.noDate;
    }
  };

  const handleCardClick = () => {
    router.push(`/announcements/${announcement.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.3)' }}
      onClick={handleCardClick}
      className="group bg-gray-800/30 backdrop-blur-md rounded-3xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 cursor-pointer grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 items-center mb-12"
    >
      {/* Image Section */}
      {announcement.imageUrl && !imageError && (
        <div className="relative w-full h-64 md:h-full min-h-[300px] overflow-hidden">
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 md:p-8 flex flex-col justify-center">
        <div>
          <span className="text-sm font-bold text-blue-400 mb-2 inline-block">{copy.featured}</span>
          {/* Title */}
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 line-clamp-3 group-hover:text-blue-300 transition-colors duration-300">
            {announcement.title}
          </h2>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(announcement.createdAt)}</span>
            </div>
            {announcement.authorName && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{announcement.authorName}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-300 text-base mb-6 line-clamp-4">
            {announcement.description || announcement.content}
          </p>

          {/* Footer */}
          <div className="mt-auto">
            <div className="text-blue-400 group-hover:text-blue-300 text-md font-semibold flex items-center gap-2">
              {copy.readMore}
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
