"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { toast } from "react-toastify";
import { useLocale } from "next-intl";
import { useAccount } from "@/app/AuthProvider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getEventStart } from "@/utils/eventTime";
import { logger } from "@/utils/logger";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";
import { socialUtils } from "@/utils/socialUtils";

const MAX_BYTES = 10 * 1024 * 1024;
const CAPTION_MAX = 500;
const POSTING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const COPY = {
  tr: {
    event: "Etkinlik",
    eventHelp: "Fotoğraf bu etkinliğin çekilişine otomatik katılır.",
    until: (date) => `son gün ${date}`,
    noEvents: "Şu an fotoğraf paylaşılabilecek bir etkinlik yok.",
    chooseEvent: "Hangi etkinlikten olduğunu seç.",
    photo: "Fotoğraf",
    pick: "Fotoğraf seç ya da buraya sürükle",
    pickHelp: "JPG, PNG veya HEIC, en fazla 10 MB. Yüklerken küçültülür.",
    change: "Değiştir",
    remove: "Kaldır",
    choosePhoto: "Bir fotoğraf seç.",
    notImage: "Bu dosya bir görsel değil. JPG, PNG veya HEIC seç.",
    tooLarge: "Fotoğraf 10 MB'tan büyük. Daha küçük bir dosya seç.",
    caption: "Açıklama",
    optional: "isteğe bağlı",
    captionPlaceholder: "Kimler var, ne oluyordu?",
    share: "Paylaş",
    cancel: "Vazgeç",
    signInRequired: "Paylaşmak için giriş yap.",
    uploadError: "Fotoğraf yüklenemedi. Bağlantını kontrol edip tekrar dene.",
    postError: "Paylaşım kaydedilemedi. Tekrar dene.",
  },
  en: {
    event: "Event",
    eventHelp: "The photo enters this event's raffle automatically.",
    until: (date) => `until ${date}`,
    noEvents: "There is no event open for photos right now.",
    chooseEvent: "Choose the event the photo is from.",
    photo: "Photo",
    pick: "Choose a photo or drop it here",
    pickHelp: "JPG, PNG or HEIC, up to 10 MB. It is resized on upload.",
    change: "Change",
    remove: "Remove",
    choosePhoto: "Choose a photo.",
    notImage: "This file is not an image. Choose a JPG, PNG or HEIC.",
    tooLarge: "The photo is larger than 10 MB. Choose a smaller file.",
    caption: "Caption",
    optional: "optional",
    captionPlaceholder: "Who is in it, what was happening?",
    share: "Share",
    cancel: "Cancel",
    signInRequired: "Sign in to share.",
    uploadError: "The photo could not be uploaded. Check your connection and try again.",
    postError: "The post could not be saved. Try again.",
  },
};

// Share a photo from an event that is still open (three days from its start). Pass
// `activeEvents` when the page already has them; otherwise they are loaded here.
export default function PostUpload({ onUploadComplete, onCancel, activeEvents: givenEvents }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const { user, profile } = useAccount();
  const [loadedEvents, setLoadedEvents] = useState(null);
  const events = (givenEvents ?? loadedEvents ?? []).filter((event) => event.canPost);
  const [eventId, setEventId] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (givenEvents) return;
    socialUtils.getActiveEventsForPosting().then((result) => {
      setLoadedEvents(result.success ? result.events : []);
    });
  }, [givenEvents]);

  // One open event: nothing to choose
  useEffect(() => {
    if (!eventId && events.length === 1) setEventId(events[0].id);
  }, [eventId, events]);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const deadline = (event) => {
    const start = getEventStart(event);
    if (!start) return null;
    return formatLocalizedDate(new Date(start.getTime() + POSTING_WINDOW_MS), locale, {
      timeZone: "Europe/Istanbul",
      day: "numeric",
      month: "long",
    });
  };

  const chooseFile = (next) => {
    if (!next) return;
    if (!next.type.startsWith("image/") && !/\.hei[cf]$/i.test(next.name)) {
      setErrors((prev) => ({ ...prev, photo: copy.notImage }));
      return;
    }
    if (next.size > MAX_BYTES) {
      setErrors((prev) => ({ ...prev, photo: copy.tooLarge }));
      return;
    }
    setErrors((prev) => ({ ...prev, photo: undefined }));
    setFile(next);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      toast.error(copy.signInRequired);
      return;
    }

    const nextErrors = {
      event: eventId ? undefined : copy.chooseEvent,
      photo: file ? undefined : copy.choosePhoto,
    };
    setErrors(nextErrors);
    if (nextErrors.event || nextErrors.photo) return;

    setSubmitting(true);

    try {
      const upload = await socialUtils.uploadPostImage(file, user.uid);
      if (!upload.success) {
        toast.error(copy.uploadError);
        return;
      }

      const chosen = events.find((item) => item.id === eventId);
      const post = await socialUtils.createPost({
        userId: user.uid,
        userEmail: user.email,
        userName: profile?.name || user.displayName || user.email,
        userPhoto: profile?.photoURL || user.photoURL || null,
        imageUrl: upload.url,
        description: caption.trim(),
        eventId,
        eventName: chosen?.name,
        eventNameEn: chosen?.nameEn || "",
      });

      if (!post.success) {
        toast.error(copy.postError);
        return;
      }

      await socialUtils.addToRaffle(eventId, user.uid, post.id);
      onUploadComplete?.();
    } catch (error) {
      logger.error("Upload error:", error);
      toast.error(copy.postError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <fieldset
        aria-describedby="post-upload-event-message"
        aria-invalid={errors.event ? true : undefined}
      >
        <legend className="text-sm font-medium text-ink">{copy.event}</legend>
        {events.length > 0 ? (
          <ul className="mt-1.5 border-y border-rule">
            {events.map((item) => (
              <li key={item.id} className="border-b border-rule last:border-b-0">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2 transition-colors duration-micro ease-out hover:bg-paper-2">
                  <input
                    type="radio"
                    name="post-upload-event"
                    value={item.id}
                    checked={eventId === item.id}
                    onChange={() => {
                      setEventId(item.id);
                      setErrors((prev) => ({ ...prev, event: undefined }));
                    }}
                    className="h-5 w-5 shrink-0 accent-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-medium text-ink">
                      {getLocalizedField(item, "name", locale)}
                    </span>
                    {deadline(item) && (
                      <span className="block font-outlier text-xs text-muted-foreground">
                        {copy.until(deadline(item))}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-sm text-ink-2">{copy.noEvents}</p>
        )}
        <p
          id="post-upload-event-message"
          role={errors.event ? "alert" : undefined}
          className={cn("mt-1.5 min-h-[1lh] text-sm", errors.event ? "text-error" : "text-muted-foreground")}
        >
          {errors.event || (events.length > 0 ? copy.eventHelp : null)}
        </p>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <span id="post-upload-photo-label" className="text-sm font-medium text-ink">
          {copy.photo}
        </span>
        <input
          ref={inputRef}
          id="post-upload-photo"
          type="file"
          accept="image/*,image/heic,image/heif"
          onChange={(event) => chooseFile(event.target.files?.[0])}
          aria-labelledby="post-upload-photo-label"
          aria-describedby="post-upload-photo-message"
          aria-invalid={errors.photo ? true : undefined}
          className="peer sr-only"
        />
        {preview ? (
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded bg-paper-2">
              <Image src={preview} alt="" fill unoptimized className="object-contain" />
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-outlier text-xs text-muted-foreground">{file?.name}</p>
              <div className="flex shrink-0 gap-4">
                <Button
                  type="button"
                  variant="link"
                  className="min-h-11"
                  onClick={() => inputRef.current?.click()}
                >
                  {copy.change}
                </Button>
                <Button type="button" variant="link" className="min-h-11 text-ink" onClick={clearFile}>
                  {copy.remove}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <label
            htmlFor="post-upload-photo"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              chooseFile(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-2 rounded border border-dashed border-input px-4 py-8 transition-colors duration-micro ease-out hover:bg-paper-2 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
              dragging && "border-ink bg-paper-2",
              errors.photo && "border-error"
            )}
          >
            <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium text-ink">{copy.pick}</span>
          </label>
        )}
        <p
          id="post-upload-photo-message"
          role={errors.photo ? "alert" : undefined}
          className={cn("min-h-[1lh] text-sm", errors.photo ? "text-error" : "text-muted-foreground")}
        >
          {errors.photo || copy.pickHelp}
        </p>
      </div>

      <Field
        id="post-upload-caption"
        label={copy.caption}
        action={
          <span className="font-outlier text-xs tabular-nums text-muted-foreground">
            {caption.length}/{CAPTION_MAX}
          </span>
        }
        help={copy.optional}
      >
        <Textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder={copy.captionPlaceholder}
          rows={3}
          maxLength={CAPTION_MAX}
          className="resize-none"
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {copy.cancel}
          </Button>
        )}
        <Button type="submit" loading={submitting} disabled={events.length === 0}>
          {copy.share}
        </Button>
      </div>
    </form>
  );
}
