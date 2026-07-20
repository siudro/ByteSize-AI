# ByteSize AI

ByteSize AI is an Arabic-first, project-based AI learning platform. Learners move through a scrollable map, open short learning units called Bytes, complete a project output, earn a badge, and unlock connected Bytes.

This first version focuses on the content/data structure and rendering flow rather than final visual polish.

## Run the Project

```bash
npm install
npm run dev
```

Then open the local URL printed by Next.js, usually `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run build
```

## Folder Structure

```text
app/
  layout.tsx
  page.tsx
  map/page.tsx
  byte/[id]/page.tsx
components/
lib/
content/bytes/
public/badges/
```

The platform route flow is simple:

- `/map` shows the Byte map.
- `/byte/[id]` opens one Byte and renders one screen at a time.
- `app/content-media/[...path]/route.ts` serves media from Byte folders when files exist.

## How Byte Folders Work

Each Byte lives in its own folder under `content/bytes/`.

```text
content/bytes/L0-CORE-00/
  byte.yaml
  media/
    images/
    videos/
    audio/
    downloads/
  interactive/
    teach-the-machine/
      config.json
      README.md
```

The folder name should match the Byte `id` in `byte.yaml`.

## Add a New Byte

1. Create a folder such as `content/bytes/L1-ENG-01/`.
2. Add `byte.yaml`.
3. Add the media folders even if they start empty.
4. Add any interactive visualization folder under `interactive/`.
5. Add the new Byte id to another Byte's `map.unlocks` list if it should unlock later.

For learner-facing text, always use bilingual fields:

```yaml
title:
  ar: "العنوان العربي"
  en: "English title"
```

Arabic is the primary/default display language. English is secondary. If English is missing later, the renderer falls back to Arabic.

## How YAML Is Loaded

Server-side helpers in `lib/bytes.ts` read Byte folders from `content/bytes`, parse `byte.yaml` with the `yaml` package, and pass the data into React components.

The client renderer does not read files directly. It receives parsed Byte data from the Next.js route.

## Arabic, English, and RTL

The default HTML language is Arabic:

```tsx
<html lang="ar" dir="rtl">
```

The language helper in `lib/i18n.ts` renders Arabic by default and supports English as a secondary language. The `LanguageProvider` includes a simple language toggle and keeps the user's language choice in `localStorage`.

## Media Paths

Media references are declared once in `byte.yaml`:

```yaml
media:
  images:
    - id: ai_phone_recommendation
      path: "images/ai-phone-recommendation-placeholder.png"
```

Screens should use media refs:

```yaml
media:
  - type: image
    ref: ai_phone_recommendation
```

Paths are relative to the Byte media folder. If a file is missing, the renderer shows a graceful placeholder card with the media id and type.

## Interactive Visualizations

Interactive visualizations are declared in `tools.internal_visualizations`:

```yaml
tools:
  internal_visualizations:
    - id: teach_the_machine
      title:
        ar: "علّم الآلة"
        en: "Teach the Machine"
      path: "./interactive/teach-the-machine"
      config_path: "./interactive/teach-the-machine/config.json"
```

For now, the platform renders `InteractivePlaceholder`. It shows the visualization title, id, path, config path, purpose, and media references. Later, developers can replace that placeholder with a real React component while keeping the content contract stable.

## Screen Types

The renderer currently supports:

- `story`
- `media_gallery`
- `concept`
- `exercise`
- `interactive`
- `scenario`
- `project`
- `reflection`
- `connect_the_dots`
- `learner_feedback`
- `badge_award`

Unsupported types show a placeholder instead of breaking the Byte.

## Readiness Check

Readiness checks live under `learner_feedback` and are referenced from a screen:

```yaml
screens:
  - id: readiness_check
    type: learner_feedback
    feedback_ref: readiness_check
```

When the learner selects an option, the choice is saved in local progress. This first version does not block completion based on the answer.

## Progress and Unlocking

Progress is local-only for this first version.

- Initial unlocked Byte: `L0-CORE-00`
- Storage: `localStorage`
- Key: `bytesize-ai-progress-v1`
- Completing `L0-CORE-00` unlocks the Level 1 placeholder nodes from `map.unlocks`
- The map includes a reset progress button for testing

No authentication, database, backend, CMS, or user accounts are included yet.
