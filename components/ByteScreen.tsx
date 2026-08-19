"use client";

import { useEffect, useMemo, useState } from "react";
import { InteractionRenderer } from "./interactions/InteractionRenderer";
import { MediaBlock } from "./MediaBlock";
import { TimerInteraction } from "./TimerInteraction";
import { useProgress } from "./ProgressProvider";
import { t } from "@/lib/i18n";
import { getMediaIndex, getVisualization } from "@/lib/media";
import { normalizeTimerConfig } from "@/lib/timer";
import type { ArabicVariantCode, Byte, ByteScreen as ByteScreenData, LanguageCode, LocalizedField, ScreenInteraction, ScreenMedia } from "@/lib/schema";

type ByteScreenProps = {
  byte: Byte;
  screen: ByteScreenData;
  language: LanguageCode;
  arabicVariant: ArabicVariantCode;
  direction: "rtl" | "ltr";
  onReady?: () => void;
  onReview?: () => void;
  onAnswerStateChange?: (answered: boolean) => void;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function localized(value: unknown): LocalizedField {
  if (typeof value === "string" || value === null || value === undefined) return value;
  if (isRecord(value)) return value as LocalizedField;
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function screenMediaFromRecord(value: UnknownRecord): ScreenMedia | null {
  const type = stringValue(value.type);
  const ref = stringValue(value.ref);
  if (!type || !ref) return null;
  if (!["image", "video", "audio", "download", "model"].includes(type)) return null;
  return { type: type as ScreenMedia["type"], ref };
}

function hasInlineExercise(screen: ByteScreenData) {
  return Boolean(screen.question && Array.isArray(screen.options) && screen.correct_answer);
}

function feedbackText(feedback: unknown, selectedIsCorrect: boolean, language: LanguageCode, arabicVariant: ArabicVariantCode) {
  if (!feedback) return "";
  if (typeof feedback === "string") return feedback;
  if (isRecord(feedback)) {
    const branch = selectedIsCorrect ? feedback.correct : feedback.incorrect;
    return t(localized(branch), language, arabicVariant) || t(localized(feedback), language, arabicVariant);
  }
  return "";
}

function interactionFromRecord(value: unknown): ScreenInteraction | undefined {
  return isRecord(value) ? (value as ScreenInteraction) : undefined;
}

export function ByteScreen({
  byte,
  screen,
  language,
  arabicVariant,
  direction,
  onReady,
  onReview,
  onAnswerStateChange
}: ByteScreenProps) {
  const storageKey = `${byte.id}:${screen.id}`;
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedReadiness, setSelectedReadiness] = useState<string | null>(null);
  const { progress, saveReadinessChoice, saveReflection, saveProjectOutput, saveInteractionState, saveExerciseAttempt } = useProgress();
  const [reflection, setReflection] = useState(progress.reflections[storageKey] ?? "");
  const [projectOutput, setProjectOutput] = useState<Record<string, string>>(progress.projectOutputs[storageKey] ?? {});
  const mediaIndex = useMemo(() => getMediaIndex(byte), [byte]);
  const title = t(screen.title, language, arabicVariant);
  const intro = t(screen.content ?? screen.instruction ?? screen.prompt, language, arabicVariant);
  const bullets = Array.isArray(screen.bullets) ? screen.bullets.map((item) => t(localized(item), language, arabicVariant)).filter(Boolean) : [];

  useEffect(() => {
    const savedReflection = progress.reflections[storageKey] ?? "";
    setReflection(savedReflection);
  }, [storageKey, progress.reflections]);

  useEffect(() => {
    setSelectedAnswer(null);
    setSelectedReadiness(null);

    if (screen.type === "reflection") {
      onAnswerStateChange?.(reflection.trim().length >= 15);
    }
  }, [screen.id]);

  function renderMedia(media = screen.media ?? [], allowMultiple = false) {
    if (media.length === 0) return null;
    const visibleMedia = allowMultiple ? media : media.slice(0, 1);
    return (
      <div className="main-media">
        <div className="media-grid">
          {visibleMedia.map((item) => (
            <MediaBlock
              byteId={byte.id}
              key={`${item.type}-${item.ref}`}
              language={language}
              arabicVariant={arabicVariant}
              media={item}
              mediaItem={mediaIndex[item.ref]}
            />
          ))}
        </div>
      </div>
    );
  }

  function renderGallery() {
    const items = records(screen.items);
    return (
      <div className="media-grid">
        {items.map((item, index) => {
          const media = screenMediaFromRecord(item);
          return (
            <div className="info-block" key={`${stringValue(item.ref) ?? index}`}>
              {media ? <MediaBlock byteId={byte.id} language={language} arabicVariant={arabicVariant} media={media} mediaItem={mediaIndex[media.ref]} /> : null}
              <h3>{t(localized(item.label), language, arabicVariant)}</h3>
              <p>{t(localized(item.explanation), language, arabicVariant)}</p>
            </div>
          );
        })}
      </div>
    );
  }

  function renderExercise(exerciseData: unknown = screen) {
    const exercise = isRecord(exerciseData) ? exerciseData : screen;
    const options = records(exercise.options);
    const correctAnswer = stringValue(exercise.correct_answer);
    const requireCorrectAnswer = booleanValue(exercise.require_correct_answer);
    const question = t(localized(exercise.question), language, arabicVariant);
    const hasSelection = Boolean(selectedAnswer);
    const selectedIsCorrect = correctAnswer ? selectedAnswer === correctAnswer : hasSelection;
    const fallbackFeedback = selectedIsCorrect
      ? t(
          {
            ar: "صحيح. لاحظت الفكرة المطلوبة وربطتها بالدليل في الشاشة.",
            ar_fusha: "صحيح. لاحظت الفكرة المطلوبة وربطتها بالدليل في الشاشة.",
            en: "Correct. You noticed the key idea and connected it to the evidence on this screen."
          },
          language,
          arabicVariant
        )
      : t(
          {
            ar: "اقتربت. جرّب مرة أخرى وابحث عن الدليل المرتبط بالبيانات أو النمط.",
            ar_fusha: "اقتربت. جرّب مرة أخرى وابحث عن الدليل المرتبط بالبيانات أو النمط.",
            en: "Close. Try again and look for the evidence tied to the data or pattern."
          },
          language,
          arabicVariant
        );
    const feedback = feedbackText(exercise.feedback, selectedIsCorrect, language, arabicVariant) || fallbackFeedback;

    return (
      <div className="screen-content">
        {question ? <h2>{question}</h2> : null}
        <div className="option-grid">
          {options.map((option) => {
            const id = stringValue(option.id) ?? t(localized(option.label), language, arabicVariant);

            return (
              <button
                className="option-button"
                key={id}
                type="button"
                aria-pressed={selectedAnswer === id}
                onClick={() => {
                  const correct = correctAnswer ? id === correctAnswer : true;

                  setSelectedAnswer(id);
                  saveExerciseAttempt(storageKey, id, correct);
                  onAnswerStateChange?.(requireCorrectAnswer ? correct : true);
                }}
              >
                {t(localized(option.label), language, arabicVariant)}
              </button>
            );
          })}
        </div>

        {selectedAnswer ? <div className={`feedback ${selectedIsCorrect ? "correct" : "incorrect"}`}>{feedback}</div> : null}
      </div>
    );
  }

  function renderConceptCards() {
    const cards = records(screen.cards);
    if (cards.length === 0) return null;
    return (
      <div className={`screen-content ${screen.id === "hook_promise" ? "investigation-steps" : ""}`}>
        {cards.map((card) => (
          <div className="info-block" key={stringValue(card.id) ?? t(localized(card.title), language, arabicVariant)}>
            <h3>{t(localized(card.title), language, arabicVariant)}</h3>
            <p>{t(localized(card.body), language, arabicVariant)}</p>
          </div>
        ))}
      </div>
    );
  }

  function renderProject() {
    const output = isRecord(screen.output) ? screen.output : {};
    const fields = records(output.required_fields);
    return (
      <div className="screen-content">
        {renderMedia(screen.media)}
        <div className="field-grid">
          {fields.map((field) => {
            const id = stringValue(field.id) ?? t(localized(field.label), language, arabicVariant);
            const label = t(localized(field.label), language, arabicVariant);
            return (
              <label className="info-block" key={id}>
                <strong>{label}</strong>
                <textarea
                  className="text-field"
                  aria-label={label}
                  value={projectOutput[id] ?? ""}
                  onChange={(event) => {
                    const nextOutput = { ...projectOutput, [id]: event.target.value };
                    setProjectOutput(nextOutput);
                    saveProjectOutput(storageKey, nextOutput);
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  function renderReflection() {
    return (
      <div className="screen-content">
        <textarea
          className="text-field"
          aria-label={t(screen.prompt, language, arabicVariant)}
          placeholder={t(localized(screen.placeholder) ?? screen.prompt, language, arabicVariant)}
          value={reflection}
          onChange={(event) => {
            const value = event.target.value;
            setReflection(value);
            saveReflection(storageKey, value);
            onAnswerStateChange?.(value.trim().length >= 15);
          }}
        />
      </div>
    );
  }

  function renderTimer() {
    const timer = normalizeTimerConfig(screen.timer ?? screen, screen.duration_seconds);

    if (!timer) {
      return (
        <div className="placeholder-card">
          <p>{t({ ar: "هذا المؤقت يحتاج مدة صالحة في المحتوى.", ar_fusha: "هذا المؤقت يحتاج مدة صالحة في المحتوى.", en: "This timer needs a valid duration in the content." }, language, arabicVariant)}</p>
        </div>
      );
    }

    return (
      <TimerInteraction
        timer={timer}
        language={language}
        arabicVariant={arabicVariant}
        onCompletedChange={(completed) => onAnswerStateChange?.(timer.completion_required === false ? true : completed)}
      />
    );
  }

  function renderLearnerFeedback() {
    const feedbackRoot = isRecord(byte.learner_feedback) ? byte.learner_feedback : {};
    const feedbackRef = screen.feedback_ref ?? "";
    const rawFeedback = feedbackRoot[feedbackRef];
    const feedback: UnknownRecord = isRecord(rawFeedback) ? rawFeedback : {};
    const options = records(feedback.options);
    const chosenOption = options.find((option) => stringValue(option.id) === selectedReadiness);

    return (
      <div className="screen-content">
        <h2>{t(localized(feedback.title), language, arabicVariant)}</h2>
        <p>{t(localized(feedback.prompt), language, arabicVariant)}</p>
        <div className="option-grid">
          {options.map((option) => {
            const id = stringValue(option.id) ?? t(localized(option.label), language, arabicVariant);
            return (
              <button
                className="option-button"
                key={id}
                type="button"
                aria-pressed={selectedReadiness === id}
                onClick={() => {
                  setSelectedReadiness(id);
                  saveReadinessChoice(byte.id, id);
                  onAnswerStateChange?.(true);
                  if (id === "ready") onReady?.();
                  if (id === "review") onReview?.();
                }}
              >
                {t(localized(option.label), language, arabicVariant)}
              </button>
            );
          })}
        </div>
        {chosenOption ? <div className="feedback correct">{t(localized(chosenOption.result_message), language, arabicVariant)}</div> : null}
        <p>{t(localized(feedback.self_decision_note), language, arabicVariant)}</p>
      </div>
    );
  }

  function renderConnectTheDots() {
    const blocks = [
      { label: { ar: "ما الذي حدث؟", ar_fusha: "ما الذي حدث؟", en: "What happened?" }, value: screen.what_happened },
      { label: { ar: "لماذا يهم؟", ar_fusha: "لماذا يهم؟", en: "Why it matters" }, value: screen.why_it_matters },
      { label: { ar: "إلى أين يقود؟", ar_fusha: "إلى أين يقود؟", en: "Where it leads" }, value: screen.where_it_leads }
    ].filter((block) => t(block.value, language, arabicVariant));

    return (
      <div className="screen-content">
        {renderMedia(screen.media)}
        {blocks.map((block) => (
          <div className="info-block" key={t(block.label, language, arabicVariant)}>
            <h3>{t(block.label, language, arabicVariant)}</h3>
            <p>{t(block.value, language, arabicVariant)}</p>
          </div>
        ))}
      </div>
    );
  }

  function renderSectionTransition() {
    const sectionNumber = numberValue(screen.section_number) ?? 1;
    const totalSections = numberValue(screen.total_sections) ?? sectionNumber;
    const learned = t(screen.learned, language, arabicVariant);
    const next = t(screen.next, language, arabicVariant);
    const partLabel = language === "ar" ? `الجزء ${sectionNumber} من ${totalSections}` : `Part ${sectionNumber} of ${totalSections}`;

    return (
      <div className={`section-transition effect-${stringValue(screen.visual_effect_level) ?? "standard"}`}>
        <p className="eyebrow">{partLabel}</p>
        <div className="section-transition-ring" aria-hidden="true" />
        <div className="section-transition-grid">
          <div className="info-block section-learned">
            <h3>{t({ ar: "ما تعلمته", ar_fusha: "ما تعلمته", en: "What you learned" }, language, arabicVariant)}</h3>
            <p>{learned}</p>
          </div>
          {next ? (
            <div className="info-block section-next">
              <h3>{t({ ar: "ما التالي", ar_fusha: "ما التالي", en: "What comes next" }, language, arabicVariant)}</h3>
              <p>{next}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderInteraction() {
    const interaction = interactionFromRecord(screen.interaction);
    const visualizationRef = screen.interaction_ref ?? interaction?.visualization_ref;
    const visualization = getVisualization(byte, visualizationRef);
    const interactionState = progress.interactionStates[storageKey] ?? {};
    const relatedStates: Record<string, Record<string, unknown>> = {};
    for (const other of byte.screens ?? []) {
      if (other === screen || !other.id) continue;
      relatedStates[other.id] = progress.interactionStates[`${byte.id}:${other.id}`] ?? {};
    }
    const isWaterShock = interaction?.config?.stage === "water-shock";

    return (
      <div className={`screen-content ${isWaterShock ? "water-shock-screen" : ""}`}>
        <InteractionRenderer
          interaction={interaction}
          visualization={visualization}
          language={language}
          arabicVariant={arabicVariant}
          direction={direction}
          savedState={interactionState}
          relatedStates={relatedStates}
          onStateChange={(state) => saveInteractionState(storageKey, state)}
          onComplete={(state) => {
            saveInteractionState(storageKey, { ...interactionState, ...state, completed: true });
            onAnswerStateChange?.(true);
          }}
        />
        {screen.media?.length ? renderMedia(screen.media) : null}
        {screen.reflection_prompt ? <p>{t(screen.reflection_prompt, language, arabicVariant)}</p> : null}
      </div>
    );
  }
  function renderByType() {
    if (hasInlineExercise(screen)) return renderExercise(screen);
    if (screen.interaction_ref || screen.interaction) return renderInteraction();

    switch (screen.type) {
      case "timer":
        return renderTimer();
      case "section_transition":
        return renderSectionTransition();
      case "media_gallery":
      case "comparison":
        return renderGallery();
      case "exercise":
      case "micro_check":
        return renderExercise(screen.exercise ?? screen);
      case "scenario":
        return screen.exercise ? renderExercise(screen.exercise) : renderMedia(screen.media);
      case "concept":
        return (
          <>
            {renderMedia(screen.media)}
            {renderConceptCards()}
          </>
        );
      case "interactive":
        return renderInteraction();
      case "project_intro":
        return renderMedia(screen.media);
      case "project":
        return renderProject();
      case "reflection":
        return renderReflection();
      case "connect_the_dots":
        return renderConnectTheDots();
      case "learner_feedback":
        return renderLearnerFeedback();
      case "badge_award":
        return (
          <div className="screen-content">
            {renderMedia(screen.media)}
            <div className="feedback correct">
              {t(
                {
                  ar: "أنهيت هذا البايت وحفظت تقدمك. أصبح البايت التالي جاهزًا عندما تعود إلى الخارطة.",
                  ar_fusha: "أنهيت هذا البايت وحفظت تقدمك. أصبح البايت التالي جاهزًا عندما تعود إلى الخريطة.",
                  en: "You completed this Byte and saved your progress. The next node is ready when you return to the map."
                },
                language,
                arabicVariant
              )}
            </div>
          </div>
        );
      case "story":
      default:
        return renderMedia(screen.media);
    }
  }

  return (
    <article className={`screen-panel screen-type-${screen.type}`}>
      <h1>{title}</h1>
      {intro ? <p>{intro}</p> : null}
      {bullets.length > 0 ? (
        <ul className="lesson-brief">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <div className="screen-content">{renderByType()}</div>
    </article>
  );
}



