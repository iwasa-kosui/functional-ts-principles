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
