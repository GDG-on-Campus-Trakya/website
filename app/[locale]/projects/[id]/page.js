import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getProjectById, getProjects } from "@/lib/content-data";
import { absoluteUrl, buildMetadata, getSiteMeta } from "@/lib/seo";
import {
  breadcrumbJsonLd,
  organizationRef,
  plainText,
} from "@/lib/structured-data";
import { getLocalizedField } from "@/utils/localeUtils";
import ProjectDetailClient from "./ProjectDetailClient";

export const revalidate = 600;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ id: project.docId }));
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const project = await getProjectById(id);

  if (!project) {
    return buildMetadata({
      locale,
      path: `/projects/${id}`,
      title: locale === "en" ? "Projects" : "Projeler",
      description: locale === "en" ? "Projects" : "Projeler",
      noindex: true,
    });
  }

  const title = getLocalizedField(project, "title", locale);

  return buildMetadata({
    locale,
    path: `/projects/${id}`,
    title,
    description:
      plainText(getLocalizedField(project, "description", locale)) ||
      (locale === "en"
        ? `${title}: a GDG on Campus Trakya community project.`
        : `${title}: GDG on Campus Trakya topluluk projesi.`),
    image: project.imageUrl || undefined,
  });
}

export default async function ProjectPage({ params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [project, all] = await Promise.all([getProjectById(id), getProjects()]);
  if (!project) notFound();

  const title = getLocalizedField(project, "title", locale);
  const site = getSiteMeta(locale);
  const related = all.filter((item) => item.docId !== project.docId).slice(0, 3);
  const collaborators = (project.collaborators || [])
    .filter((collaborator) => collaborator?.name)
    .map((collaborator) => ({ "@type": "Person", name: collaborator.name }));

  const projectLd = {
    "@context": "https://schema.org",
    "@type": project.githubLink ? "SoftwareSourceCode" : "CreativeWork",
    name: title,
    description: plainText(getLocalizedField(project, "description", locale), 300) || undefined,
    image: project.imageUrl ? [project.imageUrl] : undefined,
    dateCreated: project.createdAt || undefined,
    url: absoluteUrl(locale, `/projects/${id}`),
    inLanguage: locale,
    codeRepository: project.githubLink || undefined,
    author: collaborators.length ? collaborators : undefined,
    publisher: { "@type": "Organization", name: site.siteName, ...organizationRef() },
  };

  return (
    <>
      <JsonLd data={projectLd} />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "en" ? "Projects" : "Projeler", path: "/projects" },
          { name: title, path: `/projects/${id}` },
        ])}
      />
      <ProjectDetailClient initialProject={project} initialRelated={related} />
    </>
  );
}
