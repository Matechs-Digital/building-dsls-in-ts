import * as Expr from "./expr"

//
// Execution
//

const result = Expr.computeSafe(Expr.operation)

console.log(`Result: ${result}`)
