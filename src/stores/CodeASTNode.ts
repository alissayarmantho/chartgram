import { Node, Edge } from "reactflow";
import { NodeData } from "./store";
import { cleanPython, Python3Parser } from "dt-python-parser";

export type CodeASTNodeChild = CodeASTNode | null;

export class CodeASTNode {
  pythonCode: string;

  constructor(pythonCode: string) {
    this.pythonCode = pythonCode;
  }

  toFlow(): { nodes: Node<NodeData>[]; edges: Edge[] } {
    const cleanedPython = cleanPython(this.pythonCode);

    // Instantiate the Parser
    const parser = new Python3Parser();
    // Syntax validation
    const errors = parser.validate(cleanedPython);
    if (errors.length > 0) {
      console.log("Syntax errors found:", errors);
      throw new Error("Syntax errors found. Cannot convert to flow.");
    }

    if (cleanedPython === "") {
      // Starter pack :)
      return {
        nodes: [
          {
            id: "main-start",
            type: "circle_start",
            position: { x: 500, y: 100 },
            data: { label: "Main Start", functionType: "start" },
          },
          {
            id: "main-end",
            type: "circle_end",
            data: { label: "Main End", functionType: "end" },
            position: { x: 500, y: 400 },
          },
        ],
        edges: [],
      };
    }

    const ast = parser.parse(this.pythonCode);
    console.log(ast);

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    return { nodes, edges };
  }
}
