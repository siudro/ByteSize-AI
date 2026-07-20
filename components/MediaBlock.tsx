"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { LanguageCode, MediaReference, ScreenMedia } from "@/lib/schema";

type MediaBlockProps = {
  byteId: string;
  media: ScreenMedia;
  mediaItem?: MediaReference & { type: ScreenMedia["type"] };
  language: LanguageCode;
};

export function MediaBlock({ byteId, media, mediaItem, language }: MediaBlockProps) {
  const [failed, setFailed] = useState(false);
  const label = t(mediaItem?.label ?? mediaItem?.caption ?? mediaItem?.alt, language) || media.ref;
  const expectedPath = mediaItem ? `content/bytes/${byteId}/media/${mediaItem.path}` : `content/bytes/${byteId}/media/<missing ref>`;
  const url = mediaItem ? `/content-media/${byteId}/media/${mediaItem.path}` : "";

  function renderPlaceholder() {
    return (
      <div className="media-preview">
        <div>
          <strong>{language === "ar" ? "وسيط مؤقت" : "Media placeholder"}</strong>
          <p>{label}</p>
          <small>
            {language === "ar" ? "النوع" : "Type"}: <code>{media.type}</code>
          </small>
          <br />
          <small>
            ID: <code>{media.ref}</code>
          </small>
          <br />
          <small>
            {language === "ar" ? "المسار المتوقع" : "Expected path"}: <code>{expectedPath}</code>
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="media-tile">
      {!mediaItem || failed ? (
        renderPlaceholder()
      ) : media.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={t(mediaItem.alt, language) || label} onError={() => setFailed(true)} />
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
        {mediaItem?.caption ? <p>{t(mediaItem.caption, language)}</p> : null}
      </div>
    </div>
  );
}
