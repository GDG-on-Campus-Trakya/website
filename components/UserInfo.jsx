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
import { Label } from "@/components/ui/label";
import { faculties, facultyDepartments } from "@/constants";
import { logger } from "@/utils/logger";
import { localizeAcademicValue } from "@/utils/localeUtils";
import ProfileImageUpload from "./ProfileImageUpload";
import { StoragePaths } from "../utils/storageUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COPY = {
  tr: {
    unnamed: "İsim girilmemiş",
    incomplete:
      "Lütfen etkinliklere katılabilmek için profil bilgilerinizi tamamlayın.",
    name: "İsim",
    faculty: "Fakülte",
    department: "Bölüm",
    selectFaculty: "Fakülte seçin",
    searchDepartment: "Bölüm ara...",
    selectDepartment: "Bölüm seçin",
    selectFacultyFirst: "Önce fakülte seçin",
    cancel: "İptal",
    saving: "Kaydediliyor...",
    save: "Kaydet",
    editProfile: "Profili Düzenle",
    saveSuccess: "Profil bilgileri başarıyla güncellendi",
    saveError: "Profil güncellenirken bir hata oluştu",
  },
  en: {
    unnamed: "No name provided",
    incomplete: "Please complete your profile information to join events.",
    name: "Name",
    faculty: "Faculty",
    department: "Department",
    selectFaculty: "Select a faculty",
    searchDepartment: "Search department...",
    selectDepartment: "Select a department",
    selectFacultyFirst: "Select a faculty first",
    cancel: "Cancel",
    saving: "Saving...",
    save: "Save",
    editProfile: "Edit Profile",
    saveSuccess: "Profile information updated successfully",
    saveError: "An error occurred while updating the profile",
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
  const [departmentSearch, setDepartmentSearch] = useState("");

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
    setIsLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...profileData,
          email: user.email,
        },
        { merge: true }
      );

      if (user) {
        await updateProfile(user, {
          displayName: profileData.name,
          photoURL: profileData.photoURL,
        });
      }

      toast.success(copy.saveSuccess);
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

  const handleFacultyChange = (newFaculty) => {
    setProfileData({
      ...profileData,
      faculty: newFaculty,
      department: "",
    });
    setDepartmentSearch("");
  };

  const getFilteredDepartments = () => {
    if (!profileData.faculty) return [];

    const departments = facultyDepartments[profileData.faculty] || [];
    if (!departmentSearch) return departments;

    return departments.filter((department) =>
      department.toLowerCase().includes(departmentSearch.toLowerCase()) ||
      localizeAcademicValue(department, locale)
        .toLowerCase()
        .includes(departmentSearch.toLowerCase())
    );
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <img
            src={profileData.photoURL || user.photoURL || "/logo.svg"}
            alt="Profile"
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
          <h2 className="break-words font-display text-2xl font-bold">
            {profileData.name || copy.unnamed}
          </h2>
          <p className="break-all text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="w-full space-y-4">
        {!isProfileComplete() && !isEditing && (
          <div className="rounded border border-ink bg-warning p-4 text-ink">
            <p>{copy.incomplete}</p>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
              <Field id="profile-name" label={copy.name} className="md:col-span-2">
                <Input
                  placeholder={copy.name}
                  value={profileData.name}
                  onChange={(event) =>
                    setProfileData({
                      ...profileData,
                      name: event.target.value,
                    })
                  }
                />
              </Field>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-faculty">{copy.faculty}</Label>
                <Select value={profileData.faculty} onValueChange={handleFacultyChange}>
                  <SelectTrigger id="profile-faculty">
                    <SelectValue placeholder={copy.selectFaculty} />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty} value={faculty}>
                        {localizeAcademicValue(faculty, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-department">{copy.department}</Label>
                {profileData.faculty && (
                  <Input
                    placeholder={copy.searchDepartment}
                    value={departmentSearch}
                    onChange={(event) => setDepartmentSearch(event.target.value)}
                  />
                )}
                <Select
                  value={profileData.department}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, department: value })
                  }
                  disabled={!profileData.faculty}
                >
                  <SelectTrigger id="profile-department">
                    <SelectValue
                      placeholder={
                        profileData.faculty
                          ? copy.selectDepartment
                          : copy.selectFacultyFirst
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredDepartments().map((department) => (
                      <SelectItem key={department} value={department}>
                        {localizeAcademicValue(department, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                {copy.cancel}
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
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
