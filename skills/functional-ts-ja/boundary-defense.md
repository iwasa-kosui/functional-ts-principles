# 境界防御の詳細ガイド

## TypeScriptの型の限界を理解する

TypeScriptの型はコンパイル時に消去される。ランタイムには型情報が残らないため、外部から入ってくるデータの正しさは型だけでは保証できない。

構造的部分型により、余分なプロパティを持つオブジェクトは少ないプロパティの型に代入できる。これが意図しないデータ漏洩の原因になる。

```typescript
type LogPayload = { id: string; role: string };
const user = { id: "1", role: "admin", email: "secret@example.com" };

// 型チェックは通るが、emailがログに含まれる
console.log(JSON.stringify(user satisfies LogPayload));
```

## Zodによるバリデーション

外部境界（APIリクエスト、DB結果、環境変数、ファイル読み込み）ではZodスキーマでパースする。

```typescript
import { z } from "zod";

const CreateRequestInput = z.object({
  passengerId: z.string().uuid(),
  pickupLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

type CreateRequestInput = z.infer<typeof CreateRequestInput>;
```

### `safeParse` を使う

`parse` は例外をスローする。Railway Oriented Programmingとの統合には `safeParse` を使い、結果をResult型に変換する。

```typescript
// safeParse の結果をプロジェクトで使用しているResult型ライブラリに変換する
const parseInput = (raw: unknown): Result<CreateRequestInput, ValidationError> => {
  const result = CreateRequestInput.safeParse(raw);
  if (result.success) return success(result.data);  // ok(), right(), createOk() 等
  return failure({ kind: "ValidationError", issues: result.error.issues });
};
```

### スキーマファクトリ: `safeParse` → Result型の自動変換

上記の `safeParse` → Result型変換は全スキーマで同じパターンになる。毎回手書きせず、プロジェクトで使用するResult型ライブラリに合わせたスキーマファクトリを1つ定義し、各スキーマの `parse` 関数を自動生成する。

#### neverthrow の場合

```typescript
import { ok, err, Result } from "neverthrow";
import { z } from "zod";

type ValidationError = Readonly<{
  kind: "ValidationError";
  issues: z.ZodIssue[];
}>;

const zodResult = <T>(schema: z.ZodType<T>) =>
  (raw: unknown): Result<T, ValidationError> => {
    const result = schema.safeParse(raw);
    if (result.success) return ok(result.data);
    return err({ kind: "ValidationError", issues: result.error.issues });
  };

// 使用例
const parseCreateRequestInput = zodResult(CreateRequestInput);
const parseRequestId = zodResult(RequestIdSchema);

// parse: (raw: unknown) => Result<CreateRequestInput, ValidationError>
const result = parseCreateRequestInput(rawBody);
```

#### fp-ts の場合

```typescript
import * as E from "fp-ts/Either";
import { z } from "zod";

type ValidationError = Readonly<{
  kind: "ValidationError";
  issues: z.ZodIssue[];
}>;

const zodEither = <T>(schema: z.ZodType<T>) =>
  (raw: unknown): E.Either<ValidationError, T> => {
    const result = schema.safeParse(raw);
    if (result.success) return E.right(result.data);
    return E.left({ kind: "ValidationError", issues: result.error.issues });
  };
```

#### option-t の場合

```typescript
import { createOk, createErr, type Result } from "option-t/plain_result";
import { z } from "zod";

type ValidationError = Readonly<{
  kind: "ValidationError";
  issues: z.ZodIssue[];
}>;

const zodResult = <T>(schema: z.ZodType<T>) =>
  (raw: unknown): Result<T, ValidationError> => {
    const result = schema.safeParse(raw);
    if (result.success) return createOk(result.data);
    return createErr({ kind: "ValidationError", issues: result.error.issues });
  };
```

#### ガイドライン

- スキーマごとに `safeParse` → Result変換を手書きしない。ファクトリ関数を1つ定義してプロジェクト全体で再利用する
- ファクトリの戻り値の型は、使用するResult型ライブラリの型に統一する
- Branded Typesのスキーマ（`z.string().brand<"RequestId">()`）にも同じファクトリが適用できる
- companion objectパターンと組み合わせ、スキーマ定義と `parse` 関数をまとめて公開する:

```typescript
const RequestIdSchema = z.string().uuid().brand<"RequestId">();
type RequestId = z.infer<typeof RequestIdSchema>;

const RequestId = {
  schema: RequestIdSchema,
  parse: zodResult(RequestIdSchema),
} as const;

// 使用側
const id = RequestId.parse(raw); // Result<RequestId, ValidationError>
```

## 型アサーション（`as`）の禁止

`as` は型チェックをバイパスする。外部データには Zod、内部データは型推論を信頼する。

```typescript
// Bad
const user = data as User;

// Good
const user = UserSchema.parse(data);
```

Branded Types についても `z.brand()` を使えば `as` は不要になる。

```typescript
// ❌ 手動ブランド + as キャスト
type ItemId = string & { readonly __brand: unique symbol };
const ItemIdSchema = z.string().regex(/^item-\d+$/);
const parse = (raw: string): ItemId => ItemIdSchema.parse(raw) as ItemId;

// ✅ z.brand() — as 不要
const ItemIdSchema = z.string().regex(/^item-\d+$/).brand<"ItemId">();
type ItemId = z.infer<typeof ItemIdSchema>;
const parse = (raw: string): ItemId => ItemIdSchema.parse(raw); // 既に ItemId 型
```

Zodを使わないプロジェクトでは、Branded Types の生成関数内に限り `as` を許容する。

```typescript
const UserId = {
  of: (value: string): UserId => value as UserId, // Zod未使用時のみ許容
};
```

## Sensitive型によるPII防御

### 問題

TypeScriptの型はランタイムで消えるため、型で「PIIだ」とマークしても `JSON.stringify` や `console.log` で漏洩する。Branded Typeでも変数代入時にブランドが失われる。

### 解決策: クロージャベースのラッパー

値を関数クロージャに閉じ込め、シリアライズ時に自動マスクする。

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

### Zodとの統合

パース時に自動でSensitiveラップする。

```typescript
const sensitiveString = z.string().transform(Sensitive.of);

const PatientSchema = z.object({
  id: z.string().uuid(),
  name: sensitiveString,
  email: sensitiveString,
  diagnosis: sensitiveString,
  role: z.string(), // PIIではない
});

const patient = PatientSchema.parse(rawData);
console.log(JSON.stringify(patient));
// {"id":"...","name":"[REDACTED]","email":"[REDACTED]","diagnosis":"[REDACTED]","role":"doctor"}
```

### 多層防御: Pinoのredaction

Sensitiveラッパーの適用漏れに備え、ロガーレベルでもredactionを設定する。

```typescript
import pino from "pino";

const logger = pino({
  redact: {
    paths: ["email", "*.email", "password", "*.password", "name", "*.name"],
    censor: "[REDACTED]",
  },
});
```

## ドメイン内部では過剰防御しない

外部境界でバリデーション済みのデータは、ドメイン層内部で再度バリデーションしない。型を信頼する。

```typescript
// Bad: ドメイン層で冗長なチェック
const assignDriver = (waiting: Waiting, driverId: DriverId): EnRoute => {
  if (waiting.kind !== "Waiting") throw new Error("Invalid state"); // 型が保証している
  if (!driverId) throw new Error("Missing driverId"); // 型が保証している
  return { kind: "EnRoute", passengerId: waiting.passengerId, driverId };
};

// Good: 型を信頼する
const assignDriver = (waiting: Waiting, driverId: DriverId): EnRoute => ({
  kind: "EnRoute",
  passengerId: waiting.passengerId,
  driverId,
});
```
