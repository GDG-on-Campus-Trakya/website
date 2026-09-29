import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import AboutClient from "./AboutClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("about", locale);
}

export default async function AboutPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AboutClient />;
}
