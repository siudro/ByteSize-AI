"use client";

import { ExperienceControls } from "./ExperienceProvider";
import { LanguageToggle, useLanguage } from "./LanguageProvider";
import { MapNode } from "./MapNode";
import { useProgress } from "./ProgressProvider";
import { t } from "@/lib/i18n";
import type { ByteSummary, LocalizedText, NodeState } from "@/lib/schema";

type ByteMapProps = {
  bytes: ByteSummary[];
};

const LEVEL_COPY: Record<number, { title: LocalizedText; vibe: LocalizedText }> = {
  0: {
    title: { ar: "البايت الأول", ar_fusha: "البايت الأول", en: "The First Byte" },
    vibe: { ar: "نقطة الدخول. بايت واحد يفتح المستوى الأول.", ar_fusha: "نقطة البداية. بايت واحد يفتح المستوى الأول.", en: "The calm entry point. One Byte unlocks Level 1." }
  },
  1: {
    title: { ar: "أول تماس", ar_fusha: "أول تواصل", en: "First Contact" },
    vibe: { ar: "فضول واكتشاف للمسارات الأربعة.", ar_fusha: "فضول واكتشاف للمسارات الأربعة.", en: "Curiosity and pathway discovery." }
  },
  2: {
    title: { ar: "تبدأ الروابط", ar_fusha: "تبدأ الروابط", en: "Things Start Connecting" },
    vibe: { ar: "الأفكار تتقاطع وتبدأ المسارات بالوضوح.", ar_fusha: "تتقاطع الأفكار وتبدأ المسارات بالاتضاح.", en: "Ideas cross over and the pathways become clearer." }
  },
  3: {
    title: { ar: "فهم حقيقي يظهر", ar_fusha: "يظهر فهم حقيقي", en: "Real Understanding Emerging" },
    vibe: { ar: "مشاريع أكثر وقرارات أذكى.", ar_fusha: "مشاريع أكثر وقرارات أذكى.", en: "More projects and smarter decisions." }
  },
  4: {
    title: { ar: "كفاءة عميقة", ar_fusha: "كفاءة عميقة", en: "Deep Competence" },
    vibe: { ar: "تخصصات ومهارات قابلة للتطبيق.", ar_fusha: "تخصصات ومهارات قابلة للتطبيق.", en: "Specializations and applied skills." }
  },
  5: {
    title: { ar: "منطقة متقدمة", ar_fusha: "منطقة متقدمة", en: "Advanced Territory" },
    vibe: { ar: "مساحة للتحديات المتقدمة والإنجازات الكبيرة.", ar_fusha: "مساحة للتحديات المتقدمة والإنجازات الكبيرة.", en: "Advanced challenges and bigger achievements." }
  }
};

export function ByteMap({ bytes }: ByteMapProps) {
  const { language, arabicVariant } = useLanguage();
  const { loaded, isUnlocked, isCompleted, resetProgress } = useProgress();
  const levels = [0, 1, 2, 3, 4, 5];

  function nodeState(byte: ByteSummary): NodeState {
    if (isCompleted(byte.id)) return "completed";
    if (!isUnlocked(byte.id)) return "locked";
    return byte.level === 0 ? "active" : "unlocked";
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <span className="brand-title">ByteSize AI</span>
            <p className="eyebrow">{t({ ar: "الخارطة", ar_fusha: "الخريطة", en: "Map" }, language, arabicVariant)}</p>
          </div>
        </div>
        <div className="topbar-controls">
          <ExperienceControls />
          <LanguageToggle />
        </div>
      </header>

      <section className="map-intro">
        <div>
          <h1>{t({ ar: "تبسيط الذكاء الاصطناعي في بايتات صغيرة", ar_fusha: "تعلّم الذكاء الاصطناعي في بايتات صغيرة", en: "Learn AI in small, digestible Bytes" }, language, arabicVariant)}</h1>
          <p>
            {t(
              {
                ar: "ابدأ من المستوى صفر. كل بايت يفتح فكرة ومشروع ولقيمات جديدة في الأسفل.",
                ar_fusha: "ابدأ من المستوى صفر. كل بايت يفتح فكرة ومشروعًا وعقدًا جديدة في الأسفل.",
                en: "Start at Level 0. Each Byte opens an idea, a small project, and new nodes below."
              },
              language,
              arabicVariant
            )}
          </p>
        </div>
        <button className="button danger" type="button" onClick={resetProgress}>
          {t({ ar: "إعادة ضبط التقدم", ar_fusha: "إعادة ضبط التقدم", en: "Reset progress" }, language, arabicVariant)}
        </button>
      </section>

      <section className="map-journey" aria-busy={!loaded} aria-label={t({ ar: "خارطة التعلم", ar_fusha: "خريطة التعلم", en: "Learning map" }, language, arabicVariant)}>
        <svg className="map-lines" viewBox="0 0 1000 1780" preserveAspectRatio="none" aria-hidden="true">
          <path className="path-professional" d="M500 230 C500 305 125 340 125 465" />
          <path className="path-creative" d="M500 230 C500 305 375 340 375 465" />
          <path className="path-maker" d="M500 230 C500 305 625 340 625 465" />
          <path className="path-engineering" d="M500 230 C500 305 875 340 875 465" />
          <path className="path-neutral" d="M125 530 C235 640 365 645 500 760" />
          <path className="path-neutral" d="M375 530 C420 640 465 665 500 760" />
          <path className="path-neutral" d="M625 530 C580 640 535 665 500 760" />
          <path className="path-neutral" d="M875 530 C765 640 635 645 500 760" />
          <path className="path-neutral" d="M500 825 C430 930 430 980 500 1045" />
          <path className="path-neutral" d="M500 1120 C570 1230 570 1280 500 1340" />
        </svg>

        {levels.map((level) => {
          const copy = LEVEL_COPY[level];
          const levelBytes = bytes.filter((byte) => byte.level === level);
          return (
            <div className={`level-band level-${level}`} key={level}>
              <div className="level-header">
                <div>
                  <p className="eyebrow">{t({ ar: `المستوى ${level}`, ar_fusha: `المستوى ${level}`, en: `Level ${level}` }, language, arabicVariant)}</p>
                  <h2>{t(copy.title, language, arabicVariant)}</h2>
                  <p>{t(copy.vibe, language, arabicVariant)}</p>
                </div>
              </div>
              <div className="node-grid">
                {levelBytes.map((byte) => (
                  <MapNode byte={byte} key={byte.id} language={language} arabicVariant={arabicVariant} state={nodeState(byte)} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
