/**
 * Sensitive型ラッパーによるPII防御の実例
 *
 * クロージャに値を閉じ込め、JSON.stringify / console.log / template literal で
 * 自動的にマスクする。ArkTypeとの統合でバリデーション時に自動ラップする。
 */

import { type } from "arktype";

// --- Sensitive Type ---

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

// --- ArkType統合 ---

const sensitiveString = type("string").pipe(Sensitive.of);

const PatientSchema = type({
  id: "string.uuid",
  name: sensitiveString,
  email: sensitiveString,
  diagnosis: sensitiveString,
  role: "string",
});

type Patient = typeof PatientSchema.infer;

// --- 使用例 ---

const rawData = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "John Doe",
  email: "john@example.com",
  diagnosis: "Hypertension",
  role: "outpatient",
};

const result = PatientSchema(rawData);
if (result instanceof type.errors) {
  throw new Error(`バリデーション失敗: ${result.summary}`);
}

const patient: Patient = result;

// 安全: PIIはマスクされる
// {"id":"550e8400-...","name":"[REDACTED]","email":"[REDACTED]","diagnosis":"[REDACTED]","role":"outpatient"}
console.log(JSON.stringify(patient));

// 実際の値は明示的に必要なときだけアクセス
const actualEmail: string = patient.email.unwrap();
