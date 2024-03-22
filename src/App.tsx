import { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Node,
  MiniMap,
  Background,
  Controls,
  ReactFlowProvider,
  ReactFlowInstance,
  Edge,
} from "reactflow";
import "./Flow.css";
import "reactflow/dist/style.css";

import DiamondNode from "./components/DiamondNode/DiamondNode";
import ParallelogramNode from "./components/ParallelogramNode/ParallelogramNode";
import HexagonNode from "./components/HexagonNode/HexagonNode";
import RectangleNode from "./components/RectangleNode/RectangleNode";
import Sidebar from "./components/Sidebar/Sidebar";
import useStore, { Flow, RFState } from "./stores/store";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Theme } from "@emotion/react";
import RoundedRectangleNode from "./components/RoundedRectangleNode/RoundedRectangleNode";
import CircleNode from "./components/CircleNode/CircleNode";
import DiamondEndNode from "./components/DiamondEndNode/DiamondEndNode";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import React from "react";
import CircleStartNode from "./components/CircleStartNode/CircleStartNode";
import CircleEndNode from "./components/CircleEndNode/CircleEndNode";
import Menubar from "./components/MenuBar/Menubar";

const rfStyle = {
  backgroundColor: "#B8CEFF",
};

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
  const [openValidationFlowStatus, setOpenValidationFlowStatus] =
    useState(false);
  const [validationFlowStatusMessage, setValidationFlowStatusMessage] =
    useState("");
  const [validationFlowStatusSeverity, setValidationFlowStatusSeverity] =
    useState<"success" | "error" | "info" | "warning" | undefined>("success");
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>(
    null as any
  );

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
  const handleClick = () => {
    hiddenFileInput?.current?.click();
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
          setOpenValidationFlowStatus(true);
          setValidationFlowStatusSeverity("error");
          setValidationFlowStatusMessage("Failed to load the file");
          return;
        }
        try {
          const flow: any = JSON.parse(text);
          if (!parseableFlow(flow)) {
            setOpenValidationFlowStatus(true);
            setValidationFlowStatusSeverity("error");
            setValidationFlowStatusMessage("Invalid flow");
            return;
          }
          setAllNodesAndEdges(flow.nodes, flow.edges);
        } catch (error) {
          setOpenValidationFlowStatus(true);
          setValidationFlowStatusSeverity("error");
          setValidationFlowStatusMessage("Failed to load the flow: " + error);
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

        addNode(type, newNode);
      }
    },
    [reactFlowInstance, lastNodeId, addNode]
  );

  const onClickValidate = () => {
    let validFlowResult = validateFlow();
    if (!validFlowResult.isValid) {
      setValidationFlowStatusSeverity("error");
      setValidationFlowStatusMessage(validFlowResult.validationMessage ?? "");
      setOpenValidationFlowStatus(!validFlowResult.isValid);
    } else {
      setValidationFlowStatusSeverity("success");
      setValidationFlowStatusMessage("Flow is valid");
    }
    setOpenValidationFlowStatus(true);
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
              title: "Create Flow",
              onClick: () => {},
            },
            {
              title: "Create Python Code",
              onClick: () => {},
            },
            {
              title: "Save Flow",
              onClick: () => {
                saveFlow();
              },
            },
            {
              title: "Load Flow",
              onClick: () => {
                handleClick();
              },
            },
          ]}
        ></Menubar>
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={openValidationFlowStatus}
          autoHideDuration={3000}
          onClose={() => {
            setOpenValidationFlowStatus(false);
          }}
        >
          <Alert
            onClose={() => {
              setOpenValidationFlowStatus(false);
            }}
            severity={validationFlowStatusSeverity}
            sx={{ width: "100%" }}
          >
            {validationFlowStatusMessage}
          </Alert>
        </Snackbar>
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
