"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

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

export default function AboutPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(1);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const teamData = {
    organizer: {
      title: copy.organizer,
      image: "/organizer.webp",
      gradient: "from-[#4285F4] to-[#DB4437]",
    },
    board: {
      title: copy.board,
      image: "/yonetim-kurulu.webp",
      gradient: "from-[#DB4437] to-[#F4B400]",
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
        gradient: "from-[#F4B400] to-[#0F9D58]",
      },
      {
        department: copy.departments.internalAffairs,
        members: [
          { title: copy.roles.organization, image: "/ic-isleri-organizasyon.webp" },
          { title: copy.roles.pr, image: "/ic-isleri-pr.webp" },
        ],
        gradient: "from-[#0F9D58] to-[#4285F4]",
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
        gradient: "from-[#DB4437] to-[#F4B400]",
      },
      {
        department: copy.departments.software,
        members: [{ title: copy.roles.mentor, image: "/yazilim-mentor.webp" }],
        gradient: "from-[#4285F4] to-[#0F9D58]",
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
    setDirection(1);
    setSelectedIndex(index);
    setSelectedImage(allImages[index]);
  };

  const goToNext = () => {
    setDirection(1);
    const nextIndex = (selectedIndex + 1) % allImages.length;
    setSelectedIndex(nextIndex);
    setSelectedImage(allImages[nextIndex]);
  };

  const goToPrevious = () => {
    setDirection(-1);
    const previousIndex = (selectedIndex - 1 + allImages.length) % allImages.length;
    setSelectedIndex(previousIndex);
    setSelectedImage(allImages[previousIndex]);
  };

  const handleDragEnd = (_event, info) => {
    const swipeThreshold = 50;

    if (info.offset.x > swipeThreshold) {
      goToPrevious();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a1a2e] to-[#000000] font-sans text-white"
    >
      <main className="container mx-auto flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <motion.h1
          variants={itemVariants}
          className="mb-12 text-center text-3xl font-bold sm:text-4xl lg:text-5xl"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="animate-gradient-x bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] bg-clip-text text-transparent"
          >
            {copy.pageTitle}
          </motion.span>
        </motion.h1>

        <motion.div variants={itemVariants} className="mb-16">
          <div className="mx-auto max-w-2xl">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative cursor-zoom-in overflow-hidden rounded-2xl shadow-2xl"
              onClick={() => handleImageClick(teamData.organizer.image)}
            >
              <Image
                src={teamData.organizer.image}
                alt={teamData.organizer.title}
                width={1000}
                height={1000}
                priority
                className="h-auto w-full pointer-events-none"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-all group-hover:via-black/40" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 p-6 backdrop-blur-sm sm:p-8">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl">
                  {teamData.organizer.title}
                </h2>
              </div>
              <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/50 p-2 opacity-70 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:p-3 sm:opacity-0">
                <svg
                  className="h-5 w-5 text-white sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-16">
          <div className="mx-auto max-w-3xl">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative cursor-zoom-in overflow-hidden rounded-2xl shadow-2xl"
              onClick={() => handleImageClick(teamData.board.image)}
            >
              <Image
                src={teamData.board.image}
                alt={teamData.board.title}
                width={1000}
                height={1000}
                className="h-auto w-full pointer-events-none"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-all group-hover:via-black/40" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 p-6 backdrop-blur-sm sm:p-8">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">
                  {teamData.board.title}
                </h2>
              </div>
              <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/50 p-2 opacity-70 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:p-3 sm:opacity-0">
                <svg
                  className="h-5 w-5 text-white sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-16">
          <h3 className="mb-8 bg-gradient-to-r from-[#4285F4] via-[#DB4437] to-[#0F9D58] bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl">
            {copy.teamsTitle}
          </h3>

          <Carousel
            className="relative mx-auto w-full max-w-6xl"
            opts={{
              align: "center",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {teamData.teams
                .flatMap((team) =>
                  team.members.map((member) => ({
                    ...member,
                    department: team.department,
                  }))
                )
                .map((member, index) => (
                  <CarouselItem
                    key={`${member.image}-${index}`}
                    className="basis-full pl-2 md:basis-1/2 md:pl-4"
                  >
                    <motion.div whileHover={{ scale: 1.02 }} className="group h-full">
                      <Card className="h-full border-none bg-transparent">
                        <CardContent className="p-0">
                          <div
                            className="relative w-full cursor-zoom-in overflow-hidden rounded-xl shadow-2xl"
                            onClick={() => handleImageClick(member.image)}
                          >
                            <Image
                              src={member.image}
                              alt={member.title}
                              width={800}
                              height={800}
                              className="h-auto w-full pointer-events-none"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-all group-hover:via-black/40" />
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 p-4 backdrop-blur-sm sm:p-6">
                              <p className="mb-1 text-sm text-gray-200 sm:text-base">
                                {member.department}
                              </p>
                              <h4 className="text-xl font-bold text-white drop-shadow-lg sm:text-2xl">
                                {member.title}
                              </h4>
                            </div>
                            <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/50 p-2 opacity-70 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:right-4 sm:top-4 sm:opacity-0">
                              <svg
                                className="h-4 w-4 text-white sm:h-5 sm:w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                                />
                              </svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
            </CarouselContent>
          </Carousel>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-16 mt-20">
          <motion.h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl lg:text-5xl">
            <motion.span className="animate-gradient-x bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] bg-clip-text text-transparent">
              {copy.communityTitle}
            </motion.span>
          </motion.h2>

          <div className="mx-auto max-w-3xl space-y-6">
            {copy.communityParagraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="rounded-lg bg-gray-800/30 p-6 text-center text-[#d1d1e0] backdrop-blur-sm sm:text-lg lg:text-xl"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-10 top-20 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 left-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl"
        />
      </main>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            style={{ overscrollBehavior: "contain" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative h-full max-h-[90vh] w-full max-w-7xl"
              onClick={(event) => event.stopPropagation()}
            >
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={selectedIndex}
                  custom={direction}
                  variants={{
                    enter: (currentDirection) => ({
                      x: currentDirection > 0 ? 300 : -300,
                      opacity: 0,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                    },
                    exit: (currentDirection) => ({
                      x: currentDirection > 0 ? -300 : 300,
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="relative h-full w-full cursor-grab active:cursor-grabbing"
                >
                  <Image
                    src={selectedImage.src}
                    alt={selectedImage.title}
                    fill
                    className="object-contain pointer-events-none"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className="text-center text-2xl font-bold text-white sm:text-3xl">
                  {selectedImage.title}
                </h3>
                <p className="mt-2 text-center text-gray-300">
                  {selectedIndex + 1} / {allImages.length}
                </p>
              </div>

              <button
                onClick={() => setSelectedImage(null)}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-3xl font-bold text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/50 sm:h-12 sm:w-12 sm:text-4xl"
                aria-label="Close image modal"
              >
                ×
              </button>

              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-2xl transition-all hover:scale-110 hover:from-blue-600 hover:to-blue-800 sm:left-4 sm:h-14 sm:w-14"
                aria-label="Previous image"
              >
                <svg
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-2xl transition-all hover:scale-110 hover:from-blue-600 hover:to-blue-800 sm:right-4 sm:h-14 sm:w-14"
                aria-label="Next image"
              >
                <svg
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: left;
          }
          50% {
            background-position: right;
          }
        }
        .animate-gradient-x {
          background-size: 300% 100%;
          animation: gradient-x 8s ease-in-out infinite;
          background-image: linear-gradient(
            to right,
            #4285f4,
            #db4437,
            #f4b400,
            #0f9d58,
            #4285f4
          );
        }
      `}</style>
    </motion.div>
  );
}
