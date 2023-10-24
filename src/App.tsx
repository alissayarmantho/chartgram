import { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Node,
  MiniMap,
  Background,
  Controls,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow";
import "./Flow.css";
import "reactflow/dist/style.css";

import DiamondNode from "./components/DiamondNode/DiamondNode";
import ParallelogramNode from "./components/ParallelogramNode/ParallelogramNode";
import HexagonNode from "./components/HexagonNode/HexagonNode";
import RectangleNode from "./components/RectangleNode/RectangleNode";
import Sidebar from "./components/Sidebar/Sidebar";
import useStore, { RFState } from "./stores/store";
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
  lastNodeId: state.lastNodeId,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onEdgeUpdate: state.onEdgeUpdate,
  onConnect: state.onConnect,
  addNode: state.addNode,
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
    onNodesChange,
    onEdgesChange,
    onEdgeUpdate,
    onConnect,
    addNode,
  } = useStore(selector);

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
