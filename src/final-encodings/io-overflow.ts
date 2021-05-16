import { pipe } from "@effect-ts/core/Function"

import * as IO from "./io"

function factorial(n: number): IO.IO<never, number> {
  if (n === 0) {
    return IO.succeed(1)
  }
  return pipe(
    IO.suspend(() => factorial(n - 1)),
    IO.chain((x) => IO.succeed(x * n))
  )
}

const res = IO.run(factorial(100_000))

if (res._tag === "Failure") {
  console.error(res.error)
}
