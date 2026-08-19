"use client";

import type { ReactNode } from "react";
import { t } from "@/lib/i18n";
import type { ArabicVariantCode, InternalVisualization, LanguageCode, ScreenInteraction } from "@/lib/schema";
import { AIComputeScaleLab } from "./AIComputeScaleLab";
import { GuidedPixelCharacter } from "./GuidedPixelCharacter";
import { MatrixBasicsLab } from "./MatrixBasicsLab";
import { PixelTransformationLab } from "./PixelTransformationLab";
import { SaudiCafeMatrix } from "./SaudiCafeMatrix";
import { SpiceShelf } from "./SpiceShelf";
import { TungPixelZoom } from "./TungPixelZoom";
import type { InteractionComponentProps, InteractionState } from "./types";

type InteractionRendererProps = {
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
  direction: "rtl" | "ltr";
  interaction?: ScreenInteraction;
  visualization?: InternalVisualization;
  savedState: InteractionState;
  relatedStates?: Record<string, InteractionState>;
  onStateChange: (state: InteractionState) => void;
  onComplete: (state?: InteractionState) => void;
};

type ComponentType = (props: InteractionComponentProps) => ReactNode;

const REGISTRY: Record<string, ComponentType> = {
  "tung-pixel-zoom": TungPixelZoom,
  TungPixelZoom,
  "matrix-basics": MatrixBasicsLab,
  MatrixBasicsLab,
  "pixel-character": GuidedPixelCharacter,
  GuidedPixelCharacter,
  "badge-builder": GuidedPixelCharacter,
  "saudi-cafe-matrix": SaudiCafeMatrix,
  SaudiCafeMatrix,
  "spice-shelf": SpiceShelf,
  SpiceShelf,
  "pixel-transform": PixelTransformationLab,
  PixelTransformationLab,
  "ai-compute-scale": AIComputeScaleLab,
  AIComputeScaleLab
};

function componentKey(interaction?: ScreenInteraction, visualization?: InternalVisualization) {
  const config = interaction?.config ?? {};
  const visualizationComponentKey = (visualization as { component_key?: unknown } | undefined)?.component_key;
  const candidate =
    (typeof config.component_key === "string" ? config.component_key : undefined) ??
    (typeof visualizationComponentKey === "string" ? visualizationComponentKey : undefined) ??
    visualization?.type ??
    visualization?.id ??
    interaction?.id;
  return candidate ?? "";
}

function stageValue(interaction?: ScreenInteraction) {
  const config = interaction?.config ?? {};
  return typeof config.stage === "string" ? config.stage : undefined;
}

export function InteractionRenderer(props: InteractionRendererProps) {
  const key = componentKey(props.interaction, props.visualization);
  const Component = REGISTRY[key];
  const config = props.interaction?.config ?? {};
  const stage = stageValue(props.interaction);

  if (!Component) {
    return (
      <div className="interaction-card" role="status">
        <strong>{t({ ar: "النشاط غير جاهز", ar_fusha: "النشاط غير جاهز", en: "Activity unavailable" }, props.language, props.arabicVariant)}</strong>
        <p>
          {t(
            {
              ar: "تقدر تكمل بالنسخة الثابتة في الشاشة. ما فيه شيء تحتاج تصلحه.",
              ar_fusha: "يمكنك المتابعة بالنسخة الثابتة في الشاشة. لا يوجد شيء تحتاج إلى إصلاحه.",
              en: "You can continue with the static version on this screen. There is nothing you need to fix."
            },
            props.language,
            props.arabicVariant
          )}
        </p>
      </div>
    );
  }

  return (
    <Component
      language={props.language}
      arabicVariant={props.arabicVariant}
      direction={props.direction}
      config={config}
      stage={stage}
      savedState={props.savedState}
      relatedStates={props.relatedStates}
      interaction={props.interaction}
      visualization={props.visualization}
      onStateChange={props.onStateChange}
      onComplete={props.onComplete}
    />
  );
}
