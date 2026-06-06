'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Calendar, User, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { getLocalizedField } from '@/utils/localeUtils';

export default function AnnouncementPostCard({
  announcement,
  onEdit,
  onDelete,
  showAdminActions = false
}) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const copy =
    locale === 'en'
      ? {
          noDate: 'No date',
          draft: 'Draft',
          readMore: 'Read More',
          edit: 'Edit',
          delete: 'Delete'
        }
      : {
          noDate: 'Tarih yok',
          draft: 'Taslak',
          readMore: 'Devamını Oku',
          edit: 'Düzenle',
          delete: 'Sil'
        };

  const title = getLocalizedField(announcement, 'title', locale);
  const description =
    getLocalizedField(announcement, 'description', locale) ||
    getLocalizedField(announcement, 'content', locale);

  const formatDate = (dateString) => {
    if (!dateString) return copy.noDate;
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy, HH:mm');
    } catch (error) {
      return copy.noDate;
    }
  };

  const handleCardClick = (e) => {
    if (showAdminActions && e.target.closest('button')) {
      return;
    }
    router.push(`/announcements/${announcement.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.3)' }}
      onClick={handleCardClick}
      className="group bg-gray-800/30 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 cursor-pointer flex flex-col h-full"
    >
      {announcement.imageUrl && !imageError && (
        <div className="relative w-full h-48 bg-gray-900 overflow-hidden">
          <Image
            src={announcement.imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          {!announcement.isPublished && showAdminActions && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold z-10">
              {copy.draft}
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(announcement.createdAt)}</span>
          </div>
          {announcement.authorName && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{announcement.authorName}</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors duration-300">
          {title}
        </h3>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">{description}</p>

        <div className="mt-auto pt-4 border-t border-gray-700/50">
          <div className="flex justify-between items-center">
            <div className="text-blue-400 group-hover:text-blue-300 text-sm font-semibold flex items-center gap-2">
              {copy.readMore}
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>

            {showAdminActions && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(announcement);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                >
                  {copy.edit}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(announcement.id);
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  {copy.delete}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
