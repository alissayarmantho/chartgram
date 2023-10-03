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
} from "reactflow";

export type NodeData = {
  label: string;
  inputType?: string;
};

export type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  lastNodeId: number;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  addNode: (type: string, node?: Node) => void;
  changeInputType: (nodeId: string, inputType: string) => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = createWithEqualityFn<RFState>(
  (set, get) => ({
    nodes: [],
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
    onConnect: (connection: Connection) => {
      set({
        edges: addEdge(connection, get().edges),
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
      const newNode: Node = node ?? {
        id: get().lastNodeId.toString(),
        data: { label: "" },
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
  }),
  shallow
);

export default useStore;
