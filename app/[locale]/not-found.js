import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white">
      <div className="text-center p-4">
        <h1 className="text-8xl md:text-9xl font-bold text-purple-500 animate-pulse">
          404
        </h1>
        <p className="mt-4 text-xl md:text-2xl font-semibold">{t('title')}</p>
        <p className="mt-2 text-gray-400">{t('description')}</p>
        <div className="mt-8">
          <Link href="/">
            <Button
              variant="secondary"
              className="rounded-full px-8 py-3 text-lg font-bold transition-transform hover:scale-105"
            >
              {t('backHome')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
