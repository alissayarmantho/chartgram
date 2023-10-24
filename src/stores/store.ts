import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  IsValidConnection,
  updateEdge,
  OnEdgeUpdateFunc,
} from "reactflow";

export type NodeData = {
  label: string;
  inputType?: string;
  functionType?: string;
};

export type RFState = {
  toastOpen: boolean;
  toastMessage: string;
  toastType: "success" | "error" | "warning" | "info";
  onToastClose: () => void;
  onToastOpen: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
  nodes: Node<NodeData>[];
  edges: Edge[];
  lastNodeId: number;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onEdgeUpdate: OnEdgeUpdateFunc;
  isValidConnection: IsValidConnection;
  onConnect: OnConnect;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  addNode: (type: string, node?: Node) => void;
  changeInputType: (nodeId: string, inputType: string) => void;
  changeFunctionType: (nodeId: string, functionType: string) => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = createWithEqualityFn<RFState>(
  (set, get) => ({
    toastOpen: false,
    toastMessage: "",
    toastType: "success",
    onToastClose: (event?: React.SyntheticEvent | Event, reason?: string) => {
      /*
      if (reason === "clickaway") {
        return;
      }
      */
      set(() => ({
        toastOpen: false,
      }));
    },
    onToastOpen: (
      message: string,
      type: "success" | "error" | "warning" | "info"
    ) => {
      set(() => ({
        toastOpen: true,
        toastMessage: message,
        toastType: type,
      }));
    },
    nodes: [
      {
        id: "main-start",
        type: "circle_start",
        position: { x: 500, y: 100 },
        data: { label: "Main Start", functionType: "start" },
      },
      {
        id: "maind-end",
        type: "circle_end",
        data: { label: "Main End", functionType: "end" },
        position: { x: 500, y: 400 },
      },
    ],
    edges: [],
    lastNodeId: 0,
    onNodesChange: (changes: NodeChange[]) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onEdgeUpdate: (oldEdge: Edge, connection: Connection) => {
      set({
        edges: updateEdge(oldEdge, connection, get().edges),
      });
    },
    isValidConnection: (con: Connection | Edge) => {
      const { source, target, sourceHandle, targetHandle } = con;

      // Check if source and target are the same. If they are, don't add the edge.
      if (source === target) {
        get().onToastOpen("A node cannot connect to itself!", "error");
        return false;
      }

      // Check if the source handle or target handle is already connected
      const isSourceHandleConnected = get().edges.some(
        (edge) => edge.source === source && edge.sourceHandle === sourceHandle
      );
      const isTargetHandleConnected = get().edges.some(
        (edge) => edge.target === target && edge.targetHandle === targetHandle
      );

      if (isSourceHandleConnected || isTargetHandleConnected) {
        get().onToastOpen("This handle is already connected!", "error");
        return false;
      }

      return true;
    },
    onConnect: (connection: Connection) => {
      set({
        edges: addEdge(
          {
            ...connection,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 40,
              height: 40,
            },
            type: "smoothstep",
          },
          get().edges
        ),
      });
    },
    updateNodeLabel: (nodeId: string, label: string) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            node.data = { ...node.data, label };
          }

          return node;
        }),
      });
    },
    deleteNode: (nodeId: string) => {
      set({
        nodes: get().nodes.filter((node) => node.id !== nodeId),
      });
    },
    addNode: (type: string, node?: Node) => {
      let newData: NodeData = { label: "" };
      if (type === "parallelogram") {
        newData = { ...newData, inputType: "input" };
      }
      if (type === "circle") {
        newData = { ...newData, functionType: "start" };
      }
      const newNode: Node = node ?? {
        id: get().lastNodeId.toString(),
        data: newData,
        type: type,
        position: {
          x: 200,
          y: 700,
        },
      };
      set({
        nodes: get().nodes.concat(newNode),
        lastNodeId: get().lastNodeId + 1,
      });
    },
    changeInputType: (nodeId: string, inputType: string) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId && node.type === "parallelogram") {
            node.data = { ...node.data, inputType };
          }

          return node;
        }),
      });
    },
    changeFunctionType: (nodeId: string, functionType: string) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId && node.type === "circle") {
            node.data = { ...node.data, functionType };
          }
          return node;
        }),
      });
    },
  }),
  shallow
);

export default useStore;
