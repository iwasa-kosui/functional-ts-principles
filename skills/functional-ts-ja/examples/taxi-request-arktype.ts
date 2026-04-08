/**
 * タクシー配車リクエストの状態遷移モデル
 *
 * Discriminated Union + Companion Object + 純粋関数による状態遷移の実例。
 * 無効な遷移はコンパイルエラーで検出される。
 */

// --- Branded Types (.brand) ---

import { type } from "arktype";

const PassengerIdSchema = type("string.uuid").brand("PassengerId");
type PassengerId = typeof PassengerIdSchema.infer;

const DriverIdSchema = type("string.uuid").brand("DriverId");
type DriverId = typeof DriverIdSchema.infer;

const RequestIdSchema = type("string.uuid").brand("RequestId");
type RequestId = typeof RequestIdSchema.infer;

// --- Branded Type Companion Objects ---

const PassengerId = {
  schema: PassengerIdSchema,
  parse: (raw: string) => {
    const result = PassengerIdSchema(raw);
    return result instanceof type.errors ? { success: false as const, issues: result } : { success: true as const, value: result };
  },
} as const;

const DriverId = {
  schema: DriverIdSchema,
  parse: (raw: string) => {
    const result = DriverIdSchema(raw);
    return result instanceof type.errors ? { success: false as const, issues: result } : { success: true as const, value: result };
  },
} as const;

const RequestId = {
  schema: RequestIdSchema,
  parse: (raw: string) => {
    const result = RequestIdSchema(raw);
    return result instanceof type.errors ? { success: false as const, issues: result } : { success: true as const, value: result };
  },
} as const;

// --- 状態型 ---

type Waiting = Readonly<{
  kind: "Waiting";
  requestId: RequestId;
  passengerId: PassengerId;
  createdAt: Date;
}>;

type EnRoute = Readonly<{
  kind: "EnRoute";
  requestId: RequestId;
  passengerId: PassengerId;
  driverId: DriverId;
  assignedAt: Date;
}>;

type InTrip = Readonly<{
  kind: "InTrip";
  requestId: RequestId;
  passengerId: PassengerId;
  driverId: DriverId;
  startedAt: Date;
}>;

type Completed = Readonly<{
  kind: "Completed";
  requestId: RequestId;
  passengerId: PassengerId;
  driverId: DriverId;
  startedAt: Date;
  completedAt: Date;
}>;

type Cancelled = Readonly<{
  kind: "Cancelled";
  requestId: RequestId;
  passengerId: PassengerId;
  cancelledAt: Date;
  reason: string;
}>;

// --- Union型 ---

type TaxiRequest = Waiting | EnRoute | InTrip | Completed | Cancelled;
type CancellableRequest = Waiting | EnRoute | InTrip;

// --- Companion Object ---

const assertNever = (x: never): never => {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
};

const TaxiRequest = {
  create: (requestId: RequestId, passengerId: PassengerId, now: Date): Waiting => ({
    kind: "Waiting",
    requestId,
    passengerId,
    createdAt: now,
  }),

  assignDriver: (waiting: Waiting, driverId: DriverId, now: Date): EnRoute => ({
    kind: "EnRoute",
    requestId: waiting.requestId,
    passengerId: waiting.passengerId,
    driverId,
    assignedAt: now,
  }),

  startTrip: (enRoute: EnRoute, now: Date): InTrip => ({
    kind: "InTrip",
    requestId: enRoute.requestId,
    passengerId: enRoute.passengerId,
    driverId: enRoute.driverId,
    startedAt: now,
  }),

  complete: (inTrip: InTrip, now: Date): Completed => ({
    kind: "Completed",
    requestId: inTrip.requestId,
    passengerId: inTrip.passengerId,
    driverId: inTrip.driverId,
    startedAt: inTrip.startedAt,
    completedAt: now,
  }),

  cancel: (request: CancellableRequest, reason: string, now: Date): Cancelled => ({
    kind: "Cancelled",
    requestId: request.requestId,
    passengerId: request.passengerId,
    cancelledAt: now,
    reason,
  }),

  isCancellable: (request: TaxiRequest): request is CancellableRequest =>
    request.kind === "Waiting" ||
    request.kind === "EnRoute" ||
    request.kind === "InTrip",

  isTerminal: (request: TaxiRequest): request is Completed | Cancelled =>
    request.kind === "Completed" || request.kind === "Cancelled",

  describe: (request: TaxiRequest): string => {
    switch (request.kind) {
      case "Waiting":
        return `配車待ち (作成: ${request.createdAt.toISOString()})`;
      case "EnRoute":
        return `ドライバー ${request.driverId} が向かっています`;
      case "InTrip":
        return `乗車中 (${request.startedAt.toISOString()} から)`;
      case "Completed":
        return `完了 (${request.completedAt.toISOString()})`;
      case "Cancelled":
        return `キャンセル: ${request.reason}`;
      default:
        return assertNever(request);
    }
  },
} as const;
