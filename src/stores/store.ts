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
  validateFlow: () => boolean;
};

function bfs(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  targetType: string | null,
  targetHandle: string
) {
  let queue = [startNodeId];
  let visited = new Set();
  while (queue.length > 0) {
    let currentNodeId = queue.shift();
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    // Get all edges going out from the current node
    let outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);
    for (let edge of outgoingEdges) {
      // If we are looking for a specific handle, check the target handle
      if (targetHandle && edge.targetHandle !== targetHandle) continue;

      // If we are looking for a specific type, check the target node type
      let targetNode = nodes.find((node) => node.id === edge.target);
      if (targetType && targetNode?.type !== targetType) continue;

      queue.push(edge.target);
    }
  }
  return Array.from(visited); // Contains all nodes reachable from the start node
}

function validateLoopNode(nodes: Node[], edges: Edge[], loopNodeId: string) {
  // Get the loop node
  // const loopNode = nodes.find((n) => n.id === loopNodeId);

  // Perform a BFS from the loop body handle
  const bodyReachable = bfs(
    nodes,
    edges,
    loopNodeId,
    "roundedrectangle",
    `${loopNodeId}-loop-end`
  );

  // Check if the loop-end handle is reachable from the loop body
  const loopEndReachable = bodyReachable.includes(loopNodeId);

  // Perform a BFS from the continue handle to find nodes outside the loop
  const continueReachable = bfs(
    nodes,
    edges,
    loopNodeId,
    null,
    `${loopNodeId}-continue`
  );

  // The continue handle should not be able to reach back to the loop node
  const continueLeadsOut = !continueReachable.includes(loopNodeId);

  return loopEndReachable && continueLeadsOut;
}

function validateIfElseNode(
  nodes: Node[],
  edges: Edge[],
  ifElseNodeId: string
) {
  // Get the if-else node
  // const ifElseNode = nodes.find((n) => n.id === ifElseNodeId);

  // Perform a BFS from the if handle
  const ifReachable = bfs(
    nodes,
    edges,
    ifElseNodeId,
    null,
    `${ifElseNodeId}-if`
  );

  // Perform a BFS from the else handle
  const elseReachable = bfs(
    nodes,
    edges,
    ifElseNodeId,
    null,
    `${ifElseNodeId}-else`
  );

  // Find the diamond end node that is reachable from both if and else handles
  const diamondEndNode = nodes.find(
    (n) =>
      n.type === "diamond_end" &&
      ifReachable.includes(n.id) &&
      elseReachable.includes(n.id)
  );

  // Perform BFS from the diamond end node's next handle to ensure continuation
  const endNodeContinuationReachable =
    diamondEndNode &&
    bfs(nodes, edges, diamondEndNode.id, null, `${diamondEndNode.id}-next`);

  return (
    !!diamondEndNode &&
    endNodeContinuationReachable &&
    endNodeContinuationReachable.length > 0
  );
}

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
    validateFlow: () => {
      // Get if-else nodes
      const ifElseNodes = get().nodes.filter((node) => node.type === "diamond");
      for (let node of ifElseNodes) {
        if (!validateIfElseNode(get().nodes, get().edges, node.id)) {
          return false;
        }
      }

      // Get loop nodes
      const loopNodes = get().nodes.filter(
        (node) => node.type === "roundedrectangle"
      );
      for (let node of loopNodes) {
        if (!validateLoopNode(get().nodes, get().edges, node.id)) {
          return false;
        }
      }

      return true;
    },
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
      if (!targetHandle || !sourceHandle || !source || !target) return false;

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
        edges: get().edges.filter((edge) => {
          return (
            (functionType === "end" && edge.source !== nodeId) ||
            (functionType === "start" && edge.target !== nodeId)
          );
        }),
      });
    },
  }),
  shallow
);

export default useStore;
