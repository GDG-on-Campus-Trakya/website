"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageContainer, PageHeader, Section } from "@/components/ui/page";

const COPY = {
  tr: {
    pageTitle: "Ekibimizle Tanışın!",
    teamsTitle: "Takımlarımız",
    communityTitle: "GDG On Campus Trakya Üniversitesi",
    communityParagraphs: [
      "GDG On Campus Trakya, Trakya Üniversiteli geliştiriciler ve öğrencilerden oluşan bir topluluktur. Misyonumuz, öğrencilere Google teknolojilerini öğrenme fırsatları sunmak, sektör profesyonelleriyle iletişim kurmalarını sağlamak ve becerilerini geliştirmelerine yardımcı olmaktır.",
      "İster yeni başlayın ister deneyimli bir geliştirici olun, etkinliklerimiz ve aktivitelerimiz sizi başarıya ulaştırmanıza ve teknoloji meraklılarından oluşan güçlü bir topluluk kurmanıza yardımcı olmak için tasarlanmıştır.",
    ],
    organizer: "Organizer",
    board: "Yönetim Kurulu",
    departments: {
      externalAffairs: "Dış İşleri",
      internalAffairs: "İç İşleri",
      media: "Medya ve İletişim",
      software: "Yazılım",
    },
    roles: {
      externalRelations: "Dış İlişkiler",
      sponsorship: "Sponsorluk",
      organization: "Organizasyon",
      pr: "PR",
      socialMedia: "Sosyal Medya",
      design: "Tasarım",
      mentor: "Mentor",
    },
  },
  en: {
    pageTitle: "Meet Our Team!",
    teamsTitle: "Our Teams",
    communityTitle: "GDG On Campus Trakya University",
    communityParagraphs: [
      "GDG On Campus Trakya is a community of student developers and technology enthusiasts at Trakya University. Our mission is to create opportunities to learn Google technologies, connect students with industry professionals, and help them build stronger technical skills.",
      "Whether you are just getting started or already an experienced developer, our events and activities are designed to help you grow, contribute, and build a strong community around technology.",
    ],
    organizer: "Organizer",
    board: "Board of Directors",
    departments: {
      externalAffairs: "External Affairs",
      internalAffairs: "Internal Affairs",
      media: "Media and Communications",
      software: "Software",
    },
    roles: {
      externalRelations: "External Relations",
      sponsorship: "Sponsorship",
      organization: "Organization",
      pr: "PR",
      socialMedia: "Social Media",
      design: "Design",
      mentor: "Mentor",
    },
  },
};

const photoButton =
  "group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-lg bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function AboutPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Swipe between photos: the image follows a fifth of the drag, then snaps back.
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(null);

  useEffect(() => {
    if (selectedImage) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  const teamData = {
    organizer: {
      title: copy.organizer,
      image: "/organizer.webp",
      dot: "bg-mark-blue",
    },
    board: {
      title: copy.board,
      image: "/yonetim-kurulu.webp",
      dot: "bg-mark-red",
    },
    teams: [
      {
        department: copy.departments.externalAffairs,
        members: [
          {
            title: copy.roles.externalRelations,
            image: "/dis-isleri-dis-iliskiler.webp",
          },
          { title: copy.roles.sponsorship, image: "/dis-isleri-sponsorluk.webp" },
        ],
        dot: "bg-mark-yellow",
      },
      {
        department: copy.departments.internalAffairs,
        members: [
          { title: copy.roles.organization, image: "/ic-isleri-organizasyon.webp" },
          { title: copy.roles.pr, image: "/ic-isleri-pr.webp" },
        ],
        dot: "bg-mark-green",
      },
      {
        department: copy.departments.media,
        members: [
          {
            title: copy.roles.socialMedia,
            image: "/medya-ve-iletisim-sosyal-medya.webp",
          },
          { title: copy.roles.design, image: "/medya-ve-iletisim-tasarim.webp" },
        ],
        dot: "bg-mark-red",
      },
      {
        department: copy.departments.software,
        members: [{ title: copy.roles.mentor, image: "/yazilim-mentor.webp" }],
        dot: "bg-mark-blue",
      },
    ],
  };

  const allImages = [
    { src: teamData.organizer.image, title: teamData.organizer.title },
    { src: teamData.board.image, title: teamData.board.title },
    ...teamData.teams.flatMap((team) =>
      team.members.map((member) => ({
        src: member.image,
        title: `${team.department} - ${member.title}`,
      }))
    ),
  ];

  const handleImageClick = (imageSrc) => {
    const index = allImages.findIndex((image) => image.src === imageSrc);
    setSelectedIndex(index);
    setSelectedImage(allImages[index]);
  };

  const goToNext = () => {
    const nextIndex = (selectedIndex + 1) % allImages.length;
    setSelectedIndex(nextIndex);
    setSelectedImage(allImages[nextIndex]);
  };

  const goToPrevious = () => {
    const previousIndex = (selectedIndex - 1 + allImages.length) % allImages.length;
    setSelectedIndex(previousIndex);
    setSelectedImage(allImages[previousIndex]);
  };

  const handlePointerDown = (event) => {
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (dragStartX.current === null) return;
    setDragOffset((event.clientX - dragStartX.current) * 0.2);
  };

  const handlePointerUp = (event) => {
    if (dragStartX.current === null) return;
    const swipeThreshold = 50;
    const offset = event.clientX - dragStartX.current;
    dragStartX.current = null;
    setDragOffset(0);

    if (offset > swipeThreshold) {
      goToPrevious();
    } else if (offset < -swipeThreshold) {
      goToNext();
    }
  };

  const handlePointerCancel = () => {
    dragStartX.current = null;
    setDragOffset(0);
  };

  return (
    <PageContainer>
      <PageHeader title={copy.pageTitle} />

      <section className="grid gap-6 md:grid-cols-12 md:gap-8">
        <h2 className="font-display text-2xl font-bold md:col-span-5">
          {copy.communityTitle}
        </h2>
        <div className="space-y-4 text-md text-ink-2 md:col-span-7">
          {copy.communityParagraphs.map((paragraph) => (
            <p key={paragraph} className="max-w-measure">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-8">
        <figure className="min-w-0 md:col-span-5">
          <button
            type="button"
            className={photoButton}
            onClick={() => handleImageClick(teamData.organizer.image)}
          >
            <Image
              src={teamData.organizer.image}
              alt={teamData.organizer.title}
              fill
              priority
              sizes="(min-width: 1152px) 440px, (min-width: 768px) 40vw, 100vw"
              className="pointer-events-none object-cover"
            />
          </button>
          <figcaption className="mt-3 flex items-center gap-2 border-t-2 border-ink pt-3">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${teamData.organizer.dot}`}
              aria-hidden="true"
            />
            <h2 className="font-display text-xl font-bold">{teamData.organizer.title}</h2>
          </figcaption>
        </figure>

        <figure className="min-w-0 md:col-span-5 md:col-start-7 md:mt-24">
          <button
            type="button"
            className={photoButton}
            onClick={() => handleImageClick(teamData.board.image)}
          >
            <Image
              src={teamData.board.image}
              alt={teamData.board.title}
              fill
              sizes="(min-width: 1152px) 440px, (min-width: 768px) 40vw, 100vw"
              className="pointer-events-none object-cover"
            />
          </button>
          <figcaption className="mt-3 flex items-center gap-2 border-t-2 border-ink pt-3">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${teamData.board.dot}`}
              aria-hidden="true"
            />
            <h2 className="font-display text-xl font-bold">{teamData.board.title}</h2>
          </figcaption>
        </figure>
      </section>

      <Section title={copy.teamsTitle} className="mt-16 md:mt-24">
        {teamData.teams.map((team) => (
          <div
            key={team.department}
            className="grid gap-5 border-b border-rule py-8 md:grid-cols-12 md:gap-8 md:py-10"
          >
            <div className="flex items-center gap-2 self-start md:col-span-4">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${team.dot}`}
                aria-hidden="true"
              />
              <h3 className="font-display text-lg font-bold">{team.department}</h3>
            </div>
            <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 sm:gap-6 md:col-span-8">
              {team.members.map((member) => (
                <li key={member.image} className="min-w-0">
                  <figure>
                    <button
                      type="button"
                      className={photoButton}
                      onClick={() => handleImageClick(member.image)}
                    >
                      <Image
                        src={member.image}
                        alt={member.title}
                        fill
                        sizes="(min-width: 1152px) 340px, (min-width: 768px) 30vw, 45vw"
                        className="pointer-events-none object-cover object-top"
                      />
                    </button>
                    <figcaption className="mt-2 text-sm font-medium text-ink">
                      {member.title}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Dialog
        open={Boolean(selectedImage)}
        onOpenChange={(open) => {
          if (!open) setSelectedImage(null);
        }}
      >
        <DialogContent className="max-w-3xl gap-0 p-0">
          <div className="min-w-0 py-4 pl-5 pr-16">
            <DialogTitle className="truncate">{selectedImage?.title}</DialogTitle>
            <DialogDescription className="font-outlier tabular-nums">
              {selectedIndex + 1} / {allImages.length}
            </DialogDescription>
          </div>

          <div className="relative h-[60dvh] overflow-hidden bg-paper-2">
            {selectedImage && (
              <div
                key={selectedIndex}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                style={{ transform: `translateX(${dragOffset}px)` }}
                className={`relative h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${
                  dragOffset === 0 ? "transition-transform duration-short ease-out" : ""
                }`}
              >
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="pointer-events-none object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-rule p-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
