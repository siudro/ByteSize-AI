"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { ArabicVariantCode, LanguageCode, MediaReference, ScreenMedia } from "@/lib/schema";

type MediaBlockProps = {
  byteId: string;
  media: ScreenMedia;
  mediaItem?: MediaReference & { type: ScreenMedia["type"] };
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
};

const GENERIC_MEDIA_LABEL = {
  ar: "وسيط تعليمي",
  ar_fusha: "وسيط تعليمي",
  en: "Learning media"
};

const UNAVAILABLE_MEDIA = {
  ar: "الوسيط غير متوفر الآن",
  ar_fusha: "الوسيط غير متوفر حاليا",
  en: "Media unavailable"
};

const STATIC_FALLBACK = {
  ar: "تقدر تكمل بالنشاط الظاهر في الشاشة.",
  ar_fusha: "يمكنك المتابعة بالنشاط الظاهر في الشاشة.",
  en: "You can continue with the activity shown on this screen."
};

export function MediaBlock({ byteId, media, mediaItem, language, arabicVariant }: MediaBlockProps) {
  const [failed, setFailed] = useState(false);
  const label = t(mediaItem?.label ?? mediaItem?.caption ?? mediaItem?.alt, language, arabicVariant) || t(GENERIC_MEDIA_LABEL, language, arabicVariant);
  const expectedPath = mediaItem ? `content/bytes/${byteId}/media/${mediaItem.path}` : `content/bytes/${byteId}/media/<missing ref>`;
  const url = mediaItem ? `/content-media/${byteId}/media/${mediaItem.path}` : "";
  const showDeveloperDetails = process.env.NODE_ENV !== "production";

  function renderFallback() {
    return (
      <div className="media-preview" role="status">
        <div>
          <strong>{t(UNAVAILABLE_MEDIA, language, arabicVariant)}</strong>
          <p>{label || t(STATIC_FALLBACK, language, arabicVariant)}</p>
          {showDeveloperDetails ? (
            <small>
              Type: <code>{media.type}</code> | ID: <code>{media.ref}</code> | Expected: <code>{expectedPath}</code>
            </small>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="media-tile">
      {!mediaItem || failed ? (
        renderFallback()
      ) : media.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={t(mediaItem.alt, language, arabicVariant) || label} onError={() => setFailed(true)} />
      ) : media.type === "video" ? (
        <video src={url} controls onError={() => setFailed(true)} />
      ) : media.type === "audio" ? (
        <div className="media-preview">
          <audio src={url} controls onError={() => setFailed(true)} />
        </div>
      ) : (
        <div className="media-preview">
          <a className="button" href={url}>
            {label}
          </a>
        </div>
      )}
      <div className="media-meta">
        <strong>{label}</strong>
        {mediaItem?.caption ? <p>{t(mediaItem.caption, language, arabicVariant)}</p> : null}
      </div>
    </div>
  );
}