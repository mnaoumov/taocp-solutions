import type {
  ParserServicesWithTypeInformation,
  TSESTree
} from '@typescript-eslint/utils';
import type { Rule } from 'eslint';
import type {
  Signature,
  Type,
  TypeChecker,
  TypeNode
} from 'typescript';

import {
  isIdentifier,
  isTypeAliasDeclaration,
  isTypeReferenceNode,
  isUnionTypeNode,
  SymbolFlags,
  TypeFlags
} from 'typescript';

import { assertNonNullable } from '../type-guards.ts';

export const MESSAGE_ID = 'noAsyncCallbackToUnsafeReturn';

function hasUnsafeReturnCallSignature(checker: TypeChecker, type: Type): boolean {
  return type.getCallSignatures().some((sig) => isUnsafeReturnSignature(checker, sig));
}

function isAsyncFunctionNode(node: TSESTree.Node): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- AST node type string literals match the TSESTree enum values.
  return (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') && node.async;
}

// eslint-disable-next-line no-bitwise -- Bitwise flag mask is idiomatic for TypeScript compiler API.
const UNSAFE_RETURN_FLAGS = TypeFlags.Any | TypeFlags.Unknown;

const PROMISE_TYPE_NAMES = new Set(['Promise', 'PromiseLike']);

function containsPromiseReference(checker: TypeChecker, node: TypeNode): boolean {
  if (isUnionTypeNode(node)) {
    return node.types.some((member) => containsPromiseReference(checker, member));
  }

  if (isTypeReferenceNode(node)) {
    const name = isIdentifier(node.typeName) ? node.typeName.text : '';
    if (PROMISE_TYPE_NAMES.has(name)) {
      return true;
    }

    let symbol = checker.getSymbolAtLocation(node.typeName);
    // eslint-disable-next-line no-bitwise -- Bitwise flag check is idiomatic for TypeScript compiler API.
    if (symbol && symbol.flags & SymbolFlags.Alias) {
      symbol = checker.getAliasedSymbol(symbol);
    }
    const decl = symbol?.declarations?.[0];
    if (decl && isTypeAliasDeclaration(decl)) {
      return containsPromiseReference(checker, decl.type);
    }
  }

  return false;
}

function isUnsafeReturnSignature(checker: TypeChecker, sig: Signature): boolean {
  const returnType = checker.getReturnTypeOfSignature(sig);

  // eslint-disable-next-line no-bitwise -- Bitwise flag check is idiomatic for TypeScript compiler API.
  if (!(returnType.flags & UNSAFE_RETURN_FLAGS)) {
    return false;
  }

  const decl = sig.getDeclaration();
  const returnTypeNode = decl.type;
  assertNonNullable(returnTypeNode, 'Signature declarations with any/unknown return always have a return type annotation');

  return !containsPromiseReference(checker, returnTypeNode);
}

export const noAsyncCallbackToUnsafeReturn: Rule.RuleModule = {
  create(context) {
    const services = context.sourceCode.parserServices as ParserServicesWithTypeInformation;
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node: Rule.Node): void {
        const callNode = node as TSESTree.CallExpression;

        for (let i = 0; i < callNode.arguments.length; i++) {
          const arg = callNode.arguments[i];
          if (!arg || !isAsyncFunctionNode(arg)) {
            continue;
          }

          const tsCalleeNode = services.esTreeNodeToTSNodeMap.get(callNode.callee);
          const calleeType = checker.getTypeAtLocation(tsCalleeNode);

          for (const sig of calleeType.getCallSignatures()) {
            const param = sig.getParameters()[i];
            if (!param) {
              continue;
            }

            const paramType = checker.getTypeOfSymbol(param);

            if (hasUnsafeReturnCallSignature(checker, paramType)) {
              context.report({
                messageId: MESSAGE_ID,
                node: arg
              });
              break;
            }
          }
        }
      }
    };
  },
  meta: {
    docs: {
      description: 'Disallow passing async functions as callbacks to parameters with `any` or `unknown` return type'
    },
    messages: {
      [MESSAGE_ID]:
        'Async function passed as callback to a parameter with `any`/`unknown` return type. This may cause unhandled promise rejections. Wrap the call: `(...args) => { yourAsyncFn(...args); }`.'
    },
    schema: [],
    type: 'problem'
  }
};
