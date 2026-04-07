# fp-ts

## 基本API

```typescript
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
```

| 関数/型 | 説明 |
|---------|------|
| `Either<E, A>` | 同期Result型。エラーが第1型引数（Left）、成功が第2型引数（Right） |
| `TaskEither<E, A>` | 非同期Result型（`() => Promise<Either<E, A>>`） |
| `E.right(value)` | 成功値を生成 |
| `E.left(error)` | 失敗値を生成 |

## パイプによる合成

fp-tsではメソッドチェーンではなく `pipe` で関数を合成する。

```typescript
pipe(
  E.right(value),
  E.map((a) => transform(a)),           // 成功値を変換
  E.mapLeft((e) => transformErr(e)),     // エラー値を変換
  E.chain((a) => nextEither(a)),         // 成功値から次のEitherへ（flatMap）
  E.fold(
    (error) => handleErr(error),
    (value) => handleOk(value),
  ),
);
```

## コード例: ドメインイベントの記録

```typescript
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

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
  findById: (id: RequestId) => TE.TaskEither<RepositoryError, Waiting | undefined>;
  save: (request: EnRoute) => TE.TaskEither<RepositoryError, void>;
};

type EventStore = {
  save: (event: DriverAssignedEvent) => TE.TaskEither<RepositoryError, void>;
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
  ): TE.TaskEither<AssignDriverError, EnRoute> =>
    pipe(
      requestRepo.findById(requestId),
      TE.chain((request) =>
        request !== undefined
          ? TE.right(request)
          : TE.left({ kind: "RequestNotFound" as const, requestId }),
      ),
      TE.chain((waiting) => {
        if (!isDriverAvailable) {
          return TE.left({ kind: "DriverNotAvailable" as const, driverId });
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

        return pipe(
          requestRepo.save(enRoute),
          TE.chain(() => eventStore.save(event)),
          TE.map(() => enRoute),
        );
      }),
    );
```
