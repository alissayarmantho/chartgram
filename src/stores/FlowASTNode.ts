import jsep from "jsep";
import object from "@jsep-plugin/object";
import { isValidArgument, isValidVariableFunctionName } from "./utils";
jsep.plugins.register(object);

export enum LoopType {
  While,
  For,
}

export enum IOType {
  Input,
  Output,
}

export type FlowASTNodeChild = FlowASTNode | null;
export abstract class FlowASTNode {
  children: FlowASTNodeChild[] = [];
  nestingLevel: number;
  nodeId: string;

  constructor(nestingLevel: number, nodeId: string) {
    this.nestingLevel = nestingLevel;
    this.nodeId = nodeId;
  }

  setId(nodeId: string): void {
    this.nodeId = nodeId;
  }

  setNestingLevel(nestingLevel: number): void {
    this.nestingLevel = nestingLevel;
  }

  abstract toCode(): string;
}

export abstract class StatementFlowNode extends FlowASTNode {
  abstract toCode(): string;
}

export class StatementListFlowNode extends FlowASTNode {
  statements: StatementFlowNode[] = [];

  constructor(
    nestingLevel: number,
    nodeId: string,
    statements: StatementFlowNode[] = []
  ) {
    super(nestingLevel, nodeId);
    this.statements = statements;
  }
  addStatement(statement: StatementFlowNode): void {
    this.statements.push(statement);
  }

  toCode(): string {
    return (
      this.statements.map((statement) => statement.toCode()).join("\n") + "\n"
    );
  }
}

export class AssignmentFlowNode extends FlowASTNode {
  varName: string;
  expression: string;
  parsedExpression: jsep.Expression | null = null;

  constructor(
    nestingLevel: number,
    nodeId: string,
    varName: string,
    expression: string
  ) {
    super(nestingLevel, nodeId);
    this.varName = varName;
    this.expression = expression;
    this.validateExpression();
  }
  validateExpression(): void {
    if (!isValidVariableFunctionName(this.varName)) {
      throw new Error(
        `Invalid variable name '${this.varName}'. Variable names must be alphanumeric_ and does not start with numbers`
      );
    }
    if (this.expression === "") {
      throw new Error("Empty assignment expression is not allowed");
    }

    // I'm allowing int/str type casting to go through here cuz input is always string :(
    // and users may need to cast to int for the value to be useful
    const typeCastingPattern = /^(int|str)\(([a-zA-Z0-9]+)\)$/;

    // Test the expression against the pattern
    if (!typeCastingPattern.test(this.expression)) {
      try {
        const parsedExpression = jsep(this.expression);
        this.parsedExpression = parsedExpression;
      } catch (error: any) {
        console.error(
          `Syntax error in expression '${this.expression}':`,
          error.message
        );
        throw new Error(`Invalid expression: ${this.expression}`);
      }
    }
  }

  toCode(): string {
    return `${" ".repeat(this.nestingLevel * 4)}${this.varName} = ${
      this.expression
    }`;
  }
}

export class IfFlowNode extends StatementFlowNode {
  conditionExpression: string; // For simplicity, the condition is a string; consider using a more complex type for real expression handling
  thenStatementListNode: StatementListFlowNode | null;
  elseStatementListNode: StatementListFlowNode | null; // Else branch is optional
  parsedCondition: jsep.Expression | null = null;

  constructor(
    nestingLevel: number,
    nodeId: string,
    conditionExpression: string,
    thenStatements?: StatementListFlowNode,
    elseStatements?: StatementListFlowNode
  ) {
    super(nestingLevel, nodeId);
    this.conditionExpression = conditionExpression;
    this.thenStatementListNode = thenStatements || null;
    this.elseStatementListNode = elseStatements || null;
    this.validateCondition();
  }

  getThenStatements(): StatementListFlowNode | null {
    return this.thenStatementListNode;
  }

  getElseStatements(): StatementListFlowNode | null {
    return this.elseStatementListNode;
  }

  toCode(): string {
    const indent = " ".repeat(this.nestingLevel * 4);
    let code = `${indent}if (${this.conditionExpression}):\n`;
    if (
      this.thenStatementListNode &&
      this.thenStatementListNode.statements.length > 0
    ) {
      code += this.thenStatementListNode.toCode();
    } else {
      code += `${indent}    pass\n`;
    }
    if (this.elseStatementListNode) {
      code += `${indent}else:\n`;
      if (this.elseStatementListNode.statements.length === 0) {
        code += `${indent}    pass\n`;
      } else {
        code += this.elseStatementListNode.toCode();
      }
    }

    return code;
  }
  validateCondition(): void {
    try {
      const parsedExpression = jsep(this.conditionExpression);
      this.parsedCondition = parsedExpression;
    } catch (error: any) {
      console.error(
        `Syntax error in expression '${this.conditionExpression}':`,
        error.message
      );
      throw new Error(`Invalid expression: ${this.conditionExpression}`);
    }
  }
}

export class LoopFlowNode extends StatementFlowNode {
  loopType: LoopType;
  iteration: string;
  body: StatementListFlowNode;
  parsedCondition: jsep.Expression | null = null;

  constructor(
    nestingLevel: number,
    nodeId: string,
    loopType: LoopType,
    iteration: string,
    body: StatementListFlowNode
  ) {
    super(nestingLevel, nodeId);
    this.loopType = loopType;
    this.iteration = iteration;
    this.body = body;
    if (this.loopType === LoopType.While) {
      this.validateCondition();
    }
  }

  getBody(): StatementListFlowNode {
    return this.body;
  }

  toCode(): string {
    const indent = " ".repeat(this.nestingLevel * 4);
    let loopHeader = "";

    if (this.loopType === LoopType.While) {
      loopHeader = `while ${this.iteration}:`;
    } else if (this.loopType === LoopType.For) {
      loopHeader = `for ${this.iteration}:`;
    }

    let code = `${indent}${loopHeader}\n`;
    if (this.body.statements.length === 0) {
      code += `${indent}    pass\n`; // Applying one level of indentation within the loop for an empty body
    } else {
      code += this.body.toCode(); // the body should already have +1 indentation probably
    }

    return code;
  }
  validateCondition(): void {
    try {
      const parsedExpression = jsep(this.iteration);
      this.parsedCondition = parsedExpression;
    } catch (error: any) {
      console.error(
        `Syntax error in condition '${this.iteration}':`,
        error.message
      );
      throw new Error(`Invalid condition: ${this.iteration}`);
    }
  }
}

export class InputOutputFlowNode extends StatementFlowNode {
  ioType: IOType;
  varName: string;

  constructor(
    nestingLevel: number,
    nodeId: string,
    ioType: IOType,
    varName: string
  ) {
    super(nestingLevel, nodeId);
    this.ioType = ioType;
    this.varName = varName;
    if (!isValidVariableFunctionName(this.varName)) {
      throw new Error(
        `Invalid variable name '${this.varName}'. Variable names must be alphanumeric_ and does not start with numbers`
      );
    }
  }

  toCode(): string {
    const indent = " ".repeat(this.nestingLevel * 4);
    if (this.ioType === IOType.Input) {
      return `${indent}${this.varName} = input("Getting input for ${this.varName}. Remember input is always type string...: ")`;
    } else if (this.ioType === IOType.Output) {
      return `${indent}print(${this.varName})`;
    }
    return ""; // Fallback case
  }
}

export class MiscellaneousStatementNode extends StatementFlowNode {
  statement: string;

  constructor(nestingLevel: number, nodeId: string, statement: string) {
    super(nestingLevel, nodeId);
    this.statement = statement;
    this.validateStatement();
  }
  validateStatement(): void {
    if (this.statement === "") {
      throw new Error("Empty statement is not allowed");
    }
    // Patterns to match the list and dictionary operations
    const listInsertPattern = /^[a-zA-Z0-9_]+\.append\([^)]+\)$/;
    const listInsertAtPattern = /^[a-zA-Z0-9_]+\.insert\(\d+,[^)]+\)$/;
    const listRemovePattern = /^[a-zA-Z0-9_]+\.remove\([^)]+\)$/;
    const listRemoveAtPattern = /^[a-zA-Z0-9_]+\.pop\(\d+\)$/;
    const accessPattern = /^[a-zA-Z0-9_]+\[[^\]]+\]$/;
    const dictInsertPattern = /^[a-zA-Z0-9_]+\[[^\]]+\] = .+$/;
    const dictRemovePattern = /^del [a-zA-Z0-9_]+\[[^\]]+\]$/;
    const functionCallPattern = /^(\w+)\((.*?)\)$/;

    // Test the statement against all patterns
    if (
      !(
        listInsertPattern.test(this.statement) ||
        listInsertAtPattern.test(this.statement) ||
        listRemovePattern.test(this.statement) ||
        listRemoveAtPattern.test(this.statement) ||
        dictInsertPattern.test(this.statement) ||
        dictRemovePattern.test(this.statement) ||
        accessPattern.test(this.statement) ||
        functionCallPattern.test(this.statement)
      )
    ) {
      throw new Error(
        `Invalid statement: '${this.statement}'. Does not match any supported list / dictionary operations or function call`
      );
    }
    if (functionCallPattern.test(this.statement)) {
      const match = this.statement.match(functionCallPattern);
      if (match) {
        const functionName = match[1];
        const args = match[2];
        if (!isValidVariableFunctionName(functionName)) {
          throw new Error(
            `Invalid function name '${functionName}'. Function names must be alphanumeric_ and does not start with numbers`
          );
        }
        const argsList = args.split(",");
        if (!(argsList.length === 1 && argsList[0] === "")) {
          argsList.forEach((arg: string) => {
            if (!isValidArgument(arg.trim())) {
              throw new Error(
                `Invalid argument '${arg}'. Function arguments must be primitives / in the form of variables which are alphanumeric_ and does not start with numbers`
              );
            }
          });
        }
      }
    }
  }
  toCode(): string {
    return `${" ".repeat(this.nestingLevel * 4)}${this.statement}`;
  }
}

export class FunctionFlowNode extends FlowASTNode {
  functionName: string;
  body: StatementListFlowNode;
  argumentExpressions: string[];
  returnExpression: string;

  constructor(
    nestingLevel: number,
    nodeId: string,
    functionName: string,
    body: StatementListFlowNode,
    argumentExpressions: string[],
    returnExpression: string
  ) {
    super(nestingLevel, nodeId);
    this.functionName = functionName;
    if (this.functionName === "") {
      throw new Error("Function name cannot be empty.");
    }
    if (!isValidVariableFunctionName(this.functionName)) {
      throw new Error(
        `Invalid function name '${this.functionName}'. Function names must be alphanumeric_ and does not start with numbers`
      );
    }
    this.body = body;
    this.argumentExpressions = argumentExpressions;
    this.returnExpression = returnExpression;
    // Validate argumentExpressions and returnExpression
    this.validateArguments();
    if (this.returnExpression !== "") {
      this.validateReturnExpression();
    }
  }

  getBody(): StatementListFlowNode {
    return this.body;
  }

  validateArguments(): void {
    this.argumentExpressions.forEach((arg: string) => {
      if (!isValidVariableFunctionName(arg)) {
        throw new Error(
          `Invalid argument '${arg}'. Function arguments must be alphanumeric_ and does not start with numbers`
        );
      }
    });
  }

  validateReturnExpression(): void {
    if (!isValidArgument(this.returnExpression)) {
      throw new Error(
        `Invalid return value '${this.returnExpression}'. Return value must be primitives / in the forms of variables which are alphanumeric_ and does not start with numbers`
      );
    }
  }

  toCode(): string {
    const indent = " ".repeat(this.nestingLevel * 4);
    const args = this.argumentExpressions.join(", ");
    let functionHeader = `${indent}def ${this.functionName}(${args}):\n`;
    let functionBody =
      this.body.statements.length > 0
        ? this.body.toCode()
        : `${" ".repeat((this.nestingLevel + 1) * 4)}pass\n`;
    let functionReturn = `${" ".repeat((this.nestingLevel + 1) * 4)}return ${
      this.returnExpression
    }\n`;

    return functionHeader + functionBody + functionReturn;
  }
}
