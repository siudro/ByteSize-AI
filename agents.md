# ByteSize AI Agent Notes

This project is an Arabic-first Next.js and TypeScript prototype.

## Priorities

- Keep content authoring simple for semi-technical contributors.
- Keep learner-facing text bilingual using `{ ar, en }`.
- Treat Arabic as the default language and RTL as the default layout direction.
- Keep Byte data in local YAML files.
- Keep progress in `localStorage` until a later backend/CMS phase.
- Avoid adding authentication, accounts, databases, or CMS logic in this first version.

## Development Notes

- Use reusable components in `components/`.
- Keep schema changes compatible with existing `byte.yaml` files.
- Prefer graceful placeholders for missing media or unsupported screen types.
- Interactive visualizations should be developed separately and referenced through `tools.internal_visualizations`.
- Do not move learner-facing content into components unless it is generic UI copy.
