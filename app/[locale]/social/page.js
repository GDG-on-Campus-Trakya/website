import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import SocialClient from "./SocialClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("social", locale);
}

export default async function SocialPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SocialClient />;
}
