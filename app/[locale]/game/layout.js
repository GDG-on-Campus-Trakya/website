import { privatePageMetadata } from "@/lib/page-meta";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return privatePageMetadata("game", locale);
}

export default function GameLayout({ children }) {
  return children;
}
