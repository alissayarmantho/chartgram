import React, { useCallback, useRef, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  MiniMap,
  Background,
  Controls,
  ReactFlowProvider,
  ReactFlowInstance,
  Edge,
  MarkerType,
} from "reactflow";
import AceEditor from "react-ace";
import "./Flow.css";
import "reactflow/dist/style.css";
import Button from "@mui/material/Button";
import DiamondNode from "./components/DiamondNode/DiamondNode";
import ParallelogramNode from "./components/ParallelogramNode/ParallelogramNode";
import HexagonNode from "./components/HexagonNode/HexagonNode";
import RectangleNode from "./components/RectangleNode/RectangleNode";
import Sidebar from "./components/Sidebar/Sidebar";
import useStore, { Flow, RFState, NodeData } from "./stores/store";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import { Theme } from "@emotion/react";
import RoundedRectangleNode from "./components/RoundedRectangleNode/RoundedRectangleNode";
import CircleNode from "./components/CircleNode/CircleNode";
import DiamondEndNode from "./components/DiamondEndNode/DiamondEndNode";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import CircleStartNode from "./components/CircleStartNode/CircleStartNode";
import CircleEndNode from "./components/CircleEndNode/CircleEndNode";
import Menubar from "./components/MenuBar/Menubar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { PlayArrow, Update } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import RunFlow from "./components/RunFlow/RunFlow";
import { cleanPython, Python3Parser } from "dt-python-parser";
import { isValidPythonFunctionDefinition } from "./stores/utils";
import {
  AssignmentFlowNode,
  FlowASTNode,
  FunctionFlowNode,
  IOType,
  IfFlowNode,
  InputOutputFlowNode,
  LoopFlowNode,
  LoopType,
  MiscellaneousStatementNode,
  StatementListFlowNode,
} from "./stores/FlowASTNode";
import { Ace } from "ace-builds";
import { usePython } from "react-py";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";
import "ace-builds/src-min-noconflict/ext-searchbox";

const rfStyle = {
  backgroundColor: "#B8CEFF",
};

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));
const nodeTypes = {
  diamond: DiamondNode,
  diamond_end: DiamondEndNode,
  parallelogram: ParallelogramNode,
  hexagon: HexagonNode,
  rectangle: RectangleNode,
  roundedrectangle: RoundedRectangleNode,
  circle: CircleNode,
  circle_start: CircleStartNode,
  circle_end: CircleEndNode,
};

const selector = (state: RFState) => ({
  toastOpen: state.toastOpen,
  toastMessage: state.toastMessage,
  toastType: state.toastType,
  onToastOpen: state.onToastOpen,
  onToastClose: state.onToastClose,
  nodes: state.nodes,
  edges: state.edges,
  pairedEndNodes: state.pairedEndNodes,
  pairedStartNodes: state.pairedStartNodes,
  setAllNodesAndEdges: state.setAllNodesAndEdges,
  lastNodeId: state.lastNodeId,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onEdgeUpdate: state.onEdgeUpdate,
  onConnect: state.onConnect,
  addNode: state.addNode,
  validateFlow: state.validateFlow,
});

const theme: Theme = createTheme({
  typography: {
    fontFamily: "Noto Sans",
    fontSize: 14,
  },
});

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function App() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [runOutput, setRunOutput] = useState("");
  const [runOutputErr, setRunOutputErr] = useState("");
  const [runInput, setRunInput] = useState("");
  const [openAlertStatus, setOpenAlertStatus] = useState(false);
  const [alertStatusMessage, setAlertStatusMessage] = useState("");
  const [alertStatusSeverity, setAlertStatusSeverity] = useState<
    "success" | "error" | "info" | "warning" | undefined
  >("success");
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>(
    null as any
  );
  const [openCodeDialog, setOpenCodeDialog] = React.useState(false);
  const [pythonCode, setPythonCode] = React.useState("");
  const [openRunFlow, setOpenRunFlow] = React.useState(false);
  const [pythonCodeExecutionTimeout, setPythonCodeExecutionTimeout] =
    useState<any>(null);
  const {
    runPython,
    stdout,
    stderr,
    isLoading,
    isRunning,
    isReady,
    isAwaitingInput,
    prompt,
    sendInput,
    interruptExecution,
  } = usePython();

  useEffect(() => {
    if (!isRunning || isAwaitingInput) {
      setRunOutput(stdout);
    }
  }, [stdout, isRunning, isAwaitingInput]);

  useEffect(() => {
    if (!isRunning) {
      setRunOutputErr(stderr);
    }
  }, [stderr, isRunning]);

  useEffect(() => {
    if (!isLoading) {
      setRunInput("");
      setRunOutput("");
      setRunOutputErr("");
    }
  }, [isLoading]);

  async function runFlow() {
    let code = convertFlowToCode();
    if (code === "") {
      setRunOutputErr("Failed to convert flow to code");
      return;
    } else {
      setRunOutputErr("");
      setRunOutput("Running Flow...");
    }
    setPythonCode(code);
    console.log("Running code: \n", code);
    if (pythonCodeExecutionTimeout) {
      clearTimeout(pythonCodeExecutionTimeout);
    }

    setPythonCodeExecutionTimeout(
      setTimeout(() => {
        runPython(code);
      }, 1000)
    );
  }

  function runNextLine() {
    // runPython("next");
  }

  const onOpenRunFlow = () => {
    setOpenRunFlow(true);
  };

  const onCloseRunFlow = () => {
    setOpenRunFlow(false);
  };
  const onOpenCodeDialog = (convertToPython: boolean) => {
    if (convertToPython) {
      let code = convertFlowToCode();
      setPythonCode(code);
      if (code !== "") {
        setOpenCodeDialog(true);
      }
    } else {
      // convertCodeToFlow();
      setOpenCodeDialog(true);
    }
  };
  const onCloseCodeDialog = () => {
    setOpenCodeDialog(false);
  };

  const {
    toastOpen,
    toastMessage,
    toastType,
    onToastClose,
    nodes,
    edges,
    lastNodeId,
    setAllNodesAndEdges,
    onNodesChange,
    onEdgesChange,
    onEdgeUpdate,
    onConnect,
    addNode,
    validateFlow,
    pairedStartNodes,
  } = useStore(selector);

  const saveFlow = () => {
    const flow = {
      nodes: nodes,
      edges: edges,
    };

    const blob = new Blob([JSON.stringify(flow, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "flow.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const loadFlow = () => {
    hiddenFileInput?.current?.click();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setOpenAlertStatus(true);
      setAlertStatusSeverity("success");
      setAlertStatusMessage("Code copied to clipboard");
    } catch (err) {
      setOpenAlertStatus(true);
      setAlertStatusSeverity("error");
      setAlertStatusMessage("Failed to copy code to clipboard");
    }
  };

  // Function to handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target) {
        const text = e.target.result;
        if (typeof text !== "string") {
          setOpenAlertStatus(true);
          setAlertStatusSeverity("error");
          setAlertStatusMessage("Failed to load the file");
          return;
        }
        try {
          const flow: any = JSON.parse(text);
          if (!parseableFlow(flow)) {
            setOpenAlertStatus(true);
            setAlertStatusSeverity("error");
            setAlertStatusMessage("Invalid flow");
            return;
          }
          setAllNodesAndEdges(flow.nodes, flow.edges);
        } catch (error) {
          setOpenAlertStatus(true);
          setAlertStatusSeverity("error");
          setAlertStatusMessage("Failed to load the flow: " + error);
        }
      }
    };
    reader.readAsText(file);
  };
  const isValidNode = (obj: any): obj is Node => {
    return (
      obj &&
      typeof obj.id === "string" &&
      typeof obj.type === "string" &&
      obj.data &&
      typeof obj.data === "object" && // Ensure 'data' exists and is an object
      typeof obj.data.label === "string" &&
      obj.position &&
      typeof obj.position.x === "number" &&
      typeof obj.position.y === "number" &&
      typeof obj.width === "number" &&
      typeof obj.height === "number"
    );
  };
  // Function to validate if an object is an Edge
  const isValidEdge = (obj: any): obj is Edge => {
    return (
      obj &&
      typeof obj.id === "string" &&
      typeof obj.type === "string" &&
      typeof obj.source === "string" &&
      typeof obj.target === "string" &&
      typeof obj.markerEnd === "object" &&
      typeof obj.markerEnd.type === "string" &&
      typeof obj.markerEnd.width === "number" &&
      typeof obj.markerEnd.height === "number" &&
      (!obj.sourceHandle || typeof obj.sourceHandle === "string") &&
      (!obj.targetHandle || typeof obj.targetHandle === "string")
    );
  };

  // Check if the flow can be parsed
  const parseableFlow = (flow: any): flow is Flow => {
    if (!flow || !Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) {
      return false;
    }

    return flow.nodes.every(isValidNode) && flow.edges.every(isValidEdge);
  };
  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      if (reactFlowWrapper.current !== null) {
        const reactFlowBounds =
          reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData("application/reactflow");

        // check if the dropped element is valid
        if (typeof type === "undefined" || !type) {
          return;
        }

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: Node = {
          id: lastNodeId.toString(),
          type,
          position,
          data: { label: "" },
        };

        if (type === "parallelogram") {
          newNode.data = { ...newNode.data, inputType: "input" };
        }
        if (type === "circle") {
          newNode.data = { ...newNode.data, functionType: "start" };
        }
        addNode(type, newNode);
      }
    },
    [reactFlowInstance, lastNodeId, addNode]
  );

  const onClickValidate = () => {
    let validFlowResult = validateFlow();
    if (!validFlowResult.isValid) {
      setAlertStatusSeverity("error");
      setAlertStatusMessage(validFlowResult.validationMessage ?? "");
      setOpenAlertStatus(!validFlowResult.isValid);
    } else {
      setAlertStatusSeverity("success");
      setAlertStatusMessage("Flow is valid");
    }
    setOpenAlertStatus(true);
  };
  const editorOnLoad = (editor: Ace.Editor) => {
    editor.renderer.setScrollMargin(10, 10, 0, 0);
    editor.moveCursorTo(0, 0);
  };
  function createNode(
    type: string,
    label: string,
    lastNodeId: number,
    xPosition: number,
    yPosition: number,
    additionalData = {}
  ): Node<NodeData> {
    // Create the new node object based on the type and provided data
    const newNode = {
      id: lastNodeId.toString(),
      type: type,
      position: { x: xPosition, y: yPosition },
      data: { label, ...additionalData },
    };

    return newNode;
  }

  function createEdge(
    sourceId: string,
    targetId: string,
    lastEdgeId: number,
    sourceHandle: string = "",
    targetHandle: string = ""
  ): Edge {
    const newEdge = {
      id: lastEdgeId.toString(),
      source: sourceId,
      sourceHandle: sourceHandle ?? `${sourceId}-next`,
      target: targetId,
      targetHandle: targetHandle ?? `${targetId}-prev`,
      markerEnd: { type: MarkerType.ArrowClosed, width: 40, height: 40 },
      type: "smoothstep",
    };
    return newEdge;
  }

  const convertCodeToFlow = () => {
    const code = cleanPython(pythonCode);
    const parser = new Python3Parser();
    const errors = parser.validate(code);
    if (errors.length > 0) {
      setAlertStatusSeverity("error");
      setAlertStatusMessage("Syntax errors found. Cannot convert to flow.");
      setOpenAlertStatus(true);
      return;
    }

    if (code === "") {
      // Starter pack :)
      setAllNodesAndEdges(
        [
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
        []
      );
      return;
    }
    const ast = parser.parse(code);
    console.log(ast);
    // TODO: Actually use the visitor pattern given by this parser to convert the code to flow

    let lastNodeId = 0; // Assuming "main-start" is ID 0 for simplicity
    let lastEdgeId = 0;
    let blockStack: any = [];
    let xPosition = 500;
    let yPosition = 100;
    const yIncrement = 100;

    let convertedNodes: Node<NodeData>[] = [
      createNode(
        "circle_start",
        "Main Start",
        lastNodeId,
        xPosition,
        yPosition,
        {
          functionType: "start",
        }
      ),
    ];
    let convertedEdges: Edge[] = [];
    const codeLines = code.trim().split("\n");

    codeLines.forEach((line: string, index: number) => {
      const trimmedLine = line.trim();
      const matchRes = line.match(/^\s*/);
      const currentIndentation = matchRes ? matchRes[0].length : 0;
      const lastBlock =
        blockStack.length > 0 ? blockStack[blockStack.length - 1] : null;

      // Check for change in indentation to close blocks
      if (lastBlock && currentIndentation < lastBlock.indentation) {
        while (
          blockStack.length > 0 &&
          currentIndentation <= blockStack[blockStack.length - 1].indentation
        ) {
          const blockToClose = blockStack.pop();
          let endNodeType, endNodeLabel, endNodeData;
          switch (blockToClose.type) {
            case "if-else":
              endNodeType = "diamond_end";
              break;
            case "while":
            case "for":
              endNodeType = "roundedrectangle_end";
              endNodeLabel = "End Loop";
              endNodeData = { label: endNodeLabel };
              break;
            case "def":
              endNodeType = "circle_end";
              endNodeLabel = "return";
              endNodeData = { label: endNodeLabel, functionType: "end" };
              break;
          }
          // Create the end node for the block
          if (endNodeType && endNodeLabel) {
            const endNode = createNode(
              endNodeType,
              endNodeLabel,
              lastNodeId++,
              xPosition,
              yPosition,
              endNodeData
            );
            convertedNodes.push(endNode);

            const newEdge = createEdge(
              blockToClose.startNodeId.toString(),
              endNode.id,
              lastEdgeId++
            );
            convertedEdges.push(newEdge);

            yPosition += yIncrement;
          }
        }
      }
      let type = "";

      let label = line;
      let additionalData = {};
      if (trimmedLine.startsWith("if")) {
        type = "diamond";
        label = trimmedLine.substring(3, line.length - 1); // Exclude "if:"
        blockStack.push({
          type: "if-else",
          indentation: currentIndentation,
          startNodeId: lastNodeId.toString(),
        });
      } else if (trimmedLine.startsWith("else")) {
      } else if (trimmedLine.includes("=")) {
        const firstEqualIndex = line.indexOf("=");
        const varAssignment = line.substring(0, firstEqualIndex).trim();
        const rest = line.substring(firstEqualIndex + 1).trim();
        if (rest.includes("input")) {
          type = "parallelogram";
          if (
            rest !== "input()" &&
            rest !== "str(input())" &&
            rest !== "int(input())"
          ) {
            // I'm allowing and hardcoding the above :). TODO: Fix this
            setAlertStatusSeverity("error");
            setAlertStatusMessage(
              "Invalid input format. Chartgram currently does not support prompt text for input. Cannot convert to flow."
            );
            setOpenAlertStatus(true);
            return;
          }
          label = varAssignment;
          additionalData = { inputType: "input" };
        } else {
          type = "rectangle";
          label = trimmedLine;
        }
      } else if (trimmedLine.startsWith("print")) {
        type = "parallelogram";
        label = trimmedLine.substring(6, line.length - 1).slice(0, -1); // Exclude "print()"
        additionalData = { inputType: "output" };
      } else if (
        trimmedLine.startsWith("for") ||
        trimmedLine.startsWith("while")
      ) {
        type = "roundedrectangle";
        label = trimmedLine;
        blockStack.push({
          type: "loop",
          indentation: currentIndentation,
          startNodeId: lastNodeId.toString(),
        });
      } else if (trimmedLine.startsWith("def")) {
        let functionSplitted = trimmedLine.split(" ")[1];
        if (functionSplitted.length !== 2) {
          setAlertStatusSeverity("error");
          setAlertStatusMessage(
            "def in python need to have at least a function name. Cannot convert to flow."
          );
          setOpenAlertStatus(true);
          return;
        }
        if (!isValidPythonFunctionDefinition(functionSplitted[1])) {
          setAlertStatusSeverity("error");
          setAlertStatusMessage(
            "Invalid function declaration format. Cannot convert to flow."
          );
          setOpenAlertStatus(true);
          return;
        }
        type = "circle";
        additionalData = { functionType: "start" };
        label = functionSplitted[1].slice(0, -1);
        blockStack.push({
          type: "def",
          indentation: currentIndentation,
          startNodeId: lastNodeId.toString(),
        });
      }

      yPosition = yPosition + yIncrement;
      const newNode = createNode(
        type,
        label,
        lastNodeId,
        xPosition,
        yPosition,
        additionalData
      );
      convertedNodes.push(newNode);
      lastNodeId++;

      if (index > 0) {
        // Skip the first line as it connects to "main-start"
        const newEdge = createEdge(
          convertedNodes[index].id,
          convertedNodes[index + 1].id,
          lastEdgeId
        );
        convertedEdges.push(newEdge);
        lastEdgeId++;
      } else if (index === 0) {
        const newEdge = createEdge(
          "main-start",
          convertedNodes[index].id,
          lastEdgeId
        );
        convertedEdges.push(newEdge);
        lastEdgeId++;
      }
    });

    // Connect the last code line node to "main-end"
    if (convertedNodes.length > 1) {
      const lastCodeNode = convertedNodes[convertedNodes.length - 1];
      const mainEndNode = createNode(
        "circle_end",
        "Main End",
        lastNodeId,
        xPosition,
        yPosition + yIncrement,
        { functionType: "end" }
      );
      lastNodeId++;
      convertedNodes.push(mainEndNode);
      const newEdge = createEdge(lastCodeNode.id, mainEndNode.id, lastEdgeId);
      lastEdgeId++;
      convertedEdges.push(newEdge);
    }

    setAllNodesAndEdges(convertedNodes, convertedEdges);
  };

  function dfsMapEnclosures(
    currentNodeId: string,
    edgeHandle: string,
    parentEnclosureStack: string[],
    visited: Set<string>,
    nodeMap: Map<string, Node<NodeData>>,
    parentEnclosureMap: Map<string, string[]> // second one is always length 2
  ) {
    if (visited.has(currentNodeId)) return;
    visited.add(currentNodeId);

    // Update the current node's parent enclosure with the top of the stack
    if (parentEnclosureStack.length > 0) {
      const currentEnclosureId =
        parentEnclosureStack[parentEnclosureStack.length - 1];
      parentEnclosureMap.set(currentNodeId, [currentEnclosureId, edgeHandle]);
    }

    const currentNode = nodeMap.get(currentNodeId);

    // Check if this node is a starting enclosure node
    if (currentNode && isEnclosureStartNode(currentNode)) {
      parentEnclosureStack.push(currentNodeId); // Push this node as a new enclosure
    }
    if (currentNode && isEnclosureEndNode(currentNode, edgeHandle)) {
      parentEnclosureStack.pop(); // Pop to revert to the previous enclosure
    }
    // Find and traverse all directly connected nodes
    edges
      .filter((edge) => edge.source === currentNodeId)
      .forEach((edge) => {
        // Recursively visit connected nodes
        dfsMapEnclosures(
          edge.target,
          edge.sourceHandle ?? "",
          [...parentEnclosureStack],
          visited,
          nodeMap,
          parentEnclosureMap
        );
      });
  }

  function isEnclosureStartNode(node: Node<NodeData>) {
    return (
      (node.type === "circle" && node.data.functionType !== "end") ||
      node.type === "circle_start" ||
      node.type === "diamond" ||
      node.type === "roundedrectangle"
    );
  }

  function isEnclosureEndNode(node: Node<NodeData>, edgeHandle: string) {
    return (
      (node.type === "circle" && node.data.functionType === "end") ||
      node.type === "diamond_end" ||
      edgeHandle.endsWith("-continue")
    );
  }
  function dfsSortNodes(
    currentNodeId: string,
    visited: Set<string>,
    visitOrder: string[],
    edgesMap: Map<string, Edge[]>
  ) {
    if (visited.has(currentNodeId)) return;
    visited.add(currentNodeId);
    visitOrder.push(currentNodeId);

    const childEdges = edgesMap.get(currentNodeId) || [];
    childEdges.forEach((edge) => {
      dfsSortNodes(edge.target, visited, visitOrder, edgesMap);
    });
  }

  const convertFlowToCode = (): string => {
    let validFlowResult = validateFlow();
    if (!validFlowResult.isValid) {
      setAlertStatusSeverity("error");
      setAlertStatusMessage(validFlowResult.validationMessage ?? "");
      setOpenAlertStatus(!validFlowResult.isValid);
      return "";
    }
    const astNodeMap = new Map<string, FlowASTNode>();
    const parentEnclosureMap = new Map<string, string[]>();
    const astRootNodes: any[] = [];
    const nodeMap = new Map<string, Node<NodeData>>();

    let rootNodes = nodes.filter(
      (node) =>
        node.type === "circle_start" ||
        (node.type === "circle" && node.data.functionType === "start")
    );

    nodes.forEach((node) => {
      nodeMap.set(node.id, node);
    });

    rootNodes.forEach((node) => {
      const visited = new Set<string>();
      const parentEnclosureStack: string[] = [];
      // it should technically always start with -next and should only have 1 edge going out cuz rootnodes should be function nodes
      dfsMapEnclosures(
        node.id,
        node.id + "-next",
        parentEnclosureStack,
        visited,
        nodeMap,
        parentEnclosureMap
      );
    });
    const sortingVisited: Set<string> = new Set();
    const visitOrder: string[] = [];
    const edgesMap = new Map<string, Edge[]>();
    edges.forEach((edge: Edge) => {
      if (!edgesMap.has(edge.source)) {
        edgesMap.set(edge.source, []);
      }
      let edgeList = edgesMap.get(edge.source);
      if (edgeList) {
        edgeList.push(edge);
      }
    });
    rootNodes.forEach((rootNode) => {
      dfsSortNodes(rootNode.id, sortingVisited, visitOrder, edgesMap);
    });

    let hasAnyError: boolean = false;
    visitOrder.every((nodeId) => {
      let astNode: any = null;
      let node = nodeMap.get(nodeId);
      if (!node) {
        setAlertStatusSeverity("error");
        setAlertStatusMessage(`Error for node ${nodeId}: Unable to find node`);
        setOpenAlertStatus(true);
        hasAnyError = true;
        return false;
      }
      const { id, type, data } = node;
      data.label = data.label.trim();
      try {
        switch (type) {
          case "rectangle":
            astNode = new StatementListFlowNode(0, "");
            data.label.split("\n").forEach((line: string) => {
              if (line.includes("=")) {
                const assignmentAstNode = new AssignmentFlowNode(
                  0,
                  id,
                  line.split("=")[0].trim(),
                  line.split("=")[1].trim()
                );
                astNode.addStatement(assignmentAstNode);
              } else {
                const miscAstNode = new MiscellaneousStatementNode(
                  0,
                  id,
                  data.label
                );
                astNode.addStatement(miscAstNode);
              }
            });
            break;
          case "diamond":
            astNode = new IfFlowNode(0, id, data.label, undefined, undefined); // Condition handling simplified
            break;
          case "parallelogram":
            // Input/Output operations
            if (data.inputType === "input") {
              astNode = new InputOutputFlowNode(
                0,
                id,
                IOType.Input,
                data.label
              );
            } else {
              astNode = new InputOutputFlowNode(
                0,
                id,
                IOType.Output,
                data.label
              );
            }
            break;
          case "roundedrectangle":
            // Loops (while/for)
            let loopType: LoopType | null = null;
            let loopCondition = data.label;
            if (data.label.startsWith("while ")) {
              loopType = LoopType.While;
              loopCondition = data.label.substring(6);
            } else if (data.label.startsWith("for ")) {
              loopType = LoopType.For;
              loopCondition = data.label.substring(4);
            }

            if (loopType !== null) {
              astNode = new LoopFlowNode(
                0,
                id,
                loopType,
                loopCondition,
                new StatementListFlowNode(1, "")
              );
            } else {
              console.error(
                `Error creating AST node for node ${id}: Invalid loop type`
              );
              setAlertStatusSeverity("error");
              setAlertStatusMessage(`Error for node ${id}: Invalid loop type`);
              setOpenAlertStatus(true);
              hasAnyError = true;
              return false;
            }
            break;
          case "circle":
            if (data.functionType === "start") {
              const functionPattern = /^(\w+)\((.*)\)$/;
              const match = data.label.match(functionPattern);

              let functionName = data.label;
              let argumentExpressions: string[] = [];

              if (match) {
                functionName = match[1];
                const args = match[2];

                if (args.trim().length > 0) {
                  argumentExpressions = args
                    .split(",")
                    .map((arg) => arg.trim());
                }
              }

              const endFunctionNodeId = pairedStartNodes.get(id) ?? "";
              const endFunctionNode = nodeMap.get(endFunctionNodeId);

              astNode = new FunctionFlowNode(
                0,
                id,
                functionName,
                new StatementListFlowNode(1, ""),
                argumentExpressions,
                endFunctionNode?.data.label ?? ""
              );
            }
            break;
          case "circle_start":
            astNode = new FunctionFlowNode(
              0,
              id,
              "main",
              new StatementListFlowNode(1, ""),
              [],
              ""
            );
            break;
          case "circle_end":
          case "diamond_end":
            // These might not directly translate to FlowASTNode instances
            break;
        }
      } catch (error: any) {
        console.error(`Error creating AST node for node ${id}:`, error);
        setAlertStatusSeverity("error");
        setAlertStatusMessage(`Error for node ${id}: ${error.message}`);
        setOpenAlertStatus(true);
        hasAnyError = true;
        return false;
      }

      if (astNode) {
        astNodeMap.set(id, astNode);
        if (type === "circle" || type === "circle_start") {
          if (data.functionType === "start") {
            astRootNodes.push(astNode);
          } else if (type === "circle_start") {
            astRootNodes.unshift(astNode);
            // it should already be the first node inside, but just in case
          }
        }
        let parentNodeId = parentEnclosureMap.get(node.id)?.[0];
        let parentOriginEdge = parentEnclosureMap.get(node.id)?.[1];
        if (parentOriginEdge && parentNodeId) {
          let parentOriginEdgeId = parentOriginEdge.split("-", 2)[0]; // should be the id
          while (parentOriginEdgeId !== parentNodeId) {
            parentOriginEdge = parentEnclosureMap.get(parentOriginEdgeId)?.[1];
            if (!parentOriginEdge) break;
            parentOriginEdgeId = parentOriginEdge.split("-", 2)[0];
          }
          if (parentOriginEdge && parentOriginEdge.endsWith("-continue")) {
            // get the enclosure of the loop if it's a continue...
            parentNodeId = parentEnclosureMap.get(parentOriginEdgeId)?.[0];
            parentOriginEdge = parentEnclosureMap.get(parentOriginEdgeId)?.[1];
          }
        }

        let parentNode = astNodeMap.get(parentNodeId ?? "");

        if (parentNode) {
          let parentNestingLevel = parentNode.nestingLevel;
          if (
            parentNode instanceof LoopFlowNode ||
            parentNode instanceof FunctionFlowNode
          ) {
            let parentNodeCasted = parentNode as
              | LoopFlowNode
              | FunctionFlowNode;
            if (astNode instanceof StatementListFlowNode) {
              astNode.statements.forEach((statement) => {
                statement.setNestingLevel(parentNodeCasted.nestingLevel + 1);
                parentNodeCasted.body.addStatement(statement);
              });
            } else {
              astNode.setNestingLevel(parentNestingLevel + 1);
              parentNode.body.addStatement(astNode);
            }
          } else if (parentNode instanceof IfFlowNode) {
            let parentNodeStatementListNode: StatementListFlowNode;
            if (parentOriginEdge?.endsWith("-if")) {
              if (!parentNode.thenStatementListNode) {
                parentNode.thenStatementListNode = new StatementListFlowNode(
                  parentNestingLevel + 1,
                  ""
                );
              }
              parentNodeStatementListNode = parentNode.thenStatementListNode;
            } else if (parentOriginEdge?.endsWith("-else")) {
              if (!parentNode.elseStatementListNode) {
                parentNode.elseStatementListNode = new StatementListFlowNode(
                  parentNestingLevel + 1,
                  ""
                );
              }
              parentNodeStatementListNode = parentNode.elseStatementListNode;
            } else {
              console.error(
                `Error creating AST node for node ${id}: Invalid parent origin edge ${parentOriginEdge}`
              );
              setAlertStatusSeverity("error");
              setAlertStatusMessage(
                `Error for node ${id}: Unable to convert flow`
              );
              setOpenAlertStatus(true);
              hasAnyError = true;
              return false;
            }
            if (astNode instanceof StatementListFlowNode) {
              astNode.statements.forEach((statement) => {
                statement.setNestingLevel(parentNestingLevel + 1);
                parentNodeStatementListNode.addStatement(statement);
              });
            } else {
              astNode.setNestingLevel(parentNestingLevel + 1);
              parentNodeStatementListNode.addStatement(astNode);
            }
          }
        }
      }
      return true;
    });

    if (hasAnyError) return "";

    let code = "";
    astRootNodes.forEach((rootNode: FlowASTNode) => {
      code += rootNode.toCode();
    });

    code += "main()\n"; // Call the main function at the end of everything
    return code;
  };

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <ThemeProvider theme={theme}>
      <div className="dndflow">
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={toastOpen}
          autoHideDuration={3000}
          onClose={onToastClose}
        >
          <Alert
            // onClose={onToastClose}
            severity={toastType}
            sx={{ width: "100%" }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
        <input
          type="file"
          ref={hiddenFileInput}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept=".json"
        />
        <Menubar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          commandData={[
            { title: "Validate Flow", onClick: onClickValidate },
            {
              title: "Convert to Flow",
              onClick: () => onOpenCodeDialog(false),
            },
            {
              title: "Convert to Python",
              onClick: () => onOpenCodeDialog(true),
            },
            {
              title: "Save Flow",
              onClick: saveFlow,
            },
            {
              title: "Load Flow",
              onClick: loadFlow,
            },
          ]}
        ></Menubar>
        <RunFlow
          isOpen={openRunFlow}
          onClose={onCloseRunFlow}
          textAreaValue={runOutput}
          inputValue={runInput}
          onChangeInput={(value: string) => setRunInput(value)}
          sendInput={() => {
            sendInput(runInput);
            setRunInput("");
          }}
          runFlow={runFlow}
          isRunning={isRunning}
          runOutputErr={runOutputErr}
          runNextLine={runNextLine}
          isReady={isReady}
          isAwaitingInput={isAwaitingInput}
          prompt={prompt}
          stopExecution={() => {
            interruptExecution();
            if (pythonCodeExecutionTimeout) {
              clearTimeout(pythonCodeExecutionTimeout);
            }
          }}
        />
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={openAlertStatus}
          autoHideDuration={3000}
          onClose={() => {
            setOpenAlertStatus(false);
          }}
        >
          <Alert
            onClose={() => {
              setOpenAlertStatus(false);
            }}
            severity={alertStatusSeverity}
            sx={{ width: "100%" }}
          >
            {alertStatusMessage}
          </Alert>
        </Snackbar>
        <Button
          style={{
            backgroundColor: openRunFlow ? "#d2e0ff" : "#0056b3",
            borderRadius: "20px",
            position: "absolute",
            right: 280,
            zIndex: 5,
            top: 8,
            fontWeight: openRunFlow ? "normal" : "bold",
            color: openRunFlow ? "grey" : "white",
            padding: "18px 25px",
          }}
          disabled={openRunFlow}
          onClick={onOpenRunFlow}
          variant="contained"
          endIcon={<PlayArrow />}
        >
          {openRunFlow ? "Running..." : "Run Flow"}
        </Button>
        <BootstrapDialog
          fullWidth
          maxWidth="xl"
          onClose={onCloseCodeDialog}
          aria-labelledby="customized-dialog-title"
          open={openCodeDialog}
        >
          <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
            Code Editor
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={onCloseCodeDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent dividers>
            <AceEditor
              placeholder="This will be where you can type your python code. Click copy to copy the code to your clipboard, Convert to Flow to convert the code to flowchart, and the update button to sync your python code with the flowchart"
              mode="python"
              theme="xcode"
              name="python-code"
              onLoad={editorOnLoad}
              onChange={(value) => setPythonCode(value ?? "")}
              fontSize={14}
              lineHeight={19}
              height="70vh"
              width="100%"
              showPrintMargin={true}
              maxLines={Infinity}
              showGutter={true}
              highlightActiveLine={true}
              value={pythonCode}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
            />
          </DialogContent>
          <DialogActions>
            <Tooltip title="Update the python code to match your current flow">
              <IconButton
                aria-label="update"
                onClick={() => {
                  let code = convertFlowToCode();
                  setPythonCode(code);
                  if (code) {
                    setOpenAlertStatus(true);
                    setAlertStatusSeverity("success");
                    setAlertStatusMessage(
                      "Code successfully updated to the latest flow"
                    );
                  }
                }}
              >
                <Update />
              </IconButton>
            </Tooltip>
            <Button
              size="large"
              autoFocus
              onClick={() => {
                copyToClipboard();
                onCloseCodeDialog();
              }}
            >
              Copy
            </Button>
            <Button
              onClick={() => {
                // convertCodeToFlow();
                onCloseCodeDialog();
              }}
              variant="contained"
              style={{
                backgroundColor: "#0056b3",
                borderRadius: "20px",
                color: "white",
                padding: "15px",
              }}
            >
              Convert to Flow
            </Button>
          </DialogActions>
        </BootstrapDialog>
        <ReactFlowProvider>
          <div className="reactflow-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeUpdate={onEdgeUpdate}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              // style={rfStyle}
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          <Sidebar />
        </ReactFlowProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
