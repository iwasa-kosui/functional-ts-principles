---
name: functional-ts
description: Use when writing server-side TypeScript code involving domain models, use cases, repositories, state transitions, or business logic. Guides functional domain modeling with discriminated unions, pure functions, and Result types.
---

# Functional Domain Modeling in TypeScript

サーバーサイドTypeScriptでドメインモデルを書くときの原則。classベースのOOPではなく、TypeScriptの型システムを最大限に活用した関数型アプローチを採る。

## 1. 型によるドメインモデリング

### Discriminated Unionで状態を表現する

ドメインエンティティの状態はclassではなくDiscriminated Unionで定義する。各状態を個別の型として定義し、状態固有のプロパティを必須にする。

```typescript
// Good: 各状態が独立した型。状態固有のプロパティが必須
type Waiting = Readonly<{
  kind: "Waiting";
  passengerId: PassengerId;
}>;

type EnRoute = Readonly<{
  kind: "EnRoute";
  passengerId: PassengerId;
  driverId: DriverId;
}>;

type TaxiRequest = Waiting | EnRoute | InTrip | Completed | Cancelled;
```

```typescript
// Bad: optional プロパティで全状態を1つの型に押し込む
type TaxiRequest = {
  state: string;
  passengerId: string;
  driverId?: string;    // どの状態で存在するか不明
  startTime?: Date;     // null チェックが至る所で必要
  endTime?: Date;
};
```

**理由:** optional プロパティは「どの状態でどのプロパティが存在するか」をコンパイル時に保証できない。Discriminated Unionなら、switch文でkindを判別した時点で状態固有のプロパティに安全にアクセスできる。

### discriminantは `kind` で統一する

プロジェクト全体で `kind` をdiscriminantプロパティ名として統一する。`type`, `status`, `state` などが混在するとコードベースの一貫性が損なわれる。

### Companion Objectパターン

型定義と関連する関数を同名のオブジェクトにまとめる。

```typescript
type TaxiRequest = Waiting | EnRoute | InTrip | Completed | Cancelled;

const TaxiRequest = {
  assignDriver: (waiting: Waiting, driverId: DriverId): EnRoute => ({
    kind: "EnRoute",
    passengerId: waiting.passengerId,
    driverId,
  }),

  startTrip: (enRoute: EnRoute, startTime: Date): InTrip => ({
    kind: "InTrip",
    passengerId: enRoute.passengerId,
    driverId: enRoute.driverId,
    startTime,
  }),

  isActive: (request: TaxiRequest): request is Waiting | EnRoute | InTrip =>
    request.kind !== "Completed" && request.kind !== "Cancelled",
} as const;
```

### `type` を使う（`interface` ではなく）

ドメイン型は `type` で定義する。`interface` のdeclaration mergingは、別ファイルで同名のinterfaceを宣言するだけで型の形状が暗黙的に変わる危険がある。

```typescript
// Good
type User = Readonly<{
  id: UserId;
  name: string;
}>;

// Bad: 別ファイルで interface User { hashedPassword?: string } と宣言されると
// 気づかないうちに型が変わる
interface User {
  id: string;
  name: string;
}
```

### 関数プロパティ記法を使う（メソッド記法ではなく）

型定義内の関数はメソッド記法ではなく関数プロパティ記法で書く。メソッド記法はパラメータ型がbivariantになり、型安全性が崩れる。

```typescript
// Good: 関数プロパティ記法 — パラメータはcontravariant
type TaskRepository = {
  save: (task: Task) => Promise<void>;
  findById: (id: TaskId) => Promise<Task | undefined>;
};

// Bad: メソッド記法 — パラメータがbivariantになり、
// save(task: DoingTask) のような狭い実装が型チェックを通過してしまう
type TaskRepository = {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | undefined>;
};
```

### Branded Typesで意味を区別する

構造的部分型により `string` 同士は互換になる。意味の異なるIDや値にはBranded Typeを適用する。

```typescript
declare const UserIdBrand: unique symbol;
type UserId = string & { readonly [UserIdBrand]: never };

declare const ProductIdBrand: unique symbol;
type ProductId = string & { readonly [ProductIdBrand]: never };

// UserId と ProductId は構造的に非互換になる
```

### `Readonly<>` で不変性を保証する

ドメインオブジェクトは `Readonly<>` で定義し、プロパティの再代入を防ぐ。状態変更は新しいオブジェクトの生成で表現する。

## 2. 関数による状態遷移

純粋関数で状態遷移を表現する。関数の引数型が有効な遷移元を制約し、戻り値型が遷移先を明示する。

```typescript
// assignDriver は Waiting 状態からのみ呼べる
const assignDriver = (waiting: Waiting, driverId: DriverId): EnRoute => ({
  kind: "EnRoute",
  passengerId: waiting.passengerId,
  driverId,
});
```

無効な遷移（例: `assignDriver(completed, driverId)`）はコンパイルエラーになる。ランタイムチェックは不要。

### 網羅性チェック

switch文では `assertNever` を使い、すべてのケースを処理していることをコンパイル時に保証する。新しい状態が追加されたとき、未処理の箇所がコンパイルエラーで検出される。

```typescript
const assertNever = (x: never): never => {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
};

const describe = (request: TaxiRequest): string => {
  switch (request.kind) {
    case "Waiting": return "Waiting for driver";
    case "EnRoute": return `Driver ${request.driverId} en route`;
    case "InTrip": return "In trip";
    case "Completed": return "Completed";
    case "Cancelled": return "Cancelled";
    default: return assertNever(request);
  }
};
```

## 3. エラーハンドリング — Railway Oriented Programming

例外をスローせず、Result型でエラーを値として扱う。

**ライブラリの検出:** プロジェクトの `package.json` の `dependencies` / `devDependencies` を確認し、該当するライブラリのガイドに従う。いずれも見つからない場合はユーザーに確認する。

- `neverthrow` → [result-libraries/neverthrow.md](./result-libraries/neverthrow.md)
- `byethrow` → [result-libraries/byethrow.md](./result-libraries/byethrow.md)
- `fp-ts` → [result-libraries/fp-ts.md](./result-libraries/fp-ts.md)
- `option-t` → [result-libraries/option-t.md](./result-libraries/option-t.md)

エラー型はDiscriminated Unionで定義し、呼び出し元が網羅的にハンドルできるようにする。

```typescript
type AssignError =
  | Readonly<{ kind: "DriverNotAvailable"; driverId: DriverId }>
  | Readonly<{ kind: "RequestAlreadyAssigned" }>;
```

成功・失敗を型で表現し、チェーンで処理を合成する。各ライブラリのAPIについては上記のガイドを参照。

詳細: [error-handling.md](./error-handling.md)

## 4. 境界の防御

外部入力（APIリクエスト、DB結果、ファイル読み込み）はZodスキーマでランタイムバリデーションする。ドメイン層内部では型を信頼し、過剰な防御的バリデーションをしない。

```typescript
import { z } from "zod";

const CreateRequestSchema = z.object({
  passengerId: z.string().uuid().transform(PassengerId.of),
});

// API handler
const handler = (req: Request) => {
  const result = CreateRequestSchema.safeParse(req.body);
  if (!result.success) return badRequest(result.error);
  // result.data は型安全。以降 as は不要
};
```

### 型アサーション（`as`）を使わない

`as` は型チェックをバイパスし、ランタイムエラーの原因になる。外部データにはZodパース、内部データは型推論を信頼する。

### PIIの防御

個人情報を含むフィールドには `Sensitive<T>` ラッパーを適用し、`JSON.stringify` や `console.log` で自動的にマスクする。

```typescript
type Sensitive<T> = Readonly<{
  unwrap: () => T;
  toJSON: () => string;
  toString: () => string;
}>;

const Sensitive = {
  of: <T>(value: T): Sensitive<T> => ({
    unwrap: () => value,
    toJSON: () => "[REDACTED]",
    toString: () => "[REDACTED]",
    [Symbol.for("nodejs.util.inspect.custom")]: () => "[REDACTED]",
  }),
} as const;
```

Zodスキーマで自動ラップする。

```typescript
const sensitiveString = z.string().transform(Sensitive.of);

const PatientSchema = z.object({
  name: sensitiveString,
  email: sensitiveString,
  role: z.string(), // PIIではないのでそのまま
});
```

詳細: [boundary-defense.md](./boundary-defense.md)

## 5. 宣言的なスタイル

### 配列操作

配列の変換は `filter` / `map` / `reduce` で宣言的に書く。述語関数はCompanion Objectに定義する。

```typescript
type Task = ActiveTask | CompletedTask;

const Task = {
  isActive: (task: Task): task is ActiveTask => task.kind === "Active",
} as const;

// 宣言的: 「何をしたいか」が明確
const activeTasks = tasks.filter(Task.isActive);

// 命令的: ループの中身を読まないと意図がわからない
const activeTasks: ActiveTask[] = [];
for (const task of tasks) {
  if (task.kind === "Active") activeTasks.push(task);
}
```

### ドメインイベント

状態変更に伴うドメインイベントは不変レコードとして生成し、リポジトリとは分離して記録する。

```typescript
type DomainEvent = Readonly<{
  eventId: string;
  eventAt: Date;
  eventName: string;
  payload: unknown;
  aggregateId: string;
}>;
```

詳細: [state-modeling.md](./state-modeling.md)

## 6. テストデータ

テストのダミーデータは `as const satisfies Type` で型安全に定義する。discriminantのリテラル型が保持され、wideningを防ぐ。

```typescript
const waitingRequest = {
  kind: "Waiting",
  passengerId: "passenger-1" as PassengerId,
} as const satisfies Waiting;

// waitingRequest.kind は "Waiting" リテラル型（string ではない）
```

## 原則の適用について

これらは推奨であり厳格なルールではない。コンテキストに応じて判断してよいが、原則から逸脱する場合はその理由をコメントで明示すること。

典型的な逸脱の正当理由:
- 外部ライブラリがclass継承を要求する場合
- パフォーマンス要件により不変データの生成コストが問題になる場合
- チームの合意により異なるパターンが採用されている場合
