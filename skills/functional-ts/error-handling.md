# エラーハンドリング詳細ガイド

## Railway Oriented Programming

neverthrow の `Result<T, E>` を使い、成功と失敗を型で表現する。例外のthrowはドメイン層では使わない。

## エラー型の設計

エラーもDiscriminated Unionで定義し、呼び出し元が網羅的にハンドルできるようにする。

```typescript
type AssignDriverError =
  | Readonly<{ kind: "RequestNotFound"; requestId: RequestId }>
  | Readonly<{ kind: "InvalidState"; currentKind: string; expectedKind: "Waiting" }>
  | Readonly<{ kind: "DriverNotAvailable"; driverId: DriverId }>;
```

### エラー型の粒度

各ユースケースが返すエラー型は、そのユースケース固有のものにする。共通のエラー型（`AppError`）にすべてを詰め込むと、呼び出し元が「実際にはどのエラーが起こりうるか」を型から判断できなくなる。

```typescript
// Good: ユースケース固有のエラー型
type AssignDriverError = RequestNotFoundError | InvalidStateError | DriverNotAvailableError;
type StartTripError = RequestNotFoundError | InvalidStateError;

// Bad: 全エラーを1つに詰め込む
type AppError = RequestNotFoundError | InvalidStateError | DriverNotAvailableError | ...;
```

## andThen チェーン

処理の合成は `andThen` で行う。各ステップが `Result` を返し、エラーが発生した時点で後続のステップはスキップされる。

```typescript
const assignDriverUseCase = (
  requestId: RequestId,
  driverId: DriverId,
): ResultAsync<EnRoute, AssignDriverError> =>
  requestRepository
    .findById(requestId)
    .andThen(ensureFound(requestId))
    .andThen(ensureWaiting)
    .andThen((waiting) => checkDriverAvailability(driverId).map(() => waiting))
    .andThen((waiting) => {
      const enRoute = TaxiRequest.assignDriver(waiting, driverId);
      return requestRepository.save(enRoute).map(() => enRoute);
    });
```

### ヘルパー関数

共通のバリデーションは小さな関数に切り出す。

```typescript
const ensureFound = <T>(id: RequestId) => (
  value: T | undefined,
): Result<T, RequestNotFoundError> =>
  value !== undefined
    ? ok(value)
    : err({ kind: "RequestNotFound", requestId: id });

const ensureWaiting = (
  request: TaxiRequest,
): Result<Waiting, InvalidStateError> =>
  request.kind === "Waiting"
    ? ok(request)
    : err({ kind: "InvalidState", currentKind: request.kind, expectedKind: "Waiting" });
```

## Controller層でのエラー変換

ドメインエラーをHTTPレスポンスに変換するのはController層の責務。ドメインエラーのkindに基づいてステータスコードを決定する。

```typescript
const toHttpResponse = (error: AssignDriverError): Response => {
  switch (error.kind) {
    case "RequestNotFound":
      return notFound(`Request ${error.requestId} not found`);
    case "InvalidState":
      return conflict(`Expected ${error.expectedKind}, got ${error.currentKind}`);
    case "DriverNotAvailable":
      return unprocessableEntity(`Driver ${error.driverId} is not available`);
    default:
      return assertNever(error);
  }
};
```

## 例外を使うべき場所

ドメイン層では例外をスローしないが、以下の場所では例外が適切:

- `assertNever`: 到達不能コードの検出（プログラムのバグ）
- インフラ層の予期しない障害（DB接続断など）— これはフレームワークのエラーハンドラに任せる
