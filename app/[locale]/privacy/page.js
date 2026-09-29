import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import PrivacyClient from "./PrivacyClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("privacy", locale);
}

export default async function PrivacyPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrivacyClient />;
}
