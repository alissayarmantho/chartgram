import React, { useCallback, useRef, useState } from "react";
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
import Editor from "@monaco-editor/react";
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

  const onOpenRunFlow = () => {
    setOpenRunFlow(true);
  };

  const onCloseRunFlow = () => {
    setOpenRunFlow(false);
  };
  const onOpenCodeDialog = () => {
    setOpenCodeDialog(true);
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
    // TODO: Actually use the visitor pattern given by this parser to convert the code to flow
    console.log("ast", ast);

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
  const convertFlowchartToCode = () => {
    const nodeMap = new Map();
    const rootNodes: FlowASTNode[] = [];

    // Step 1: Parse nodes and create FlowASTNode instances
    nodes.forEach((node) => {
      let astNode = null;
      const { id, type, data } = node;
      try {
        switch (type) {
          case "rectangle":
            if (data.label.includes("=")) {
              astNode = new AssignmentFlowNode(
                0,
                data.label.split("=")[0].trim(),
                data.label.split("=")[1].trim()
              );
            } else {
              astNode = new MiscellaneousStatementNode(0, data.label);
            }
            break;
          case "diamond":
            astNode = new IfFlowNode(0, data.label, undefined, undefined); // Condition handling simplified
            break;
          case "parallelogram":
            // Input/Output operations
            if (data.inputType === "input") {
              astNode = new InputOutputFlowNode(0, IOType.Input, data.label);
            } else {
              astNode = new InputOutputFlowNode(0, IOType.Output, data.label);
            }
            break;
          case "roundedrectangle":
            // Loops (while/for)
            // You would need to parse the label to distinguish between 'for' and 'while', simplified here
            astNode = new LoopFlowNode(
              0,
              LoopType.While,
              data.label,
              new StatementListFlowNode(1)
            );
            break;
          case "circle":
            const functionPattern = /^(\w+)\((.*)\)$/;
            const match = data.label.match(functionPattern);

            let functionName = data.label;
            let argumentExpressions: string[] = [];

            if (match) {
              functionName = match[1];
              const args = match[2];

              if (args.trim().length > 0) {
                argumentExpressions = args.split(",").map((arg) => arg.trim());
              }
            }

            astNode = new FunctionFlowNode(
              0,
              functionName,
              new StatementListFlowNode(1),
              argumentExpressions,
              ""
            );
            break;
          case "circle_start":
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
        return;
      }
      if (astNode) {
        nodeMap.set(id, astNode);
        if (type === "circle_start" || type === "circle") {
          if (data.functionType === "start") {
            rootNodes.push(astNode);
          }
        }
      }
    });

    // Step 2: Build relationships based on edges
    edges.forEach((edge) => {
      const { source, target, sourceHandle, targetHandle } = edge;
      const parentNode = nodeMap.get(source);
      const childNode = nodeMap.get(target);

      if (parentNode && childNode) {
        // Assuming all nodes under a parent are part of a statement list
        // This logic will need to be expanded for if-else, loops, etc., based on handles
        if (!parentNode.children) {
          parentNode.children = [];
        }
        parentNode.children.push(childNode);
      }
    });

    // Step 3: Generate code by traversing the AST from root nodes
    let code = "";
    rootNodes.forEach((rootNode: FlowASTNode) => {
      code += rootNode.toCode();
    });

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
              onClick: onOpenCodeDialog,
            },
            {
              title: "Convert to Python",
              onClick: onOpenCodeDialog,
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
            <Editor
              options={{ readOnly: false, fontSize: 16 }}
              height="70vh"
              language="python"
              theme="vs-dark"
              value={pythonCode}
              onChange={(value) => setPythonCode(value ?? "")}
            />
          </DialogContent>
          <DialogActions>
            <Tooltip title="Update the python code to match your current flow">
              <IconButton aria-label="update" onClick={() => {}}>
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
              onClick={() => onCloseCodeDialog()}
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
