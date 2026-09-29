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
      <Button asChild className="mt-8">
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </div>
  );
}
