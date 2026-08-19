"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { ArabicVariantCode, LanguageCode, MediaReference, ScreenMedia } from "@/lib/schema";
import { StlModelViewer } from "./StlModelViewer";

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
  const prompt = t(mediaItem?.prompt, language, arabicVariant);
  const [typedPrompt, setTypedPrompt] = useState("");
  const expectedPath = mediaItem ? `content/bytes/${byteId}/media/${mediaItem.path}` : `content/bytes/${byteId}/media/<missing ref>`;
  const url = mediaItem ? `/content-media/${byteId}/media/${mediaItem.path}` : "";
  const showDeveloperDetails = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (!prompt) {
      setTypedPrompt("");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedPrompt(prompt);
      return;
    }

    let index = 0;
    setTypedPrompt("");
    const timer = window.setInterval(() => {
      index += 1;
      setTypedPrompt(prompt.slice(0, index));
      if (index >= prompt.length) window.clearInterval(timer);
    }, 55);

    return () => window.clearInterval(timer);
  }, [prompt]);

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
    <div className="media-block">
      {prompt ? (
        <div className="media-prompt" dir={language === "en" ? "ltr" : "rtl"} aria-label={prompt}>
          <span className="media-prompt-label">{language === "en" ? "Prompt" : "الوصف"}</span>
          <p className="media-prompt-text" aria-hidden="true">
            {typedPrompt}
            <span className="typing-cursor" aria-hidden="true" />
          </p>
          <span className="visually-hidden">{prompt}</span>
        </div>
      ) : null}
      <div className="media-tile">
        {!mediaItem || failed ? (
          renderFallback()
        ) : media.type === "image" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={t(mediaItem.alt, language, arabicVariant) || label} onError={() => setFailed(true)} />
          </>
        ) : media.type === "video" ? (
          <video src={url} controls onError={() => setFailed(true)} />
        ) : media.type === "audio" ? (
          <div className="media-preview">
            <audio src={url} controls onError={() => setFailed(true)} />
          </div>
        ) : media.type === "model" ? (
          <StlModelViewer src={url} label={label} language={language} arabicVariant={arabicVariant} />
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
    </div>
  );
}
