import { privatePageMetadata } from "@/lib/page-meta";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return privatePageMetadata("tickets", locale);
}

export default function TicketsLayout({ children }) {
  return children;
}
