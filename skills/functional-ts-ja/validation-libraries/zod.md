# Zod

## 基本API

```typescript
import { z } from "zod";
```

| 関数/型 | 説明 |
|---------|------|
| `z.object({...})` | オブジェクトスキーマ |
| `z.string()` | 文字列スキーマ |
| `z.number()` | 数値スキーマ |
| `z.infer<typeof Schema>` | スキーマからTypeScript型を抽出 |
| `schema.safeParse(raw)` | 例外をスローせず `{ success, data, error }` を返す |
| `schema.parse(raw)` | パース済みデータを返すか `ZodError` をスロー |
| `z.brand<"Name">()` | 出力型にnominalブランドを付与 |
| `.transform(fn)` | パース済みの値を変換 |

## スキーマ定義

```typescript
const CreateRequestInput = z.object({
  passengerId: z.string().uuid(),
  pickupLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

type CreateRequestInput = z.infer<typeof CreateRequestInput>;
```

## Branded Types

`z.brand()` でブランドを定義する。スキーマの出力型に自動的にブランドが付与されるため、`as` キャストが不要になる。

```typescript
const UserIdSchema = z.string().uuid().brand<"UserId">();
type UserId = z.infer<typeof UserIdSchema>;

const ProductIdSchema = z.string().uuid().brand<"ProductId">();
type ProductId = z.infer<typeof ProductIdSchema>;

// safeParse().data は既にブランド付き — `as` キャスト不要
```

### Companion Objectパターン

```typescript
const RequestIdSchema = z.string().uuid().brand<"RequestId">();
type RequestId = z.infer<typeof RequestIdSchema>;

const RequestId = {
  schema: RequestIdSchema,
  parse: schemaResult(RequestIdSchema), // schemaResult は boundary-defense.md を参照
} as const;
```

## Sensitive型との統合

`.transform()` を使用してパース時にPIIフィールドを自動ラップする。

```typescript
const sensitiveString = z.string().transform(Sensitive.of);

const PatientSchema = z.object({
  id: z.string().uuid(),
  name: sensitiveString,
  email: sensitiveString,
  diagnosis: sensitiveString,
  role: z.string(), // PIIではないのでそのまま
});
```

## ガイドライン

- Railway Oriented Programmingとの統合には `parse` より `safeParse` を使う（スキーマファクトリーパターンは [boundary-defense.md](../boundary-defense.md) を参照）
- boundary-defense.md のスキーマファクトリーは Standard Schema 準拠のため、Zodでもそのまま動作する
- `z.brand()` により Branded Types で `as` キャストが不要になる
