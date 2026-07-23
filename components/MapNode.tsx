import Link from "next/link";
import { t } from "@/lib/i18n";
import type { ArabicVariantCode, ByteSummary, LanguageCode, LocalizedText, NodeState } from "@/lib/schema";

type MapNodeProps = {
  byte: ByteSummary;
  state: NodeState;
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
};

const STATE_LABELS: Record<NodeState, LocalizedText> = {
  locked: { ar: "مغلق", ar_fusha: "مغلق", en: "Locked" },
  unlocked: { ar: "مفتوح", ar_fusha: "مفتوح", en: "Unlocked" },
  active: { ar: "ابدأ من هنا", ar_fusha: "ابدأ من هنا", en: "Start here" },
  completed: { ar: "مكتمل", ar_fusha: "مكتمل", en: "Completed" }
};

const PATHWAY_LABELS: Record<string, LocalizedText & { color: string }> = {
  core: { ar: "الأساس", ar_fusha: "الأساس", en: "Core", color: "var(--gold)" },
  engineering: { ar: "الهندسة", ar_fusha: "الهندسة", en: "Engineering", color: "var(--blue)" },
  maker: { ar: "الصناعة", ar_fusha: "الصناعة", en: "Maker", color: "var(--orange)" },
  creative: { ar: "الإبداع", ar_fusha: "الإبداع", en: "Creative", color: "var(--violet)" },
  professional: { ar: "العمل", ar_fusha: "العمل", en: "Professional", color: "var(--emerald)" },
  future: { ar: "قادم", ar_fusha: "قادم", en: "Future", color: "var(--soft-muted)" }
};

export function MapNode({ byte, state, language, arabicVariant }: MapNodeProps) {
  const title = t(byte.map?.node_label ?? byte.title, language, arabicVariant);
  const subtitle = t(byte.subtitle, language, arabicVariant);
  const pathway = PATHWAY_LABELS[byte.primary_pathway] ?? PATHWAY_LABELS.future;
  const style = { "--path-color": pathway.color } as React.CSSProperties;
  const content = (
    <>
      <span className="node-state">{t(STATE_LABELS[state], language, arabicVariant)}</span>
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
      <small>{t(pathway, language, arabicVariant)}</small>
    </>
  );

  if (state === "locked") {
    return (
      <div className="map-node locked" style={style}>
        {content}
      </div>
    );
  }

  return (
    <Link className={`map-node ${state}`} href={`/byte/${byte.id}`} aria-label={title} style={style}>
      {content}
    </Link>
  );
}
