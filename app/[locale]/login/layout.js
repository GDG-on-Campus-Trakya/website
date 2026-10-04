import { privatePageMetadata } from "@/lib/page-meta";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return privatePageMetadata("login", locale);
}

export default function LoginLayout({ children }) {
  return children;
}
