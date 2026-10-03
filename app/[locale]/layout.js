import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { isValidLocale, locales } from '@/i18n/locales';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import CookieConsent from '@/components/CookieConsent';
import AuthProvider from '../AuthProvider';
import DocumentLayout, { getDocumentMetadata } from '@/components/DocumentLayout';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return getDocumentMetadata(locale);
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <DocumentLayout locale={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <CookieConsent />
        </AuthProvider>
      </NextIntlClientProvider>
    </DocumentLayout>
  );
}
