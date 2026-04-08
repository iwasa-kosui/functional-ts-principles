# Bilingual Support Design

## Goal

Provide both English and Japanese versions of all skill plugins and documentation. Adopt English for all future commit messages and PR descriptions. Retroactively update past PR titles and descriptions to English.

## Skill File Structure

Current Japanese skills are copied to `-ja` suffixed directories. The original directories are translated to English.

```
skills/
  functional-ts/            # English (translate from current Japanese)
  functional-ts-ja/         # Japanese (current content preserved)
  functional-ts-review/     # English
  functional-ts-review-ja/  # Japanese
```

Each `-ja` skill has its own `SKILL.md` with Japanese `name`, `description`, and `trigger` fields.

All sub-files (e.g., `error-handling.md`, `state-modeling.md`, `boundary-defense.md`, example `.ts` files, result library docs) are also translated in the English version and preserved as-is in the Japanese version.

## README

- `README.md` — English version (translated from current Japanese)
- `README.ja.md` — Japanese version (current content preserved)
- Each links to the other at the top.

## Past PRs (#1–#9)

Update titles and bodies to English via `gh pr edit`.

## Future Convention

All commit messages, PR titles, and PR descriptions are written in English going forward.
