import { t } from "@/lib/i18n";
import type { ArabicVariantCode, InternalVisualization, LanguageCode, MediaKind, MediaReference, ScreenInteraction } from "@/lib/schema";

type InteractivePlaceholderProps = {
  visualization?: InternalVisualization;
  interaction?: ScreenInteraction;
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
  mediaRefs: Array<MediaReference & { type: MediaKind }>;
};

function displayValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "n/a";
}

export function InteractivePlaceholder({ visualization, interaction, language, arabicVariant, mediaRefs }: InteractivePlaceholderProps) {
  const title = t(interaction?.title ?? visualization?.title, language, arabicVariant);
  const purpose = t(interaction?.prompt ?? visualization?.purpose, language, arabicVariant);
  const category = displayValue(interaction?.category ?? visualization?.category);
  const kind = displayValue(interaction?.kind ?? visualization?.kind ?? visualization?.type);

  if (!visualization && !interaction) {
    return (
      <div className="placeholder-card interaction-placeholder">
        <strong>{t({ ar: "تفاعل غير معروف", ar_fusha: "تفاعل غير معروف", en: "Unknown interactive" }, language, arabicVariant)}</strong>
        <p>
          {t(
            {
              ar: "لم يتم العثور على تعريف هذا التفاعل في ملف البايت.",
              ar_fusha: "لم يتم العثور على تعريف هذا التفاعل في ملف البايت.",
              en: "No matching visualization definition was found in the Byte file."
            },
            language,
            arabicVariant
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="placeholder-card interaction-placeholder">
      <p className="eyebrow">{t({ ar: "تفاعل مؤقت", ar_fusha: "تفاعل مؤقت", en: "Interactive placeholder" }, language, arabicVariant)}</p>
      {title ? <h2>{title}</h2> : null}
      {purpose ? <p>{purpose}</p> : null}
      <div className="info-block interaction-meta">
        <p>
          <strong>{t({ ar: "الفئة", ar_fusha: "الفئة", en: "Category" }, language, arabicVariant)}:</strong> <code>{category}</code>
        </p>
        <p>
          <strong>{t({ ar: "النوع", ar_fusha: "النوع", en: "Kind" }, language, arabicVariant)}:</strong> <code>{kind}</code>
        </p>
        <p>
          <strong>ID:</strong> <code>{displayValue(interaction?.id ?? visualization?.id)}</code>
        </p>
        <p>
          <strong>{t({ ar: "المسار", ar_fusha: "المسار", en: "Path" }, language, arabicVariant)}:</strong> <code>{displayValue(visualization?.path)}</code>
        </p>
        <p>
          <strong>{t({ ar: "ملف الإعدادات", ar_fusha: "ملف الإعدادات", en: "Config path" }, language, arabicVariant)}:</strong>{" "}
          <code>{displayValue(visualization?.config_path)}</code>
        </p>
      </div>
      {mediaRefs.length > 0 ? (
        <div className="info-block">
          <strong>{t({ ar: "وسائط مرتبطة", ar_fusha: "وسائط مرتبطة", en: "Media references" }, language, arabicVariant)}</strong>
          <ul>
            {mediaRefs.map((media) => (
              <li key={media.id}>
                <code>{media.id}</code> - {t(media.caption ?? media.alt ?? media.label, language, arabicVariant)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
