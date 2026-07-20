import type { Byte, ByteSummary, LocalizedText } from "./schema";

type PlaceholderInput = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  level: number;
  pathway: string;
  label: LocalizedText;
  order: number;
  content: LocalizedText;
};

function placeholderByte(input: PlaceholderInput): Byte {
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle,
    level: input.level,
    primary_pathway: input.pathway,
    status: "placeholder",
    map: {
      node_label: input.label,
      node_icon: "lock",
      position: { level_band: input.level, order: input.order }
    },
    screens: [
      {
        id: "placeholder",
        type: "story",
        title: { ar: "هذا البايت قادم لاحقًا", en: "This Byte is coming next" },
        content: input.content
      }
    ]
  };
}

export const PLACEHOLDER_BYTES: Byte[] = [
  placeholderByte({
    id: "L1-ENG-01",
    title: { ar: "كيف تُبنى أنظمة الذكاء الاصطناعي؟", en: "How Are AI Systems Built?" },
    subtitle: { ar: "مدخل مسار الهندسة", en: "Engineer pathway entry" },
    level: 1,
    pathway: "engineering",
    label: { ar: "الهندسة", en: "Engineering" },
    order: 1,
    content: {
      ar: "هذه عقدة مؤقتة لمسار الهندسة. لاحقًا ستتعلم كيف تعمل البيانات والنماذج والتقييم معًا.",
      en: "This is a temporary engineering node. Later, you will learn how data, models, and evaluation work together."
    }
  }),
  placeholderByte({
    id: "L1-MAK-01",
    title: { ar: "اصنع شيئًا أذكى", en: "Make Something Smarter" },
    subtitle: { ar: "مدخل مسار الصانع", en: "Maker pathway entry" },
    level: 1,
    pathway: "maker",
    label: { ar: "الصانع", en: "Maker" },
    order: 2,
    content: {
      ar: "هذه عقدة مؤقتة لمسار الصانع. لاحقًا ستبني مشروعًا يستخدم الذكاء الاصطناعي لتحسين شيء ملموس.",
      en: "This is a temporary maker node. Later, you will build a project that uses AI to improve something tangible."
    }
  }),
  placeholderByte({
    id: "L1-CRE-01",
    title: { ar: "الذكاء الاصطناعي كشريك إبداعي", en: "AI as a Creative Partner" },
    subtitle: { ar: "مدخل مسار الإبداع", en: "Creative pathway entry" },
    level: 1,
    pathway: "creative",
    label: { ar: "الإبداع", en: "Creative" },
    order: 3,
    content: {
      ar: "هذه عقدة مؤقتة لمسار الإبداع. لاحقًا ستجرب كيف يساعدك الذكاء الاصطناعي في النص والصورة والصوت.",
      en: "This is a temporary creative node. Later, you will try AI as a partner in text, image, and sound."
    }
  }),
  placeholderByte({
    id: "L1-PRO-01",
    title: { ar: "الذكاء الاصطناعي في العمل", en: "AI at Work" },
    subtitle: { ar: "مدخل مسار المحترف", en: "Professional pathway entry" },
    level: 1,
    pathway: "professional",
    label: { ar: "العمل", en: "Professional" },
    order: 4,
    content: {
      ar: "هذه عقدة مؤقتة لمسار العمل. لاحقًا ستستخدم الذكاء الاصطناعي لتحسين الإنتاجية واتخاذ القرار.",
      en: "This is a temporary professional node. Later, you will use AI to improve productivity and decisions."
    }
  }),
  placeholderByte({
    id: "L2-CON-01",
    title: { ar: "روابط أعمق", en: "Deeper Links" },
    subtitle: { ar: "الأفكار تبدأ بالتقاطع", en: "Ideas begin to cross" },
    level: 2,
    pathway: "future",
    label: { ar: "قادم", en: "Coming" },
    order: 1,
    content: { ar: "مستوى لاحق قيد التخطيط.", en: "A later level in planning." }
  }),
  placeholderByte({
    id: "L3-UND-01",
    title: { ar: "فهم عملي", en: "Applied Understanding" },
    subtitle: { ar: "مشاريع أكثر وضوحًا", en: "Clearer projects" },
    level: 3,
    pathway: "future",
    label: { ar: "قادم", en: "Coming" },
    order: 1,
    content: { ar: "مستوى لاحق قيد التخطيط.", en: "A later level in planning." }
  }),
  placeholderByte({
    id: "L4-SPEC-01",
    title: { ar: "تخصصات", en: "Specializations" },
    subtitle: { ar: "مهارات عميقة", en: "Deeper skill" },
    level: 4,
    pathway: "future",
    label: { ar: "قادم", en: "Coming" },
    order: 1,
    content: { ar: "مستوى لاحق قيد التخطيط.", en: "A later level in planning." }
  }),
  placeholderByte({
    id: "L5-ADV-01",
    title: { ar: "أرض متقدمة", en: "Advanced Territory" },
    subtitle: { ar: "تحديات وإنجازات", en: "Challenges and achievements" },
    level: 5,
    pathway: "future",
    label: { ar: "قادم", en: "Coming" },
    order: 1,
    content: { ar: "مستوى لاحق قيد التخطيط.", en: "A later level in planning." }
  })
];

export const PLACEHOLDER_BYTE_SUMMARIES: ByteSummary[] = PLACEHOLDER_BYTES.map((byte) => ({
  id: byte.id,
  title: byte.title,
  subtitle: byte.subtitle,
  level: byte.level,
  primary_pathway: byte.primary_pathway,
  status: byte.status,
  map: byte.map
}));

export function getPlaceholderByte(id: string): Byte | null {
  return PLACEHOLDER_BYTES.find((byte) => byte.id === id) ?? null;
}
