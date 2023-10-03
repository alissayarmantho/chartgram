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

const rfStyle = {
  backgroundColor: "#B8CEFF",
};

const initialNodes: Node[] = [
  {
    id: "node-1",
    type: "rectangle",
    position: { x: 0, y: 0 },
    data: { label: 123 },
  },
  {
    id: "1",
    type: "rectangle",
    data: { label: "Hello" },
    position: { x: 200, y: 100 },
  },
  {
    id: "2",
    type: "rectangle",
    data: { label: "World" },
    position: { x: 200, y: 200 },
  },
  {
    id: "3",
    type: "diamond", // custom type
    data: { label: "Diamond" },
    position: { x: 200, y: 300 },
  },
  {
    id: "4",
    type: "parallelogram", // custom type
    data: {
      label: "Parallelogram",
    },
    position: { x: 200, y: 600 },
  },
  {
    id: "5",
    type: "hexagon", // custom type
    data: {
      label: "Hexagon",
    },
    position: { x: 200, y: 700 },
  },
];

const nodeTypes = {
  diamond: DiamondNode,
  parallelogram: ParallelogramNode,
  hexagon: HexagonNode,
  rectangle: RectangleNode,
  roundedrectangle: RoundedRectangleNode,
  circle: CircleNode,
};

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  lastNodeId: state.lastNodeId,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
});

const theme: Theme = createTheme({
  typography: {
    fontFamily: "Noto Sans",
    fontSize: 14,
  },
});

function App() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>(
    null as any
  );
  const {
    nodes,
    edges,
    lastNodeId,
    onNodesChange,
    onEdgesChange,
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
      console.log(nodes);
    },
    [reactFlowInstance, lastNodeId, addNode]
  );

  return (
    <ThemeProvider theme={theme}>
      <div className="dndflow">
        <ReactFlowProvider>
          <div className="reactflow-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
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
