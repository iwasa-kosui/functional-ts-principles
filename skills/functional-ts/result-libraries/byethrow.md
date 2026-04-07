# @praha/byethrow

## 基本API

```typescript
import { Result } from "@praha/byethrow";
```

| 関数/型 | 説明 |
|---------|------|
| `Result.Result<T, E>` | Result型（`Success<T> \| Failure<E>` の判別共用体、プレーンオブジェクト） |
| `Result.ResultAsync<T, E>` | `Promise<Result<T, E>>` の型エイリアス |
| `Result.succeed(value)` | 成功値を生成（`{ type: "Success", value }`) |
| `Result.fail(error)` | 失敗値を生成（`{ type: "Failure", error }`） |

neverthrowとの主な違い:

- クラスではなくプレーンオブジェクト（discriminantは `type` フィールド）
- メソッドチェーンではなく `Result.pipe` + カリー化関数で合成
- `andThrough` / `orThrough` で副作用を挟みつつ元の値を維持できる

## パイプによる合成

```typescript
Result.pipe(
  result,
  Result.map((value) => transform(value)),         // 成功値を変換
  Result.mapError((error) => transformErr(error)),  // エラー値を変換
  Result.andThen((value) => nextResult(value)),     // 成功値から次のResultへ（flatMap）
  Result.orElse((error) => recover(error)),         // エラーから回復
);

// 分岐は型ガードで行う
if (Result.isSuccess(result)) {
  console.log(result.value);
} else {
  console.log(result.error);
}
```

## コード例: ドメインイベントの記録

```typescript
import { Result } from "@praha/byethrow";

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
  findById: (id: RequestId) => Result.ResultAsync<Waiting | undefined, RepositoryError>;
  save: (request: EnRoute) => Result.ResultAsync<void, RepositoryError>;
};

type EventStore = {
  save: (event: DriverAssignedEvent) => Result.ResultAsync<void, RepositoryError>;
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
  async (
    requestId: RequestId,
    driverId: DriverId,
    isDriverAvailable: boolean,
    now: Date,
  ): Result.ResultAsync<EnRoute, AssignDriverError> => {
    const requestResult = await requestRepo.findById(requestId);

    const waitingResult = Result.pipe(
      requestResult,
      Result.andThen((request) =>
        request !== undefined
          ? Result.succeed(request)
          : Result.fail({ kind: "RequestNotFound" as const, requestId }),
      ),
    );

    if (Result.isFailure(waitingResult)) return waitingResult;

    const waiting = waitingResult.value;

    if (!isDriverAvailable) {
      return Result.fail({ kind: "DriverNotAvailable" as const, driverId });
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

    const saveResult = await requestRepo.save(enRoute);
    if (Result.isFailure(saveResult)) return saveResult;

    const eventResult = await eventStore.save(event);
    if (Result.isFailure(eventResult)) return eventResult;

    return Result.succeed(enRoute);
  };
```
