"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import AcademicFields from "@/components/AcademicFields";
import { useAccount } from "@/app/AuthProvider";
import { logger } from "@/utils/logger";
import { localizeAcademicValue } from "@/utils/localeUtils";
import ProfileImageUpload from "./ProfileImageUpload";
import { StoragePaths } from "../utils/storageUtils";

const COPY = {
  tr: {
    unnamed: "Adın girilmemiş",
    incomplete:
      "Adın, fakülten ya da bölümün eksik. Şimdi doldurursan etkinliklere tek adımda kayıt olursun.",
    completeNow: "Şimdi doldur",
    name: "Ad soyad",
    faculty: "Fakülte",
    department: "Bölüm",
    cancel: "Vazgeç",
    saving: "Kaydediliyor…",
    save: "Kaydet",
    editProfile: "Bilgilerini düzenle",
    nameRequired: "Adını yaz.",
    facultyRequired: "Fakülteni seç.",
    departmentRequired: "Bölümünü seç ya da yaz.",
    saveError: "Profil kaydedilemedi. Bağlantını kontrol edip tekrar dene.",
  },
  en: {
    unnamed: "No name given",
    incomplete:
      "Your name, faculty or department is missing. Fill them in now and registering for events takes one step.",
    completeNow: "Fill in now",
    name: "Full name",
    faculty: "Faculty",
    department: "Department",
    cancel: "Cancel",
    saving: "Saving…",
    save: "Save",
    editProfile: "Edit your details",
    nameRequired: "Enter your name.",
    facultyRequired: "Choose your faculty.",
    departmentRequired: "Choose or type your department.",
    saveError: "Your profile was not saved. Check your connection and try again.",
  },
};

const UserInfo = ({ user }) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [profileData, setProfileData] = useState({
    name: "",
    faculty: "",
    department: "",
    photoURL: "",
    imagePath: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { mergeProfile } = useAccount();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            name: data.name || "",
            faculty: data.faculty || "",
            department: data.department || "",
            photoURL: data.photoURL || user.photoURL || "",
            imagePath: data.imagePath || "",
          });
        }
      }
    };

    fetchProfileData();
  }, [user]);

  const handleImageUpload = async (imageData) => {
    if (profileData.imagePath) {
      try {
        const { deleteImage } = await import("../utils/storageUtils");
        await deleteImage(profileData.imagePath);
      } catch (deleteError) {
        logger.warn("Failed to delete old profile image:", deleteError);
      }
    } else if (
      profileData.photoURL &&
      profileData.photoURL.includes("firebasestorage.googleapis.com")
    ) {
      try {
        const { deleteImage } = await import("../utils/storageUtils");
        const url = new URL(profileData.photoURL);
        const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
        if (pathMatch) {
          const imagePath = decodeURIComponent(pathMatch[1]);
          await deleteImage(imagePath);
        }
      } catch (deleteError) {
        logger.warn("Failed to delete old profile image from URL:", deleteError);
      }
    }

    setProfileData((prev) => ({
      ...prev,
      photoURL: imageData.url,
      imagePath: imageData.path,
    }));

    try {
      if (user) {
        await updateProfile(user, {
          photoURL: imageData.url,
        });
      }
    } catch (profileError) {
      logger.warn("Failed to update Firebase Auth profile photo:", profileError);
    }
  };

  const handleSave = async () => {
    const fields = {
      name: profileData.name.trim(),
      faculty: profileData.faculty.trim(),
      department: profileData.department.trim(),
    };
    const nextErrors = {
      name: fields.name ? undefined : copy.nameRequired,
      faculty: fields.faculty ? undefined : copy.facultyRequired,
      department: fields.department ? undefined : copy.departmentRequired,
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.faculty || nextErrors.department) return;

    setIsLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { ...profileData, ...fields, email: user.email },
        { merge: true }
      );
      setProfileData((prev) => ({ ...prev, ...fields }));
      mergeProfile({ ...fields, photoURL: profileData.photoURL });

      if (user) {
        await updateProfile(user, {
          displayName: fields.name,
          photoURL: profileData.photoURL,
        });
      }
      // The form closing on the saved values is the confirmation.
      setIsEditing(false);
    } catch (saveError) {
      logger.error("Error updating profile:", saveError);
      toast.error(copy.saveError);
    }
    setIsLoading(false);
  };

  const isProfileComplete = () =>
    ["name", "faculty", "department"].every(
      (field) => profileData[field]?.trim() !== ""
    );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <img
            src={profileData.photoURL || user.photoURL || "/logo.svg"}
            alt=""
            className="h-24 w-24 rounded-full bg-paper-2 object-cover"
          />
          <ProfileImageUpload
            onImageUpload={handleImageUpload}
            currentImageUrl={profileData.photoURL}
            folder={StoragePaths.PROFILES}
            prefix={`profile_${user.uid}_`}
            isEditing={isEditing}
          />
        </div>
        <div className="flex min-w-0 flex-col text-left">
          <h3 className="break-words font-display text-2xl font-bold">
            {profileData.name || copy.unnamed}
          </h3>
          <p className="break-all text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="w-full space-y-4">
        {!isProfileComplete() && !isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-rule py-3">
            <p className="max-w-measure text-sm text-ink-2">{copy.incomplete}</p>
            <Button size="sm" onClick={() => setIsEditing(true)}>
              {copy.completeNow}
            </Button>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
              <Field id="profile-name" label={copy.name} error={errors.name} className="md:col-span-2">
                <Input
                  value={profileData.name}
                  onChange={(event) => {
                    setProfileData({
                      ...profileData,
                      name: event.target.value,
                    });
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  autoComplete="name"
                />
              </Field>
              <AcademicFields
                faculty={profileData.faculty}
                department={profileData.department}
                errors={errors}
                onChange={({ faculty, department }) => {
                  setProfileData({ ...profileData, faculty, department });
                  setErrors((prev) => ({ ...prev, faculty: undefined, department: undefined }));
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                {copy.cancel}
              </Button>
              <Button onClick={handleSave} loading={isLoading}>
                {isLoading ? copy.saving : copy.save}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-4 border-y border-rule py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{copy.name}</dt>
                <dd className="font-medium">{profileData.name || "-"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">{copy.faculty}</dt>
                <dd className="font-medium">
                  {profileData.faculty
                    ? localizeAcademicValue(profileData.faculty, locale)
                    : "-"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">{copy.department}</dt>
                <dd className="font-medium">
                  {profileData.department
                    ? localizeAcademicValue(profileData.department, locale)
                    : "-"}
                </dd>
              </div>
            </dl>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              {copy.editProfile}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
