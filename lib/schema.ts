export type LanguageCode = "ar" | "en";
export type ArabicVariantCode = "saudi" | "standard";

export type LocalizedText = {
  ar?: string;
  ar_fusha?: string;
  en?: string;
};

export type LocalizedField = string | LocalizedText | undefined | null;

export type MediaKind = "image" | "video" | "audio" | "download" | "model";

export type MediaReference = {
  id: string;
  path: string;
  type?: MediaKind;
  alt?: LocalizedText;
  prompt?: LocalizedText;
  caption?: LocalizedText;
  transcript?: LocalizedText;
  label?: LocalizedText;
  usage?: string[];
};

export type ScreenMedia = {
  type: MediaKind;
  ref: string;
};

export type InteractionCategory = "navigation" | "thinking" | "manipulation" | "creation";

export type InteractionKind =
  | "tap"
  | "swipe"
  | "reveal"
  | "play"
  | "select"
  | "sort"
  | "match"
  | "compare"
  | "predict"
  | "sequence"
  | "identify_patterns"
  | "sliders"
  | "change_variables"
  | "test_scenarios"
  | "move_data_points"
  | "adjust_parameters"
  | "simulate_outcomes"
  | "write"
  | "record"
  | "photograph"
  | "draw"
  | "generate"
  | "modify"
  | "build"
  | string;

export type ScreenInteraction = {
  id?: string;
  category?: InteractionCategory | string;
  kind?: InteractionKind;
  title?: LocalizedText;
  prompt?: LocalizedText;
  visualization_ref?: string;
  required?: boolean;
  config?: Record<string, unknown>;
};

export type TimerStimulusMode = "low" | "standard" | "high";
export type TimerAlertIntensity = "none" | "soft" | "standard" | "high";

export type TimerAlertSettings = {
  visual?: boolean;
  audio?: boolean;
  intensity?: TimerAlertIntensity;
  message?: LocalizedText;
};

export type TimerAlertConfig = TimerAlertSettings & {
  stimulus?: Partial<Record<TimerStimulusMode, TimerAlertSettings>>;
};

export type TimerConfig = {
  duration_seconds: number;
  completion_required?: boolean;
  completion_feedback?: LocalizedText;
  alert?: TimerAlertConfig;
};

export type ByteScreenType =
  | "story"
  | "media_gallery"
  | "comparison"
  | "concept"
  | "micro_check"
  | "exercise"
  | "interactive"
  | "scenario"
  | "project_intro"
  | "project"
  | "reflection"
  | "connect_the_dots"
  | "learner_feedback"
  | "badge_award"
  | "section_transition"
  | "timer"
  | string;

export type ByteScreen = {
  id: string;
  type: ByteScreenType;
  title?: LocalizedText;
  subtitle?: LocalizedText;
  content?: LocalizedText;
  bullets?: LocalizedText[];
  instruction?: LocalizedText;
  prompt?: LocalizedText;
  question?: LocalizedText;
  options?: Array<Record<string, unknown>>;
  correct_answer?: string;
  require_correct_answer?: boolean;
  feedback?: LocalizedText | Record<string, unknown>;
  continue_label?: LocalizedText;
  media?: ScreenMedia[];
  items?: Array<Record<string, unknown>>;
  cards?: Array<Record<string, unknown>>;
  interaction_ref?: string;
  interaction?: ScreenInteraction;
  timer?: TimerConfig;
  duration_seconds?: number;
  completion_required?: boolean;
  completion_feedback?: LocalizedText;
  alert?: TimerAlertConfig;
  placeholder_note?: LocalizedText;
  reflection_prompt?: LocalizedText;
  exercise?: Record<string, unknown>;
  output?: Record<string, unknown>;
  what_happened?: LocalizedText;
  why_it_matters?: LocalizedText;
  where_it_leads?: LocalizedText;
  feedback_ref?: string;
  badge_ref?: string;
  section_number?: number;
  total_sections?: number;
  learned?: LocalizedText;
  next?: LocalizedText;
  visual_effect_level?: "low" | "standard" | "high" | string;
  minimum_time_seconds?: number;
  required?: boolean;
  [key: string]: unknown;
};

export type InternalVisualization = {
  id: string;
  title?: LocalizedText;
  type?: string;
  category?: InteractionCategory | string;
  kind?: InteractionKind;
  path?: string | null;
  config_path?: string | null;
  purpose?: LocalizedText;
  required?: boolean;
  media_refs?: string[];
};

export type Byte = {
  id: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  level: number;
  primary_pathway: string;
  estimated_duration_minutes?: number;
  status?: string;
  version?: string | number;
  language?: {
    default?: LanguageCode;
    default_arabic_variant?: ArabicVariantCode;
    direction?: "rtl" | "ltr";
    supported?: LanguageCode[];
    supported_arabic_variants?: ArabicVariantCode[];
    fallback?: LanguageCode;
    fallback_arabic_variant?: ArabicVariantCode;
  };
  map?: {
    node_label?: LocalizedText;
    node_icon?: string;
    pathway_color?: string;
    position?: {
      level_band?: number;
      order?: number;
    };
    unlocks?: string[];
    connections?: Array<Record<string, unknown>>;
  };
  badge?: Record<string, unknown>;
  learning_design?: Record<string, unknown>;
  audience?: Record<string, unknown>;
  experience_style?: Record<string, unknown>;
  media?: {
    base_path?: string;
    images?: MediaReference[];
    videos?: MediaReference[];
    audio?: MediaReference[];
    downloads?: MediaReference[];
    models?: MediaReference[];
  };
  tools?: {
    internal_visualizations?: InternalVisualization[];
    external_tools?: Array<Record<string, unknown>>;
  };
  makerspace_integration?: Record<string, unknown>;
  screens: ByteScreen[];
  assessment?: Record<string, unknown>;
  learner_feedback?: Record<string, unknown>;
  facilitator_notes?: Record<string, unknown>;
  developer_notes?: Record<string, unknown>;
};

export type ByteSummary = Pick<
  Byte,
  "id" | "title" | "subtitle" | "level" | "primary_pathway" | "status" | "map"
>;

export type NodeState = "locked" | "unlocked" | "active" | "completed";


