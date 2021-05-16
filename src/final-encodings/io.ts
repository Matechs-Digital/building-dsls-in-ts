import { pipe } from "@effect-ts/core/Function"

//
// DSL
//

export class Failure<E> {
  readonly _tag = "Failure"
  constructor(readonly error: E) {}
}

export class Success<A> {
  readonly _tag = "Success"
  constructor(readonly result: A) {}
}

export type Result<E, A> = Failure<E> | Success<A>

export class IO<E, A> {
  readonly _tag = "IO"
  constructor(readonly thunk: () => Result<E, A>) {}
}

export function succeed<A>(a: A): IO<never, A> {
  return new IO(() => new Success(a))
}

export function fail<E>(e: E): IO<E, never> {
  return new IO(() => new Failure(e))
}

export function succeedWith<A>(f: () => A): IO<never, A> {
  return new IO(() => new Success(f()))
}

export function failWith<E>(e: () => E): IO<E, never> {
  return new IO(() => new Failure(e()))
}

export function tryCatch<E, A>(f: () => A, onError: (_: unknown) => E): IO<E, A> {
  return new IO(() => {
    try {
      return new Success(f())
    } catch (e) {
      return new Failure(onError(e))
    }
  })
}

export function chain<A, E1, B>(that: (a: A) => IO<E1, B>) {
  return <E>(self: IO<E, A>): IO<E | E1, B> =>
    new IO<E | E1, B>(() => {
      const a = self.thunk()
      if (a._tag === "Success") {
        return that(a.result).thunk()
      }
      return a
    })
}

export function suspend<E, A>(f: () => IO<E, A>): IO<E, A> {
  return new IO(() => f().thunk())
}

export function run<E, A>(io: IO<E, A>): Result<E, A> {
  return io.thunk()
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
