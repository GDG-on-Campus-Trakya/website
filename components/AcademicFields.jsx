"use client";

import { useId } from "react";
import { useLocale } from "next-intl";
import { departments as allDepartments, faculties, facultyDepartments } from "@/constants";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { localizeAcademicValue } from "@/utils/localeUtils";

// Several schools teach the same programme; suggest each name once (duplicate option keys also
// left stale suggestions behind when the faculty changed).
const ALL_DEPARTMENTS = [...new Set(allDepartments)].sort((a, b) => a.localeCompare(b, "tr"));

const COPY = {
  tr: {
    faculty: "Fakülte veya yüksekokul",
    chooseFaculty: "Seç",
    department: "Bölüm veya program",
    departmentPlaceholder: "Yazmaya başla",
    departmentHelp: "Listeden seç; programın listede yoksa adını yaz.",
  },
  en: {
    faculty: "Faculty or school",
    chooseFaculty: "Choose",
    department: "Department or programme",
    departmentPlaceholder: "Start typing",
    departmentHelp: "Pick from the list; if your programme is missing, type its name.",
  },
};

// Faculty from the fixed list, department as free text with the faculty's departments as
// suggestions: new programmes are not in constants.js yet, and a missing one must not stop
// anyone from completing their profile or registering for an event.
export default function AcademicFields({ faculty, department, onChange, errors = {} }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const id = useId();
  const facultyId = `${id}-faculty`;
  const departmentId = `${id}-department`;
  const suggestions = facultyDepartments[faculty] || ALL_DEPARTMENTS;

  const chooseFaculty = (next) => {
    // A department picked from the old faculty's list no longer fits; one typed by hand stays.
    const fromOldList = (facultyDepartments[faculty] || []).includes(department);
    onChange({ faculty: next, department: fromOldList ? "" : department });
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={facultyId}>{copy.faculty}</Label>
        <Select value={faculty || ""} onValueChange={chooseFaculty}>
          <SelectTrigger
            id={facultyId}
            aria-invalid={errors.faculty ? true : undefined}
            aria-describedby={`${facultyId}-message`}
            className={cn(errors.faculty && "border-error")}
          >
            <SelectValue placeholder={copy.chooseFaculty} />
          </SelectTrigger>
          <SelectContent>
            {faculties.map((item) => (
              <SelectItem key={item} value={item}>
                {localizeAcademicValue(item, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p
          id={`${facultyId}-message`}
          role={errors.faculty ? "alert" : undefined}
          className="min-h-[1lh] text-sm text-error"
        >
          {errors.faculty}
        </p>
      </div>

      <Field id={departmentId} label={copy.department} help={copy.departmentHelp} error={errors.department}>
        <Input
          list={`${departmentId}-options`}
          value={department || ""}
          onChange={(event) => onChange({ faculty, department: event.target.value })}
          placeholder={copy.departmentPlaceholder}
          autoComplete="off"
        />
      </Field>
      <datalist id={`${departmentId}-options`}>
        {suggestions.map((item) => (
          <option
            key={item}
            value={item}
            label={locale === "en" ? localizeAcademicValue(item, "en") : undefined}
          />
        ))}
      </datalist>
    </>
  );
}
