import { privatePageMetadata } from "@/lib/page-meta";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return privatePageMetadata("profile", locale);
}

export default function ProfileLayout({ children }) {
  return children;
}
