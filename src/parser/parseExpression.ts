import {
  concatExpression,
  Expression,
  outputExpression,
  textExpression,
} from "../ast/expression";
import { expectExpression } from "./expect";
import { skipTrivia } from "./skipTrivia";
import { isElement, isText } from "./util";

export function parseExpression(
  program: readonly Node[]
): [expression: Expression, next: Node[]] | undefined {
  const res1 = parseOneExpression(program);
  if (res1 === undefined) {
    return undefined;
  }
  const [expression1, rest] = res1;
  const seq: Expression[] = [expression1];
  let nodes: Node[] = rest;
  // if there is more expressions, generate a ConcatExpression
  while (true) {
    const res = parseOneExpression(nodes);
    if (res === undefined) {
      break;
    }
    const [expression, rest] = res;
    seq.push(expression);
    nodes = rest;
  }
  if (seq.length === 1) {
    return [seq[0], rest];
  }
  return [concatExpression(seq[0].node, seq), nodes];
}

function parseOneExpression(
  program: readonly Node[]
): [expression: Expression, next: Node[]] | undefined {
  const prog = skipTrivia(program);
  const firstChild = prog[0];
  if (!firstChild) {
    return undefined;
  }

  if (isElement(firstChild)) {
    switch (firstChild.tagName) {
      case "BR": {
        // Br is treated as a "\n" text
        return [textExpression(firstChild, "\n"), prog.slice(1)];
      }
      case "OUTPUT": {
        // OutputExpression
        const [exp, next] = expectExpression(
          Array.from(firstChild.childNodes),
          firstChild
        );
        return [outputExpression(firstChild, exp), next];
      }
    }
  } else if (isText(firstChild)) {
    return [
      textExpression(firstChild, firstChild.nodeValue || ""),
      prog.slice(1),
    ];
  }

  return undefined;
}
