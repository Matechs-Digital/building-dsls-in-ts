import { identity, pipe } from "@effect-ts/core/Function"

//
// Interpreter
//

export type Expr<A> =
  | NumberValue<A>
  | StringValue<A>
  | Add<A>
  | Mul<A>
  | Sub<A>
  | Div<A>
  | Stringify<A>
  | Concat<A>

export class NumberValue<A> {
  readonly _tag = "NumberValue"
  constructor(readonly value: number, readonly _A: (_: number) => A) {}
}

export function numeric(value: number): Expr<number> {
  return new NumberValue(value, identity)
}

export class StringValue<A> {
  readonly _tag = "StringValue"
  constructor(readonly value: string, readonly _A: (_: string) => A) {}
}

export function string(value: string): Expr<string> {
  return new StringValue(value, identity)
}

export class Add<A> {
  readonly _tag = "Add"
  constructor(
    readonly left: Expr<number>,
    readonly right: Expr<number>,
    readonly _A: (_: number) => A
  ) {}
}

export function add(right: Expr<number>) {
  return (left: Expr<number>): Expr<number> => new Add(left, right, identity)
}

export class Mul<A> {
  readonly _tag = "Mul"
  constructor(
    readonly left: Expr<number>,
    readonly right: Expr<number>,
    readonly _A: (_: number) => A
  ) {}
}

export function mul(right: Expr<number>) {
  return (left: Expr<number>): Expr<number> => new Mul(left, right, identity)
}

export class Sub<A> {
  readonly _tag = "Sub"
  constructor(
    readonly left: Expr<number>,
    readonly right: Expr<number>,
    readonly _A: (_: number) => A
  ) {}
}

export function sub(right: Expr<number>) {
  return (left: Expr<number>): Expr<number> => new Sub(left, right, identity)
}

export class Div<A> {
  readonly _tag = "Div"
  constructor(
    readonly left: Expr<number>,
    readonly right: Expr<number>,
    readonly _A: (_: number) => A
  ) {}
}

export function div(right: Expr<number>) {
  return (left: Expr<number>): Expr<number> => new Div(left, right, identity)
}

export class Stringify<A> {
  readonly _tag = "Stringify"
  constructor(readonly child: Expr<number>, readonly _A: (_: string) => A) {}
}

export function stringify(child: Expr<number>): Expr<string> {
  return new Stringify(child, identity)
}

export class Concat<A> {
  readonly _tag = "Concat"
  constructor(
    readonly left: Expr<string>,
    readonly right: Expr<string>,
    readonly _A: (_: string) => A
  ) {}
}

export function concat(right: Expr<string>) {
  return (left: Expr<string>): Expr<string> => new Concat(left, right, identity)
}

//
// Usage
//

// Expr<number>
export const operation = pipe(
  numeric(0),
  add(numeric(1)),
  mul(pipe(numeric(1), div(numeric(3)))),
  sub(numeric(2))
)

// Expr<string>
export const operationStr = pipe(string("operation:"), concat(stringify(operation)))

export function compute<A>(expr: Expr<A>): A {
  switch (expr._tag) {
    case "Add": {
      return expr._A(compute(expr.left) + compute(expr.right))
    }
    case "Mul": {
      return expr._A(compute(expr.left) * compute(expr.right))
    }
    case "Div": {
      return expr._A(compute(expr.left) / compute(expr.right))
    }
    case "Sub": {
      return expr._A(compute(expr.left) - compute(expr.right))
    }
    case "NumberValue": {
      return expr._A(expr.value)
    }
    case "StringValue": {
      return expr._A(expr.value)
    }
    case "Concat": {
      return expr._A(compute(expr.left) + compute(expr.right))
    }
    case "Stringify": {
      return expr._A(String(compute(expr.child)))
    }
  }
}
