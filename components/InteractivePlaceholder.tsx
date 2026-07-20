import { t } from "@/lib/i18n";
import type { InternalVisualization, LanguageCode, MediaKind, MediaReference, ScreenInteraction } from "@/lib/schema";

type InteractivePlaceholderProps = {
  visualization?: InternalVisualization;
  interaction?: ScreenInteraction;
  language: LanguageCode;
  mediaRefs: Array<MediaReference & { type: MediaKind }>;
};

function displayValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "n/a";
}

export function InteractivePlaceholder({ visualization, interaction, language, mediaRefs }: InteractivePlaceholderProps) {
  const title = t(interaction?.title ?? visualization?.title, language);
  const purpose = t(interaction?.prompt ?? visualization?.purpose, language);
  const category = displayValue(interaction?.category ?? visualization?.category);
  const kind = displayValue(interaction?.kind ?? visualization?.kind ?? visualization?.type);

  if (!visualization && !interaction) {
    return (
      <div className="placeholder-card interaction-placeholder">
        <strong>{language === "ar" ? "تفاعل غير معروف" : "Unknown interactive"}</strong>
        <p>
          {language === "ar"
            ? "لم يتم العثور على تعريف هذا التفاعل في ملف البايت."
            : "No matching visualization definition was found in the Byte file."}
        </p>
      </div>
    );
  }

  return (
    <div className="placeholder-card interaction-placeholder">
      <p className="eyebrow">{language === "ar" ? "تفاعل مؤقت" : "Interactive placeholder"}</p>
      {title ? <h2>{title}</h2> : null}
      {purpose ? <p>{purpose}</p> : null}
      <div className="info-block interaction-meta">
        <p>
          <strong>{language === "ar" ? "الفئة" : "Category"}:</strong> <code>{category}</code>
        </p>
        <p>
          <strong>{language === "ar" ? "النوع" : "Kind"}:</strong> <code>{kind}</code>
        </p>
        <p>
          <strong>ID:</strong> <code>{displayValue(interaction?.id ?? visualization?.id)}</code>
        </p>
        <p>
          <strong>{language === "ar" ? "المسار" : "Path"}:</strong> <code>{displayValue(visualization?.path)}</code>
        </p>
        <p>
          <strong>{language === "ar" ? "ملف الإعدادات" : "Config path"}:</strong>{" "}
          <code>{displayValue(visualization?.config_path)}</code>
        </p>
      </div>
      {mediaRefs.length > 0 ? (
        <div className="info-block">
          <strong>{language === "ar" ? "وسائط مرتبطة" : "Media references"}</strong>
          <ul>
            {mediaRefs.map((media) => (
              <li key={media.id}>
                <code>{media.id}</code> - {t(media.caption ?? media.alt ?? media.label, language)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
