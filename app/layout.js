import { getDocumentMetadata } from '@/components/DocumentLayout';
import { defaultLocale } from '@/i18n/locales';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export const metadata = getDocumentMetadata(defaultLocale);

// Locale routes and the global 404 supply their own document without reading headers.
export default function RootLayout({ children }) {
  return children;
}
