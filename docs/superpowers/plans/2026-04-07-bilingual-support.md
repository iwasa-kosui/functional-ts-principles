# Bilingual Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide English and Japanese versions of all skills and documentation; update past PRs to English.

**Architecture:** Copy current Japanese skills to `-ja` directories, translate originals to English. Same for README. Update past PR titles/bodies via `gh pr edit`.

**Tech Stack:** Markdown, TypeScript (no changes to code logic), GitHub CLI

---

### Task 1: Create Japanese skill copies (functional-ts-ja)

**Files:**
- Create: `skills/functional-ts-ja/SKILL.md`
- Create: `skills/functional-ts-ja/error-handling.md`
- Create: `skills/functional-ts-ja/state-modeling.md`
- Create: `skills/functional-ts-ja/boundary-defense.md`
- Create: `skills/functional-ts-ja/examples/taxi-request.ts`
- Create: `skills/functional-ts-ja/examples/sensitive-type.ts`
- Create: `skills/functional-ts-ja/result-libraries/neverthrow.md`
- Create: `skills/functional-ts-ja/result-libraries/byethrow.md`
- Create: `skills/functional-ts-ja/result-libraries/fp-ts.md`
- Create: `skills/functional-ts-ja/result-libraries/option-t.md`

- [ ] **Step 1: Copy all functional-ts files to functional-ts-ja**

```bash
cp -r skills/functional-ts skills/functional-ts-ja
```

- [ ] **Step 2: Update SKILL.md frontmatter for Japanese version**

Change the frontmatter in `skills/functional-ts-ja/SKILL.md` to:

```yaml
---
name: functional-ts-ja
description: サーバーサイドTypeScriptでドメインモデル、ユースケース、リポジトリ、状態遷移、ビジネスロジックを書くときに使用する。Discriminated Union、純粋関数、Result型による関数型ドメインモデリングをガイドする。
---
```

- [ ] **Step 3: Commit**

```bash
git add skills/functional-ts-ja/
git commit -m "feat(skill): add functional-ts-ja as Japanese copy of functional-ts"
```

### Task 2: Create Japanese skill copy (functional-ts-review-ja)

**Files:**
- Create: `skills/functional-ts-review-ja/SKILL.md`

- [ ] **Step 1: Copy functional-ts-review to functional-ts-review-ja**

```bash
cp -r skills/functional-ts-review skills/functional-ts-review-ja
```

- [ ] **Step 2: Update SKILL.md frontmatter for Japanese version**

Change the frontmatter in `skills/functional-ts-review-ja/SKILL.md` to:

```yaml
---
name: functional-ts-review-ja
description: サーバーサイドTypeScriptコードを関数型ドメインモデリング原則に照らしてレビューする。class使用、メソッド記法、interface宣言、型アサーション、例外throw、網羅性チェック不足、PII保護をチェックする。
---
```

- [ ] **Step 3: Commit**

```bash
git add skills/functional-ts-review-ja/
git commit -m "feat(skill): add functional-ts-review-ja as Japanese copy of functional-ts-review"
```

### Task 3: Translate functional-ts/SKILL.md to English

**Files:**
- Modify: `skills/functional-ts/SKILL.md`

- [ ] **Step 1: Translate SKILL.md**

Translate all Japanese prose in `skills/functional-ts/SKILL.md` to English. Keep all code blocks, type definitions, and identifiers unchanged. The frontmatter `name` and `description` fields are already in English — keep them as-is.

Key translations for section headers and prose:

| Japanese | English |
|----------|---------|
| サーバーサイドTypeScriptでドメインモデルを書くときの原則。classベースのOOPではなく... | Principles for writing domain models in server-side TypeScript. Instead of class-based OOP... |
| 型によるドメインモデリング | Type-Driven Domain Modeling |
| Discriminated Unionで状態を表現する | Represent State with Discriminated Unions |
| 理由: | Rationale: |
| discriminantは `kind` で統一する | Use `kind` as the unified discriminant |
| Companion Objectパターン | Companion Object Pattern |
| `type` を使う（`interface` ではなく） | Use `type` (not `interface`) |
| 関数プロパティ記法を使う（メソッド記法ではなく） | Use function property notation (not method notation) |
| Branded Typesで意味を区別する | Distinguish meaning with Branded Types |
| `Readonly<>` で不変性を保証する | Ensure immutability with `Readonly<>` |
| ファイル構成: 1概念1ファイル | File structure: one concept per file |
| 関数による状態遷移 | State Transitions via Functions |
| 網羅性チェック | Exhaustiveness Checking |
| エラーハンドリング — Railway Oriented Programming | Error Handling — Railway Oriented Programming |
| 境界の防御 | Boundary Defense |
| 型アサーション（`as`）を使わない | Do not use type assertions (`as`) |
| PIIの防御 | PII Protection |
| 宣言的なスタイル | Declarative Style |
| 配列操作 | Array Operations |
| ドメインイベント | Domain Events |
| テストデータ | Test Data |
| 原則の適用について | Applying These Principles |

Translate all inline comments in code blocks (e.g., `// Good: 各状態が独立した型` → `// Good: Each state is an independent type`).

- [ ] **Step 2: Verify no Japanese remains**

```bash
grep -P '[\p{Hiragana}\p{Katakana}\p{Han}]' skills/functional-ts/SKILL.md
```

Expected: no output (no Japanese characters remain).

- [ ] **Step 3: Commit**

```bash
git add skills/functional-ts/SKILL.md
git commit -m "docs(skill): translate functional-ts/SKILL.md to English"
```

### Task 4: Translate functional-ts sub-files to English

**Files:**
- Modify: `skills/functional-ts/error-handling.md`
- Modify: `skills/functional-ts/state-modeling.md`
- Modify: `skills/functional-ts/boundary-defense.md`
- Modify: `skills/functional-ts/examples/taxi-request.ts`
- Modify: `skills/functional-ts/examples/sensitive-type.ts`
- Modify: `skills/functional-ts/result-libraries/neverthrow.md`
- Modify: `skills/functional-ts/result-libraries/byethrow.md`
- Modify: `skills/functional-ts/result-libraries/fp-ts.md`
- Modify: `skills/functional-ts/result-libraries/option-t.md`

- [ ] **Step 1: Translate error-handling.md**

Translate all Japanese prose and comments. Key items:
- Title: `# Error Handling Detailed Guide`
- Section: `## Railway Oriented Programming` (keep)
- Section: `## Error Type Design`
- Subsection: `### Error Type Granularity`
- Section: `## Composing Operations`
- Section: `## Error Conversion in the Controller Layer`
- Section: `## Where Exceptions Are Appropriate`

- [ ] **Step 2: Translate state-modeling.md**

Key items:
- Title: `# State Modeling Detailed Guide`
- Section: `## Designing State Transitions with Discriminated Unions`
- Subsection: `### Design Steps`
- Subsection: `### From State Diagram to Code`
- Subsection: `### Notes`
- Section: `## Domain Events`
- Subsection: `### Event Generation Responsibility`

Translate all inline code comments (e.g., `// 1. リクエスト取得 → 存在確認` → `// 1. Fetch request → verify existence`).

- [ ] **Step 3: Translate boundary-defense.md**

Key items:
- Title: `# Boundary Defense Detailed Guide`
- Section: `## Understanding the Limits of TypeScript's Type System`
- Section: `## Validation with Zod`
- Subsection: `### Use `safeParse``
- Subsection: `### Schema Factory: Automatic safeParse → Result Conversion`
- Section: `## Banning Type Assertions (`as`)`
- Section: `## PII Protection with the Sensitive Type`
- Section: `## Do Not Over-Defend Inside the Domain`

- [ ] **Step 4: Translate taxi-request.ts comments**

Translate JSDoc and inline comments:
- `タクシー配車リクエストの状態遷移モデル` → `Taxi dispatch request state transition model`
- `Discriminated Union + Companion Object + 純粋関数による状態遷移の実例。` → `Example of state transitions using Discriminated Union + Companion Object + pure functions.`

- [ ] **Step 5: Translate sensitive-type.ts comments**

Translate JSDoc:
- `Sensitive型ラッパーによるPII防御の実例` → `Example of PII protection using the Sensitive type wrapper`

- [ ] **Step 6: Translate result-libraries/*.md**

For each of `neverthrow.md`, `byethrow.md`, `fp-ts.md`, `option-t.md`:
- Translate table descriptions (e.g., `同期Result型` → `Synchronous Result type`)
- Translate section prose (e.g., `メソッドチェーンではなく` → `Instead of method chaining`)
- Translate inline code comments (e.g., `// 成功値を変換` → `// Transform the success value`, `// 1. リクエスト取得 → 存在確認` → `// 1. Fetch request → verify existence`)

- [ ] **Step 7: Verify no Japanese remains in functional-ts/**

```bash
grep -rP '[\p{Hiragana}\p{Katakana}\p{Han}]' skills/functional-ts/
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add skills/functional-ts/
git commit -m "docs(skill): translate functional-ts sub-files to English"
```

### Task 5: Translate functional-ts-review/SKILL.md to English

**Files:**
- Modify: `skills/functional-ts-review/SKILL.md`

- [ ] **Step 1: Translate SKILL.md**

Key translations:

| Japanese | English |
|----------|---------|
| サーバーサイドTypeScriptコードを関数型ドメインモデリング原則に照らしてレビューする | Review server-side TypeScript code against functional domain modeling principles |
| レビュー手順 | Review Procedure |
| チェック項目 | Checklist |
| ドメインモデルにclassを使っていないか | Are classes used for domain models? |
| メソッド記法を使っていないか | Is method notation used? |
| ドメイン型に `interface` を使っていないか | Is `interface` used for domain types? |
| `as` による型アサーションがないか | Are there `as` type assertions? |
| ドメイン層で例外をthrowしていないか | Are exceptions thrown in the domain layer? |
| switch文に assertNever があるか | Do switch statements have assertNever? |
| 外部境界にZodバリデーションがあるか | Is there Zod validation at external boundaries? |
| PIIフィールドにSensitiveラッパーがあるか | Do PII fields have Sensitive wrappers? |
| 指摘の書き方 | How to Write Findings |
| 重要度 | Severity |

Translate the severity table and all prose.

- [ ] **Step 2: Verify no Japanese remains**

```bash
grep -P '[\p{Hiragana}\p{Katakana}\p{Han}]' skills/functional-ts-review/SKILL.md
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add skills/functional-ts-review/SKILL.md
git commit -m "docs(skill): translate functional-ts-review/SKILL.md to English"
```

### Task 6: Translate README.md to English and create README.ja.md

**Files:**
- Modify: `README.md`
- Create: `README.ja.md`

- [ ] **Step 1: Copy current README.md to README.ja.md**

```bash
cp README.md README.ja.md
```

- [ ] **Step 2: Add language link to README.ja.md**

Prepend to `README.ja.md`:

```markdown
> English version: [README.md](README.md)
```

- [ ] **Step 3: Translate README.md to English**

```markdown
> 日本語版: [README.ja.md](README.ja.md)

# functional-ts-principles

Provides principles for practicing functional domain modeling in server-side TypeScript as skill plugins for coding agents.

## Overview of Principles

- Represent domain state with **Discriminated Unions**, avoiding classes
- Define state transitions with **pure functions**, making invalid transitions compile errors
- Handle errors as values with **Result types** (neverthrow / byethrow / fp-ts / option-t), avoiding thrown exceptions
- Validate external boundaries with **Zod**, trusting types inside the domain
- Protect PII at runtime with the **Sensitive type**

## Installation

\```bash
npx skills add iwasa-kosui/functional-ts-principles
\```

## Provided Skills

### `functional-ts`

Automatically triggered when writing server-side TypeScript code (domain models, use cases, repositories). Guides code generation following the principles.

### `functional-ts-review`

Triggered during code review. Detects code patterns that violate the principles (class usage, type assertions, thrown exceptions, unprotected PII, etc.) and suggests fixes.

### `functional-ts-ja` / `functional-ts-review-ja`

Japanese versions of the above skills.

## Reference Articles

These principles are based on the following articles:

- [Complex state transitions: Expressing state definitions and transitions with functions and Discriminated Unions instead of classes](https://kosui.me/posts/2025/02/20/005900)
- [Implementing the State pattern with Discriminated Unions](https://kosui.me/posts/2025/02/25/021320)
- [Designing TypeScript code for easy domain event recording](https://kosui.me/posts/2025/05/06/142842)
- [Why you should avoid method notation in TypeScript](https://kosui.me/posts/2025/06/02/221656)
- [Why I prefer type over interface in TypeScript](https://kosui.me/posts/2025/10/23/214710)
- [Preventing PII leaks in logs: TypeScript type inference and runtime boundaries](https://kosui.me/posts/2026/03/16/typescript-pii-logging-defense)
- [How to teach server-side TypeScript's type system](https://kakehashi-dev.hatenablog.com/entry/2026/03/31/110000)
- [as const satisfies is useful for TypeScript tests](https://kakehashi-dev.hatenablog.com/entry/2025/12/14/110000)
- [Declarative array operations in TypeScript](https://kakehashi-dev.hatenablog.com/entry/2025/11/19/110000)
- [TypeScript class pitfalls for developers from other languages](https://kakehashi-dev.hatenablog.com/entry/2025/08/19/110000)

## License

MIT
```

- [ ] **Step 4: Verify no Japanese in README.md except the language link**

```bash
grep -P '[\p{Hiragana}\p{Katakana}\p{Han}]' README.md
```

Expected: only the `日本語版` link line.

- [ ] **Step 5: Commit**

```bash
git add README.md README.ja.md
git commit -m "docs: translate README.md to English and add README.ja.md"
```

### Task 7: Update past PR titles and descriptions to English

**Files:** None (GitHub API only)

- [ ] **Step 1: Update PR #1**

```bash
gh pr edit 1 --title "feat(skill): add skill plugin for functional domain modeling principles" --body-file /tmp/pr1.md
```

Body (`/tmp/pr1.md`):
```markdown
## Why

The functional domain modeling principles for server-side TypeScript, systematized through blog posts on kosui.me, needed to be provided in a reusable form for coding agents. Currently these principles are scattered across blog articles and must be manually communicated per project.

## What

Provides two skills as a Claude Code skill plugin:

- **functional-ts**: Automatically triggered during coding, guiding 6 categories of principles including Discriminated Unions, pure function state transitions, Result types, Zod boundary defense, Sensitive type for PII protection, and as const satisfies
- **functional-ts-review**: Triggered during review, checking 8 items including class usage, method notation, type assertions, thrown exceptions, missing assertNever, and unprotected PII

Principles are at the "recommended" level, allowing context-dependent deviations.

## Test Plan

- [ ] Verify skills appear in skill list after `npx skills add` local install
- [ ] Verify functional-ts skill triggers when writing TypeScript domain models
- [ ] Verify functional-ts-review skill flags code violating the principles

---
Generated with Claude Code
```

- [ ] **Step 2: Update PR #2**

```bash
gh pr edit 2 --title "feat(skill): support multiple Result type libraries with byethrow ROP pipeline example" --body-file /tmp/pr2.md
```

Body (`/tmp/pr2.md`):
```markdown
## Why

The skill was hardcoded to neverthrow, making it inapplicable to projects using other Result type libraries (byethrow, fp-ts, option-t). Also, the byethrow code example was written in a procedural await+early return style that failed to demonstrate Railway Oriented Programming principles.

## What

- Made the error handling section in SKILL.md library-agnostic, adding instructions to auto-detect the library from `package.json` dependencies
- Provided API references and domain event recording code examples for each library in `result-libraries/` (neverthrow, @praha/byethrow, fp-ts, option-t)
- Removed neverthrow-specific imports/code examples from error-handling.md and boundary-defense.md, replacing them with conceptual explanations
- Rewrote the byethrow code example using `do()` + `bind()` + `andThrough()` for complete pipeline composition, properly demonstrating ROP principles

## Test Plan

- [ ] Verify import statements and API names in each library md match official documentation
- [ ] Verify links within SKILL.md resolve correctly
- [ ] Install as skill plugin and verify operation with projects using each library

---
Generated with Claude Code
```

- [ ] **Step 3: Update PR #3**

```bash
gh pr edit 3 --title "refactor(skill): rewrite byethrow example to full ROP pipeline with do+bind+andThrough" --body-file /tmp/pr3.md
```

Body (`/tmp/pr3.md`):
```markdown
Rewrote the use case from procedural await+early return to complete pipeline composition using Result.do()+bind() for accumulating intermediate values and andThrough() for interleaving side effects. Added do/bind/andThrough/orThrough to the basic API table.
```

- [ ] **Step 4: Update PR #4**

```bash
gh pr edit 4 --title "refactor(skill): rewrite neverthrow/fp-ts examples to ROP pipeline composition" --body-file /tmp/pr4.md
```

Body (`/tmp/pr4.md`):
```markdown
## Why

The byethrow code example had been rewritten to a full ROP pipeline, but neverthrow and fp-ts examples still had inline procedural logic within use cases. The three libraries were inconsistent in how they demonstrated ROP.

## What

- neverthrow: Rewrote using `andThrough` to chain side effects (persistence, event publishing) while preserving the original value
- fp-ts: Rewrote to complete pipeline composition using `Do` + `bind` + `chainFirst`
- Both libraries: Extracted each operation into independent functions, with use cases only performing orchestration
- Added `andThrough` (neverthrow) and `Do`/`bind`/`chainFirst`/`chainEitherK` (fp-ts) to basic API tables

## Test Plan

- [ ] Verify neverthrow/fp-ts code examples pass TypeScript type checking
- [ ] Verify API names and signatures match official documentation

---
Generated with Claude Code
```

- [ ] **Step 5: Update PR #8**

```bash
gh pr edit 8 --title "docs(skill): add z.brand() recommendation, companion .schema, and one-concept-per-file guideline" --body-file /tmp/pr8.md
```

Body (`/tmp/pr8.md`):
```markdown
## Summary

- Recommend `z.brand()` for Branded Type definitions, narrowing `as` cast exceptions to Zod-free projects only (Closes #5)
- Add pattern for exposing `schema` property on companion objects (Closes #6)
- Add one-concept-per-file principle, prohibiting catch-all files like `types.ts` (Closes #7)
- Update `taxi-request.ts` example to use `z.brand()` + companion object

## Test plan

- [ ] Verify SKILL.md Branded Types section contains `z.brand()` recommendation with examples
- [ ] Verify boundary-defense.md `as` ban section contains `z.brand()` alternative
- [ ] Verify SKILL.md Companion Object section contains `.schema` property example
- [ ] Verify SKILL.md has file structure guideline added
- [ ] Verify taxi-request.ts is updated to `z.brand()` + companion object pattern

Generated with Claude Code

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 6: Update PR #9**

```bash
gh pr edit 9 --title "docs(skill): add schema factory guideline for automatic safeParse to Result conversion" --body-file /tmp/pr9.md
```

Body (`/tmp/pr9.md`):
```markdown
## Why

The existing `boundary-defense.md` only showed examples of hand-writing safeParse-to-Result conversion code per schema. As projects grow in schema count, this leads to boilerplate proliferation, inconsistent conversion logic, and error type drift.

## What

Added a guideline for defining a single `zodResult` / `zodEither` factory function that auto-generates `(raw: unknown) => Result<T, ValidationError>` from any `z.ZodType<T>`.

- Included implementation examples for neverthrow / fp-ts / option-t
- Noted that the same factory applies to Branded Types (`z.brand()`)
- Added companion object pattern combination example (`RequestId.parse`)

## Test Plan

- [ ] Verify skill description content does not contradict existing sections
- [ ] Verify type signatures are correct for each library

---
Generated with Claude Code
```

- [ ] **Step 7: Verify all PRs updated**

```bash
gh pr list --state all --json number,title --limit 20
```

Expected: all PR titles are in English.

### Task 8: Add Japanese language link to README.ja.md skills section

**Files:**
- Modify: `skills/functional-ts-ja/SKILL.md` (already done in Task 1 Step 2)
- Modify: `skills/functional-ts-review-ja/SKILL.md` (already done in Task 2 Step 2)

No additional work needed — this task is covered by Tasks 1 and 2.
