import * as IO from "./io"

const res = IO.run(IO.program)

if (res._tag === "Failure") {
  console.error(res.error)
}
