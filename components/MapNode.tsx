import Link from "next/link";
import { t } from "@/lib/i18n";
import type { ByteSummary, LanguageCode, NodeState } from "@/lib/schema";

type MapNodeProps = {
  byte: ByteSummary;
  state: NodeState;
  language: LanguageCode;
};

const STATE_LABELS: Record<NodeState, { ar: string; en: string }> = {
  locked: { ar: "مغلق", en: "Locked" },
  unlocked: { ar: "مفتوح", en: "Unlocked" },
  active: { ar: "ابدأ من هنا", en: "Start here" },
  completed: { ar: "مكتمل", en: "Completed" }
};

const PATHWAY_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  core: { ar: "الأساس", en: "Core", color: "var(--gold)" },
  engineering: { ar: "الهندسة", en: "Engineering", color: "var(--blue)" },
  maker: { ar: "الصناعة", en: "Maker", color: "var(--orange)" },
  creative: { ar: "الإبداع", en: "Creative", color: "var(--violet)" },
  professional: { ar: "العمل", en: "Professional", color: "var(--emerald)" },
  future: { ar: "قادم", en: "Future", color: "var(--soft-muted)" }
};

export function MapNode({ byte, state, language }: MapNodeProps) {
  const title = t(byte.map?.node_label ?? byte.title, language);
  const subtitle = t(byte.subtitle, language);
  const pathway = PATHWAY_LABELS[byte.primary_pathway] ?? PATHWAY_LABELS.future;
  const style = { "--path-color": pathway.color } as React.CSSProperties;
  const content = (
    <>
      <span className="node-state">{t(STATE_LABELS[state], language)}</span>
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
      <small>{t(pathway, language)}</small>
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
