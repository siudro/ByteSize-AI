# ByteSize AI Design Guide

ByteSize AI is Arabic-first, learner-facing, and calm. The interface should feel like a focused learning tool: warm, clear, grounded, and a little crafted, without decorative excess.

## Visual Direction

- Arabic is the default experience. Layout, spacing, and reading rhythm should work naturally in RTL before checking LTR.
- Keep the UI quiet and instructional. Avoid marketing-page patterns, oversized decorative sections, generic AI visuals, glass effects, bokeh, and gradients.
- Prefer flat color, subtle borders, and soft shadows. Depth should clarify grouping, not decorate the page.
- Learner content stays in YAML. Components should only contain reusable UI copy.

## Color System

Use the existing CSS variables as the source of truth.

- `--bg` `#f6efe3`: warm page background. Use only for the app canvas.
- `--surface` `#fffaf2`: main panels and quiet filled controls.
- `--surface-strong` `#ffffff`: cards, inputs, option buttons, and controls that need clarity.
- `--ink` `#24211b`: primary text and active control fills.
- `--muted` `#6d665c`: supporting text.
- `--soft-muted` `#958b7d`: secondary metadata and dev notes.
- `--line` and `--line-strong`: default borders. Start here before introducing accent borders.
- `--gold` `#c8942e`: primary progress and focus accent. Use sparingly.
- `--blue`, `--orange`, `--violet`, `--emerald`: pathway identity colors. Keep them tied to pathways and success states, not general decoration.
- `--danger`: destructive or incorrect states only.

Color theory note: the palette is an analogous warm neutral base with restrained complementary accents. The warm background reduces visual harshness for reading, while ink creates strong contrast. Accent colors should be used as signals, not as large fills, so the page does not become visually noisy.

## Interaction States

- Focus states must never use browser-default black borders. Use `--focus-ring` with a subtle gold ring and keep the element border in the app palette.
- Active segmented controls should use `--ink` fill with `--surface-strong` text.
- Selected answer options should remain neutral until feedback appears. Correctness belongs in the feedback block, not in the option button.
- Hover states should be small: slight border emphasis or a quiet surface change. Avoid strong color shifts.
- Disabled states should reduce opacity without changing layout.

## Language Controls

- The Arabic and English language controls should feel like one family.
- Active language state uses dark ink fill, not beige or gold-tinted fills.
- Arabic variant controls are subordinate to العربية. Keep عامية/فصحى hidden by default and reveal them from the Arabic control as a centered custom popover; avoid native select dropdowns and speech-bubble tails for this control.
- Do not make language controls visually louder than navigation or progress.

## Inputs And Written Questions

- Written responses use `--surface-strong`, `--line`, and the shared focus ring.
- Avoid black focus borders, heavy outlines, or saturated fills.
- Textareas should feel calm and writable: generous padding, readable line-height, and no layout shift on focus.
- Keep placeholders instructional and concise. Do not move learner-specific prompts from YAML into components.

## Layout And Components

- Use reusable components in `components/` and follow existing class patterns before adding new ones.
- Keep cards for individual repeated items, inputs, placeholders, and panels. Do not nest cards inside cards.
- Keep border radius consistent: larger page panels may use the existing rounded treatment; compact controls use pills only when they are true controls.
- Maintain stable dimensions for buttons, options, progress, and map nodes so state changes do not cause layout jumps.
- Use text scale intentionally. Hero-scale type belongs on map intro or major screen titles only.

## Motion And Effects

- Motion should be short, purposeful, and tied to learning feedback or navigation state.
- Respect `prefers-reduced-motion`.
- Avoid gradients, glow-heavy effects, glassmorphism, and generic AI-styled decoration.
- Shadows should stay soft and low-opacity.

## Accessibility

- Keep strong contrast between text and surface colors.
- Every interactive element needs a visible keyboard focus state.
- Do not communicate correctness with color alone; pair it with feedback text.
- Check mobile RTL and desktop RTL before considering LTR complete.

## Update Checklist

Before merging UI changes:

- Does it use existing CSS variables instead of one-off colors?
- Does the focus state match `--focus-ring` and avoid black browser defaults?
- Does the Arabic version look native, balanced, and RTL-safe?
- Are active and selected states visually consistent with existing controls?
- Are there any gradients or generic AI-style decorative effects introduced?
- Does the change preserve local YAML content authoring?