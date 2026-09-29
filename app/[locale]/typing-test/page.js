import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import TypingTestClient from "./TypingTestClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("typingTest", locale);
}

export default async function TypingTestPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TypingTestClient />;
}
