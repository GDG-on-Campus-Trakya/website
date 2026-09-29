import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import TermsClient from "./TermsClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("terms", locale);
}

export default async function TermsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TermsClient />;
}
