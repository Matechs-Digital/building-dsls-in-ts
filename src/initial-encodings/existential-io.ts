/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-constant-condition */

import * as E from "@effect-ts/core/Either"
import { identity, pipe } from "@effect-ts/core/Function"

export type IO<E, A> = Success<E, A> | Failure<E, A> | Suspend<E, A> | Chain<E, A>

export class Success<E, A> {
  readonly _tag = "Success"
  constructor(readonly value: A, readonly _E: (_: never) => E) {}
}

export function succeed<A>(value: A): IO<never, A> {
  return new Success(value, identity)
}

export class Failure<E, A> {
  readonly _tag = "Failure"
  constructor(readonly error: E, readonly _A: (_: never) => A) {}
}

export function fail<E>(error: E): IO<E, never> {
  return new Failure(error, identity)
}

export class Suspend<E, A> {
  readonly _tag = "Suspend"
  constructor(readonly io: () => IO<E, A>) {}
}

export function suspend<E, A>(io: () => IO<E, A>): IO<E, A> {
  return new Suspend(io)
}

export class Chain<E, A> {
  readonly _tag = "Chain"
  constructor(
    readonly use: <X>(
      body: <E0, A0, E1, A1>(_: {
        readonly _E: (_: E0 | E1) => E
        readonly _A: (_: A1) => A

        readonly io: IO<E0, A0>
        readonly f: (a: A0) => IO<E1, A1>
      }) => X
    ) => X
  ) {}
}

export function chain<A0, E1, A1>(f: (a: A0) => IO<E1, A1>) {
  return <E0>(io: IO<E0, A0>): IO<E0 | E1, A1> =>
    new Chain((body) =>
      body({
        io,
        f,
        _E: identity,
        _A: identity
      })
    )
}

export function succeedWith<A>(f: () => A): IO<never, A> {
  return suspend(() => succeed(f()))
}

export function failWith<E>(e: () => E): IO<E, never> {
  return suspend(() => fail(e()))
}

export function tryCatch<E, A>(f: () => A, onError: (_: unknown) => E): IO<E, A> {
  return suspend(() => {
    try {
      return succeed(f())
    } catch (e) {
      return fail(onError(e))
    }
  })
}

//
// Usage
//

export const program = pipe(
  succeed(0),
  chain((n) => succeed(n + 1)),
  chain((n) => succeed(n * 2)),
  chain((n) =>
    succeedWith(() => {
      console.log(`computed: ${n}`)
    })
  )
)

//
// Interpreter
//

export function run<E, A>(io: IO<E, A>): E.Either<E, A> {
  switch (io._tag) {
    case "Success": {
      return E.right(io.value)
    }
    case "Failure": {
      return E.left(io.error)
    }
    case "Suspend": {
      return run(io.io())
    }
    case "Chain": {
      return io.use(({ _A, _E, f, io }) => {
        const res = run(io)
        if (res._tag === "Right") {
          const resB = run(f(res.right))
          if (resB._tag === "Left") {
            return E.left(_E(resB.left))
          } else {
            return E.right(_A(resB.right))
          }
        } else {
          return E.left(_E(res.left))
        }
      })
    }
  }
}

//
// Safe
//

export function runSafe<E, A>(io: IO<E, A>): E.Either<E, A> {
  let result = undefined
  let isError = false
  let current: IO<any, any> = io
  type Frame = { _tag: "ChainCont"; f: (_: any) => IO<any, any> }
  const stack: Frame[] = []

  recursing: while (1) {
    pushing: while (1) {
      switch (current._tag) {
        case "Success": {
          isError = false
          result = current.value
          break pushing
        }
        case "Failure": {
          isError = true
          result = current.error
          break pushing
        }
        case "Suspend": {
          current = current.io()
          continue pushing
        }
        case "Chain": {
          current.use(({ f, io }) => {
            stack.push({ _tag: "ChainCont", f })
            current = io
          })
          continue pushing
        }
      }
    }
    popping: while (1) {
      if (stack.length === 0) {
        break recursing
      }
      const frame = stack.pop()!
      switch (frame._tag) {
        case "ChainCont": {
          if (!isError) {
            current = frame.f(result)
            continue recursing
          } else {
            continue popping
          }
        }
      }
    }
  }

  return isError ? E.left(result) : E.right(result)
}

//
// Recursive factorial
//
export function factorial(n: bigint): IO<never, bigint> {
  if (n === BigInt(0)) {
    return succeed(BigInt(1))
  }
  return pipe(
    suspend(() => factorial(n - BigInt(1))),
    chain((x) => succeed(x * n))
  )
}
