import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import CookiePolicyClient from "./CookiePolicyClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("cookiePolicy", locale);
}

export default async function CookiePolicyPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CookiePolicyClient />;
}
