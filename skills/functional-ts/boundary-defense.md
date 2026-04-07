# Boundary Defense Detailed Guide

## Understanding the Limits of TypeScript's Type System

TypeScript's types are erased at compile time. Because no type information remains at runtime, the correctness of externally incoming data cannot be guaranteed by types alone.

Structural subtyping allows objects with extra properties to be assigned to types with fewer properties. This can be a source of unintended data leakage.

```typescript
type LogPayload = { id: string; role: string };
const user = { id: "1", role: "admin", email: "secret@example.com" };

// Passes type check, but email is included in the log
console.log(JSON.stringify(user satisfies LogPayload));
```

## Validation with Zod

At external boundaries (API requests, DB results, environment variables, file reads), parse with Zod schemas.

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

### Use `safeParse`

`parse` throws an exception. For integration with Railway Oriented Programming, use `safeParse` and convert the result to a Result type.

```typescript
// Convert the safeParse result to the Result type library used in the project
const parseInput = (raw: unknown): Result<CreateRequestInput, ValidationError> => {
  const result = CreateRequestInput.safeParse(raw);
  if (result.success) return success(result.data);  // ok(), right(), createOk(), etc.
  return failure({ kind: "ValidationError", issues: result.error.issues });
};
```

### Schema Factory: Automatic `safeParse` → Result Type Conversion

The `safeParse` → Result type conversion above follows the same pattern for every schema. Rather than writing it by hand each time, define a single schema factory that matches the Result type library used in the project, and auto-generate `parse` functions for each schema.

#### For neverthrow

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

// Usage
const parseCreateRequestInput = zodResult(CreateRequestInput);
const parseRequestId = zodResult(RequestIdSchema);

// parse: (raw: unknown) => Result<CreateRequestInput, ValidationError>
const result = parseCreateRequestInput(rawBody);
```

#### For fp-ts

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

#### For option-t

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

#### Guidelines

- Do not hand-write `safeParse` → Result conversions for each schema. Define a single factory function and reuse it across the project
- Unify the return type of the factory to the Result type library in use
- The same factory can be applied to Branded Type schemas (`z.string().brand<"RequestId">()`)
- Combine with the companion object pattern to expose the schema definition and `parse` function together:

```typescript
const RequestIdSchema = z.string().uuid().brand<"RequestId">();
type RequestId = z.infer<typeof RequestIdSchema>;

const RequestId = {
  schema: RequestIdSchema,
  parse: zodResult(RequestIdSchema),
} as const;

// Usage
const id = RequestId.parse(raw); // Result<RequestId, ValidationError>
```

## Banning Type Assertions (`as`)

`as` bypasses type checking. Use Zod for external data; trust type inference for internal data.

```typescript
// Bad
const user = data as User;

// Good
const user = UserSchema.parse(data);
```

For Branded Types, using `z.brand()` eliminates the need for `as`.

```typescript
// ❌ Manual brand + as cast
type ItemId = string & { readonly __brand: unique symbol };
const ItemIdSchema = z.string().regex(/^item-\d+$/);
const parse = (raw: string): ItemId => ItemIdSchema.parse(raw) as ItemId;

// ✅ z.brand() — no as needed
const ItemIdSchema = z.string().regex(/^item-\d+$/).brand<"ItemId">();
type ItemId = z.infer<typeof ItemIdSchema>;
const parse = (raw: string): ItemId => ItemIdSchema.parse(raw); // already ItemId type
```

In projects that do not use Zod, `as` is permitted only inside Branded Type constructor functions.

```typescript
const UserId = {
  of: (value: string): UserId => value as UserId, // permitted only when not using Zod
};
```

## PII Protection with the Sensitive Type

### Problem

TypeScript types are erased at runtime, so marking something as PII in the type system does not prevent leakage via `JSON.stringify` or `console.log`. Even with Branded Types, the brand is lost on variable assignment.

### Solution: Closure-Based Wrapper

Enclose the value in a function closure and automatically mask it during serialization.

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

### Integration with Zod

Automatically wrap in Sensitive at parse time.

```typescript
const sensitiveString = z.string().transform(Sensitive.of);

const PatientSchema = z.object({
  id: z.string().uuid(),
  name: sensitiveString,
  email: sensitiveString,
  diagnosis: sensitiveString,
  role: z.string(), // not PII
});

const patient = PatientSchema.parse(rawData);
console.log(JSON.stringify(patient));
// {"id":"...","name":"[REDACTED]","email":"[REDACTED]","diagnosis":"[REDACTED]","role":"doctor"}
```

### Defense in Depth: Pino Redaction

As a backup for missed Sensitive wrapper applications, also configure redaction at the logger level.

```typescript
import pino from "pino";

const logger = pino({
  redact: {
    paths: ["email", "*.email", "password", "*.password", "name", "*.name"],
    censor: "[REDACTED]",
  },
});
```

## Do Not Over-Defend Inside the Domain

Data that has been validated at the external boundary should not be re-validated inside the domain layer. Trust the types.

```typescript
// Bad: redundant checks in the domain layer
const assignDriver = (waiting: Waiting, driverId: DriverId): EnRoute => {
  if (waiting.kind !== "Waiting") throw new Error("Invalid state"); // the type already guarantees this
  if (!driverId) throw new Error("Missing driverId"); // the type already guarantees this
  return { kind: "EnRoute", passengerId: waiting.passengerId, driverId };
};

// Good: trust the types
const assignDriver = (waiting: Waiting, driverId: DriverId): EnRoute => ({
  kind: "EnRoute",
  passengerId: waiting.passengerId,
  driverId,
});
```
