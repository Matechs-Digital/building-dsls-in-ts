/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { pipe } from "@effect-ts/core/Function"

//
// DSL
//

export type Expr = Val | Add | Mul | Sub | Div

export class Val {
  readonly _tag = "Val"
  constructor(readonly value: number) {}
}

export function val(value: number): Expr {
  return new Val(value)
}

export class Add {
  readonly _tag = "Add"
  constructor(readonly left: Expr, readonly right: Expr) {}
}

export function add(right: Expr) {
  return (left: Expr): Expr => new Add(left, right)
}

export class Mul {
  readonly _tag = "Mul"
  constructor(readonly left: Expr, readonly right: Expr) {}
}

export function mul(right: Expr) {
  return (left: Expr): Expr => new Mul(left, right)
}

export class Sub {
  readonly _tag = "Sub"
  constructor(readonly left: Expr, readonly right: Expr) {}
}

export function sub(right: Expr) {
  return (left: Expr): Expr => new Sub(left, right)
}

export class Div {
  readonly _tag = "Div"
  constructor(readonly left: Expr, readonly right: Expr) {}
}

export function div(right: Expr) {
  return (left: Expr): Expr => new Div(left, right)
}

export function compute(expr: Expr): number {
  switch (expr._tag) {
    case "Add": {
      return compute(expr.left) + compute(expr.right)
    }
    case "Mul": {
      return compute(expr.left) * compute(expr.right)
    }
    case "Div": {
      return compute(expr.left) / compute(expr.right)
    }
    case "Sub": {
      return compute(expr.left) - compute(expr.right)
    }
    case "Val": {
      return expr.value
    }
  }
}

//
// Usage
//

export const operation = pipe(
  val(0),
  add(val(1)),
  mul(pipe(val(1), div(val(3)))),
  sub(val(2))
)

//
// Safe
//

export function computeSafe(expr: Expr): number {
  let result: number | undefined

  type Frame =
    | { _tag: "Add"; right: Expr }
    | { _tag: "AddValue"; value: number }
    | { _tag: "Mul"; right: Expr }
    | { _tag: "MulValue"; value: number }
    | { _tag: "Sub"; right: Expr }
    | { _tag: "SubValue"; value: number }
    | { _tag: "Div"; right: Expr }
    | { _tag: "DivValue"; value: number }

  const stack: Frame[] = []

  recursing: while (1) {
    pushing: while (1) {
      switch (expr._tag) {
        case "Val": {
          result = expr.value
          break pushing
        }
        case "Add": {
          stack.push({ _tag: "Add", right: expr.right })
          expr = expr.left
          continue pushing
        }
        case "Mul": {
          stack.push({ _tag: "Mul", right: expr.right })
          expr = expr.left
          continue pushing
        }
        case "Sub": {
          stack.push({ _tag: "Sub", right: expr.right })
          expr = expr.left
          continue pushing
        }
        case "Div": {
          stack.push({ _tag: "Div", right: expr.right })
          expr = expr.left
          continue pushing
        }
      }
    }
    popping: while (1) {
      if (stack.length === 0) {
        return result!
      }
      const frame = stack.pop()!
      switch (frame._tag) {
        case "Add": {
          expr = frame.right
          stack.push({ _tag: "AddValue", value: result! })
          result = undefined
          continue recursing
        }
        case "AddValue": {
          result = frame.value + result!
          continue popping
        }
        case "Mul": {
          expr = frame.right
          stack.push({ _tag: "MulValue", value: result! })
          result = undefined
          continue recursing
        }
        case "MulValue": {
          result = frame.value * result!
          continue popping
        }
        case "Div": {
          expr = frame.right
          stack.push({ _tag: "DivValue", value: result! })
          result = undefined
          continue recursing
        }
        case "DivValue": {
          result = frame.value / result!
          continue popping
        }
        case "Sub": {
          expr = frame.right
          stack.push({ _tag: "SubValue", value: result! })
          result = undefined
          continue recursing
        }
        case "SubValue": {
          result = frame.value - result!
          continue popping
        }
      }
    }
  }
  throw new Error("non reachable")
}
