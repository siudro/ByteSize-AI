"use client";

import { ExperienceControls } from "./ExperienceProvider";
import { LanguageToggle, useLanguage } from "./LanguageProvider";
import { MapNode } from "./MapNode";
import { useProgress } from "./ProgressProvider";
import type { ByteSummary, NodeState } from "@/lib/schema";

type ByteMapProps = {
  bytes: ByteSummary[];
};

const LEVEL_COPY: Record<number, { arTitle: string; enTitle: string; arVibe: string; enVibe: string }> = {
  0: {
    arTitle: "البايت الأول",
    enTitle: "The First Byte",
    arVibe: "نقطة الدخول. بايت واحد يفتح المستوى الأول.",
    enVibe: "The calm entry point. One Byte unlocks Level 1."
  },
  1: {
    arTitle: "أول تماس",
    enTitle: "First Contact",
    arVibe: "فضول واكتشاف للمسارات الأربعة.",
    enVibe: "Curiosity and pathway discovery."
  },
  2: {
    arTitle: "تبدأ الروابط",
    enTitle: "Things Start Connecting",
    arVibe: "الأفكار تتقاطع وتبدأ المسارات بالوضوح.",
    enVibe: "Ideas cross over and the pathways become clearer."
  },
  3: {
    arTitle: "فهم حقيقي يظهر",
    enTitle: "Real Understanding Emerging",
    arVibe: "مشاريع أكثر وقرارات أذكى.",
    enVibe: "More projects and smarter decisions."
  },
  4: {
    arTitle: "كفاءة عميقة",
    enTitle: "Deep Competence",
    arVibe: "تخصصات ومهارات قابلة للتطبيق.",
    enVibe: "Specializations and applied skills."
  },
  5: {
    arTitle: "منطقة متقدمة",
    enTitle: "Advanced Territory",
    arVibe: "مساحة للتحديات المتقدمة والإنجازات الكبيرة.",
    enVibe: "Advanced challenges and bigger achievements."
  }
};

export function ByteMap({ bytes }: ByteMapProps) {
  const { language } = useLanguage();
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
            <p className="eyebrow">{language === "ar" ? "الخارطة" : "Map"}</p>
          </div>
        </div>
        <div className="topbar-controls">
          <ExperienceControls />
          <LanguageToggle />
        </div>
      </header>

      <section className="map-intro">
        <div>
          <h1>{language === "ar" ? "تبسيط الذكاء الاصطناعي في بايتات صغيرة" : "Learn AI in small, digestible Bytes"}</h1>
          <p>
            {language === "ar"
              ? "ابدأ من المستوى صفر. كل بايت يفتح فكرة ومشروع ولقيمات جديدة في الأسفل."
              : "Start at Level 0. Each Byte opens an idea, a small project, and new nodes below."}
          </p>
        </div>
        <button className="button danger" type="button" onClick={resetProgress}>
          {language === "ar" ? "إعادة ضبط التقدم" : "Reset progress"}
        </button>
      </section>

      <section className="map-journey" aria-busy={!loaded} aria-label={language === "ar" ? "خارطة التعلم" : "Learning map"}>
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
                  <p className="eyebrow">{language === "ar" ? `المستوى ${level}` : `Level ${level}`}</p>
                  <h2>{language === "ar" ? copy.arTitle : copy.enTitle}</h2>
                  <p>{language === "ar" ? copy.arVibe : copy.enVibe}</p>
                </div>
              </div>
              <div className="node-grid">
                {levelBytes.map((byte) => (
                  <MapNode byte={byte} key={byte.id} language={language} state={nodeState(byte)} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}


