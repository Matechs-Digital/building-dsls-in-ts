/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-constant-condition */
import * as E from "@effect-ts/core/Either"
import { pipe } from "@effect-ts/core/Function"

export type IO<E, A> = Success<E, A> | Failure<E, A> | Suspend<E, A> | Chain<E, A>

export class Success<E, A> {
  readonly _tag = "Success"
  readonly _E!: () => E
  readonly _A!: () => A
  constructor(readonly value: any) {}
}

export function succeed<A>(value: A): IO<never, A> {
  return new Success(value)
}

export class Failure<E, A> {
  readonly _tag = "Failure"
  readonly _E!: () => E
  readonly _A!: () => A
  constructor(readonly error: any) {}
}

export function fail<E>(error: E): IO<E, never> {
  return new Failure(error)
}

export class Suspend<E, A> {
  readonly _tag = "Suspend"
  readonly _E!: () => E
  readonly _A!: () => A
  constructor(readonly io: () => IO<any, any>) {}
}

export function suspend<E, A>(io: () => IO<E, A>): IO<E, A> {
  return new Suspend(io)
}

export class Chain<E, A> {
  readonly _E!: () => E
  readonly _A!: () => A
  readonly _tag = "Chain"
  constructor(readonly io: IO<any, any>, readonly f: (a: any) => IO<any, any>) {}
}

export function chain<A0, E1, A1>(f: (a: A0) => IO<E1, A1>) {
  return <E0>(io: IO<E0, A0>): IO<E0 | E1, A1> => new Chain(io, f)
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
          stack.push({ _tag: "ChainCont", f: current.f })
          current = current.io
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
