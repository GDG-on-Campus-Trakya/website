import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="mx-auto flex w-full max-w-page flex-col items-start px-gutter py-16 md:py-28">
      <p className="font-outlier text-sm text-muted-foreground">404</p>
      <h1 className="mt-3 max-w-2xl font-display text-[length:var(--text-display-s)] font-extrabold">
        {t('title')}
      </h1>
      <p className="mt-4 max-w-measure text-ink-2">{t('description')}</p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Button asChild>
          <Link href="/">{t('backHome')}</Link>
        </Button>
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center rounded-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2"
        >
          {t('events')}
        </Link>
      </div>
    </div>
  );
}
