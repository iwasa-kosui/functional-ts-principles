/**
 * タクシー配車リクエストの状態遷移モデル
 *
 * Discriminated Union + Companion Object + 純粋関数による状態遷移の実例。
 * 無効な遷移はコンパイルエラーで検出される。
 */

// --- Branded Types ---

declare const PassengerIdBrand: unique symbol;
type PassengerId = string & { readonly [PassengerIdBrand]: never };

declare const DriverIdBrand: unique symbol;
type DriverId = string & { readonly [DriverIdBrand]: never };

declare const RequestIdBrand: unique symbol;
type RequestId = string & { readonly [RequestIdBrand]: never };

// --- State Types ---

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

// --- Union Type ---

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
        return `Waiting (created ${request.createdAt.toISOString()})`;
      case "EnRoute":
        return `Driver ${request.driverId} en route`;
      case "InTrip":
        return `In trip since ${request.startedAt.toISOString()}`;
      case "Completed":
        return `Completed at ${request.completedAt.toISOString()}`;
      case "Cancelled":
        return `Cancelled: ${request.reason}`;
      default:
        return assertNever(request);
    }
  },
} as const;
