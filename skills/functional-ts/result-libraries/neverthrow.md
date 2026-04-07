# neverthrow

## 基本API

```typescript
import { ok, err, Result, ResultAsync } from "neverthrow";
```

| 関数/型 | 説明 |
|---------|------|
| `Result<T, E>` | 同期Result型 |
| `ResultAsync<T, E>` | 非同期Result型（Promise<Result>のラッパー） |
| `ok(value)` | 成功値を生成 |
| `err(error)` | 失敗値を生成 |

## チェーンメソッド

```typescript
result
  .map((value) => transform(value))       // 成功値を変換
  .mapErr((error) => transformErr(error))  // エラー値を変換
  .andThen((value) => nextResult(value))   // 成功値から次のResultへ（flatMap）
  .orElse((error) => recover(error))       // エラーから回復
  .match(
    (value) => handleOk(value),
    (error) => handleErr(error),
  );
```

## コード例: ドメインイベントの記録

```typescript
import { ok, err, Result, ResultAsync } from "neverthrow";

// --- Branded Types ---

declare const RequestIdBrand: unique symbol;
type RequestId = string & { readonly [RequestIdBrand]: never };

declare const DriverIdBrand: unique symbol;
type DriverId = string & { readonly [DriverIdBrand]: never };

declare const PassengerIdBrand: unique symbol;
type PassengerId = string & { readonly [PassengerIdBrand]: never };

// --- Domain Event ---

type DomainEvent<TName extends string, TPayload> = Readonly<{
  eventId: string;
  eventAt: Date;
  eventName: TName;
  payload: TPayload;
  aggregateId: string;
  aggregateName: string;
}>;

type DriverAssignedEvent = DomainEvent<
  "DriverAssigned",
  Readonly<{ driverId: DriverId; passengerId: PassengerId }>
>;

// --- State Types ---

type Waiting = Readonly<{
  kind: "Waiting";
  requestId: RequestId;
  passengerId: PassengerId;
}>;

type EnRoute = Readonly<{
  kind: "EnRoute";
  requestId: RequestId;
  passengerId: PassengerId;
  driverId: DriverId;
}>;

// --- Repository Types ---

type RequestRepository = {
  findById: (id: RequestId) => ResultAsync<Waiting | undefined, RepositoryError>;
  save: (request: EnRoute) => ResultAsync<void, RepositoryError>;
};

type EventStore = {
  save: (event: DriverAssignedEvent) => ResultAsync<void, RepositoryError>;
};

// --- Error Types ---

type AssignDriverError =
  | Readonly<{ kind: "RequestNotFound"; requestId: RequestId }>
  | Readonly<{ kind: "DriverNotAvailable"; driverId: DriverId }>
  | Readonly<{ kind: "RepositoryError"; cause: unknown }>;

type RepositoryError = Readonly<{ kind: "RepositoryError"; cause: unknown }>;

// --- Use Case ---

const assignDriverUseCase =
  (requestRepo: RequestRepository, eventStore: EventStore) =>
  (
    requestId: RequestId,
    driverId: DriverId,
    isDriverAvailable: boolean,
    now: Date,
  ): ResultAsync<EnRoute, AssignDriverError> =>
    requestRepo
      .findById(requestId)
      .andThen((request) =>
        request !== undefined
          ? ok(request)
          : err({ kind: "RequestNotFound" as const, requestId }),
      )
      .andThen((waiting) => {
        if (!isDriverAvailable) {
          return err({ kind: "DriverNotAvailable" as const, driverId });
        }

        const enRoute: EnRoute = {
          kind: "EnRoute",
          requestId: waiting.requestId,
          passengerId: waiting.passengerId,
          driverId,
        };

        const event: DriverAssignedEvent = {
          eventId: crypto.randomUUID(),
          eventAt: now,
          eventName: "DriverAssigned",
          payload: { driverId, passengerId: waiting.passengerId },
          aggregateId: waiting.requestId,
          aggregateName: "TaxiRequest",
        };

        return requestRepo
          .save(enRoute)
          .andThen(() => eventStore.save(event))
          .map(() => enRoute);
      });
```
