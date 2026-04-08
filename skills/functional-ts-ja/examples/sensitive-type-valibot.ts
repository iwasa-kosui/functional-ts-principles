/**
 * Sensitive型ラッパーによるPII防御の実例
 *
 * クロージャに値を閉じ込め、JSON.stringify / console.log / template literal で
 * 自動的にマスクする。Valibotとの統合でパース時に自動ラップする。
 */

import * as v from "valibot";

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

// --- Valibot統合 ---

const sensitiveString = v.pipe(v.string(), v.transform(Sensitive.of));

const PatientSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: sensitiveString,
  email: sensitiveString,
  diagnosis: sensitiveString,
  role: v.string(),
});

type Patient = v.InferOutput<typeof PatientSchema>;

// --- 使用例 ---

const rawData = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "John Doe",
  email: "john@example.com",
  diagnosis: "Hypertension",
  role: "outpatient",
};

const patient: Patient = v.parse(PatientSchema, rawData);

// 安全: PIIはマスクされる
// {"id":"550e8400-...","name":"[REDACTED]","email":"[REDACTED]","diagnosis":"[REDACTED]","role":"outpatient"}
console.log(JSON.stringify(patient));

// 実際の値は明示的に必要なときだけアクセス
const actualEmail: string = patient.email.unwrap();
