# Zod

## Basic API

```typescript
import { z } from "zod";
```

| Function/Type | Description |
|---------|------|
| `z.object({...})` | Object schema |
| `z.string()` | String schema |
| `z.number()` | Number schema |
| `z.infer<typeof Schema>` | Extract TypeScript type from schema |
| `schema.safeParse(raw)` | Returns `{ success, data, error }` without throwing |
| `schema.parse(raw)` | Returns parsed data or throws `ZodError` |
| `z.brand<"Name">()` | Adds a nominal brand to the output type |
| `.transform(fn)` | Transforms the parsed value |

## Schema Definition

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

Define brands with `z.brand()`. The schema output type becomes automatically branded, eliminating the need for `as` casts.

```typescript
const UserIdSchema = z.string().uuid().brand<"UserId">();
type UserId = z.infer<typeof UserIdSchema>;

const ProductIdSchema = z.string().uuid().brand<"ProductId">();
type ProductId = z.infer<typeof ProductIdSchema>;

// safeParse().data is already branded — no `as` cast needed
```

### Companion Object Pattern

```typescript
const RequestIdSchema = z.string().uuid().brand<"RequestId">();
type RequestId = z.infer<typeof RequestIdSchema>;

const RequestId = {
  schema: RequestIdSchema,
  parse: schemaResult(RequestIdSchema), // see boundary-defense.md for schemaResult
} as const;
```

## Sensitive Type Integration

Auto-wrap PII fields at parse time using `.transform()`.

```typescript
const sensitiveString = z.string().transform(Sensitive.of);

const PatientSchema = z.object({
  id: z.string().uuid(),
  name: sensitiveString,
  email: sensitiveString,
  diagnosis: sensitiveString,
  role: z.string(), // not PII
});
```

## Guidelines

- Use `safeParse` over `parse` for Railway Oriented Programming integration (see [boundary-defense.md](../boundary-defense.md) for schema factory patterns)
- The same factory works across all Standard Schema-compliant libraries — the schema factories in boundary-defense.md work with Zod without modification
- `z.brand()` eliminates the need for `as` casts on Branded Types
