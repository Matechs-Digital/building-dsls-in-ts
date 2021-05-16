import { pipe } from "@effect-ts/system/Function"

import * as IO from "./existential-io"

IO.run(
  pipe(
    IO.factorial(BigInt(100_000)),
    IO.chain((n) =>
      IO.succeedWith(() => {
        console.log(`result: ${n}`)
      })
    )
  )
)
