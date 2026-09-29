import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import { getProjects } from "@/lib/content-data";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import ProjectsClient from "./ProjectsClient";

// Projects come from Firestore; refresh the static page every 10 minutes.
export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("projects", locale);
}

export default async function ProjectsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const projects = await getProjects();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          {
            name: locale === "en" ? "Projects" : "Projeler",
            path: "/projects",
          },
        ])}
      />
      <ProjectsClient initialProjects={projects} />
    </>
  );
}
