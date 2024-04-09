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

export type ValidateResult = {
  isValid: boolean;
  validationMessage: string | null;
};

export type NodeIDHandle = {
  nodeId: string;
  handle: string;
};

export type Flow = {
  nodes: Node<NodeData>[];
  edges: Edge[];
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
  pairedEndNodes: Map<string, string>;
  pairedStartNodes: Map<string, string>;
  lastNodeId: number;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onEdgeUpdate: OnEdgeUpdateFunc;
  isValidConnection: IsValidConnection;
  onConnect: OnConnect;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  addNode: (type: string, node?: Node) => void;
  setAllNodesAndEdges: (nodes: Node<NodeData>[], edges: Edge[]) => void;
  changeInputType: (nodeId: string, inputType: string) => void;
  changeFunctionType: (nodeId: string, functionType: string) => void;
  validateFlow: () => ValidateResult;
};
function findConnectedNodeToHandle(
  edges: Edge[],
  sourceNodeId: string,
  handle: string
) {
  // Find the edge that connects from the specified handle
  const edge = edges.find(
    (edge) => edge.source === sourceNodeId && edge.sourceHandle === handle
  );
  // Return the target node ID of this edge
  return edge ? edge.target : null;
}

function bfsIfElse(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  path: string
) {
  let queue = [
    {
      nodeId: startNodeId,
      handle: `${startNodeId}-${path}`,
      depth: 0,
    },
  ];

  let visited = new Set<NodeIDHandle>();

  let endNode: string = "";

  while (queue.length > 0) {
    let { nodeId, handle, depth } = queue.shift() ?? {};
    if (!nodeId || !handle || depth === undefined || depth === null) break;

    if (visited.has({ nodeId: nodeId, handle: handle })) continue;

    // This might make a node be visited twice if they got multiple source handles, but it should be fine
    visited.add({ nodeId: nodeId, handle: handle });

    // Add node and depth info
    let currentNode = nodes.find((e) => e.id === nodeId);
    if (currentNode && currentNode.type === "diamond_end") {
      if (handle.endsWith(`${path}-end`) && depth === 0) {
        endNode = nodeId;
        break;
      }
    }

    // Adjust depth for nested if-else nodes
    if (
      currentNode &&
      currentNode.id !== startNodeId &&
      (currentNode.type === "diamond" || currentNode.type === "diamond_end")
    ) {
      if (handle.endsWith("-end")) {
        depth--;
      } else {
        depth++;
      }
    }

    // Get all edges going out from the current node
    let outgoingEdges;
    if (handle === `${startNodeId}-${path}`) {
      // Only for the first node, consider the specific handle
      outgoingEdges = edges.filter(
        (edge) => edge.source === nodeId && edge.sourceHandle === handle
      );
    } else {
      // For subsequent nodes, consider all outgoing edges
      outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    }
    for (let edge of outgoingEdges) {
      queue.push({
        nodeId: edge.target,
        handle: edge.targetHandle ?? "",
        depth,
      });
    }
  }
  return { visited: Array.from(visited), endNode: endNode };
}

function bfs(edges: Edge[], startNodeId: string) {
  let queue = [startNodeId];
  let visited = new Set();

  while (queue.length > 0) {
    let currentNodeId = queue.shift();
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    // Get all edges going out from the current node
    let outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);
    for (let edge of outgoingEdges) {
      queue.push(edge.target);
    }
  }
  return Array.from(visited);
}

function bfsThroughLoopBody(
  nodes: Node[],
  edges: Edge[],
  loopNodeId: string,
  loopBodyStartNodeId: string | null
) {
  if (!loopBodyStartNodeId) return false;

  let queue = [loopBodyStartNodeId];
  let visited = new Set();
  let isConnectedToEnd = false;

  while (queue.length > 0) {
    let currentNodeId = queue.shift();
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    // Check if the current node is the loop node connected via the loop-end handle
    if (currentNodeId === loopNodeId) {
      const loopEndEdge = edges.find(
        (edge) =>
          edge.target === loopNodeId &&
          edge.targetHandle === `${loopNodeId}-loop-end`
      );
      if (loopEndEdge) {
        isConnectedToEnd = true;
        break; // Stop BFS if we have found the loop node connected via loop-end handle
      }
    }

    // Enqueue all nodes connected to the current node
    let outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);
    for (let edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return isConnectedToEnd;
}

function validateStartConnectedToEnd(edges: Edge[]): ValidateResult {
  const startNodeId = "main-start";
  const endNodeId = "main-end";

  // Perform a BFS from the start node
  const reachableNodes = bfs(edges, startNodeId);

  // Check if the end node is in the set of reachable nodes
  return {
    isValid: reachableNodes.includes(endNodeId),
    validationMessage: "Main End is not reachable from Main Start",
  };
}

function validateLoopNode(
  nodes: Node[],
  edges: Edge[],
  loopNodeId: string
): ValidateResult {
  const loopBody = findConnectedNodeToHandle(
    edges,
    loopNodeId,
    `${loopNodeId}-loop-body`
  );
  if (!loopBody) {
    return {
      isValid: false,
      validationMessage:
        "Loop does not have a body. It should at least be connected to itself if the loop is empty",
    };
  }
  // Perform a BFS from the loop body handle
  // Check if the loop-end handle is reachable from the loop body
  const loopEndReachable = bfsThroughLoopBody(
    nodes,
    edges,
    loopNodeId,
    loopBody
  );

  if (!loopEndReachable) {
    return {
      isValid: false,
      validationMessage: "Loop node is not reachable from loop body",
    };
  }

  const loopContinue = findConnectedNodeToHandle(
    edges,
    loopNodeId,
    `${loopNodeId}-continue`
  );
  if (!loopContinue) {
    return {
      isValid: false,
      validationMessage:
        "Loop does not have a continuation. It should at least be connected to Main End node if it is the last node in the program",
    };
  }

  // Perform a BFS from the loop continue handle
  // The continue handle should not be able to reach back to the loop node
  // if i want a while inside a while, apparently this check will stop this case, commented for now
  // TODO: Find out if this check is actually needed
  /*
  const loopNodeReachableFromContinue = bfsThroughLoopBody(
    nodes,
    edges,
    loopNodeId,
    loopContinue
  );
  if (loopNodeReachableFromContinue) {
    return {
      isValid: false,
      validationMessage:
        "Loop continuation should not be able to reach back to the loop node",
    };
  }
  */

  return { isValid: true, validationMessage: "" };
}

function validateIfElseNode(
  nodes: Node[],
  edges: Edge[],
  ifElseNodeId: string
): ValidateResult {
  const ifBodyReachable = bfsIfElse(nodes, edges, ifElseNodeId, "if");
  const elseBodyReachable = bfsIfElse(nodes, edges, ifElseNodeId, "else");
  const ifBodyNodeIds = ifBodyReachable.visited
    .map((item) => item.nodeId)
    .filter(
      (item) => !(ifElseNodeId === item) && !(ifBodyReachable.endNode === item)
    );
  const elseBodyNodeIds = elseBodyReachable.visited
    .map((item) => item.nodeId)
    .filter(
      (item) =>
        !(ifElseNodeId === item) && !(elseBodyReachable.endNode === item)
    );

  // Check if bodies are disjoint
  const bodiesDisjoint = ifBodyNodeIds.every(
    (nodeId) => !elseBodyNodeIds.includes(nodeId)
  );

  if (!ifBodyReachable.endNode) {
    if (ifBodyNodeIds.includes(elseBodyReachable.endNode)) {
      return {
        isValid: false,
        validationMessage:
          "There may be a nested if-else node that is not connected to the right if-else-end node",
      };
    }
    return {
      isValid: false,
      validationMessage: "If body is not connected to any If-Else-End node",
    };
  }

  if (!elseBodyReachable.endNode) {
    if (elseBodyNodeIds.includes(ifBodyReachable.endNode)) {
      return {
        isValid: false,
        validationMessage:
          "There may be a nested if-else node that is not connected to the right if-else-end node",
      };
    }
    return {
      isValid: false,
      validationMessage: "Else body is not connected to any If-Else-End node",
    };
  }

  if (!(ifBodyReachable.endNode === elseBodyReachable.endNode)) {
    return {
      isValid: false,
      validationMessage:
        "If body does not link to the same If-Else-End node as else body",
    };
  }
  if (!bodiesDisjoint) {
    return {
      isValid: false,
      validationMessage: "If body cannot be connected to else body",
    };
  }
  return { isValid: true, validationMessage: "" };
}

function validateFunctionNodes(
  nodes: Node[],
  edges: Edge[],
  pairedEndNodes: Map<string, string>,
  pairedStartNodes: Map<string, string>
) {
  // Filter start and end nodes
  const startNodes = nodes.filter(
    (node) => node.type === "circle" && node.data.functionType === "start"
  );
  const endNodes = nodes.filter(
    (node) => node.type === "circle" && node.data.functionType === "end"
  );

  startNodes.forEach((startNode) => {
    // Perform BFS to find an end node reachable from this start node
    const reachableNodes = bfs(edges, startNode.id);
    const connectedEndNode = endNodes.find(
      (endNode) =>
        reachableNodes.includes(endNode.id) && !pairedEndNodes.has(endNode.id)
    );
    if (connectedEndNode) {
      pairedEndNodes.set(connectedEndNode.id, startNode.id);
      pairedStartNodes.set(startNode.id, connectedEndNode.id);
    }
  });

  // Validate all end nodes are paired
  const allEndNodesPaired = endNodes.every((endNode) =>
    pairedEndNodes.has(endNode.id)
  );
  // Validate all start nodes are paired
  const allStartNodesPaired = startNodes.every((startNode) =>
    Array.from(pairedEndNodes.values()).includes(startNode.id)
  );

  return {
    isValid: allEndNodesPaired && allStartNodesPaired,
    validationMessage:
      allEndNodesPaired && allStartNodesPaired
        ? ""
        : "All function start nodes need to be paired with function end nodes.",
  };
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
      const endReachableValidationResult = validateStartConnectedToEnd(
        get().edges
      );
      if (!endReachableValidationResult.isValid) {
        return endReachableValidationResult;
      }

      // Get if-else nodes
      const ifElseNodes = get().nodes.filter((node) => node.type === "diamond");
      for (let node of ifElseNodes) {
        let validationResult = validateIfElseNode(
          get().nodes,
          get().edges,
          node.id
        );
        if (!validationResult.isValid) {
          return validationResult;
        }
      }

      // Get loop nodes
      const loopNodes = get().nodes.filter(
        (node) => node.type === "roundedrectangle"
      );
      for (let node of loopNodes) {
        let validationResult = validateLoopNode(
          get().nodes,
          get().edges,
          node.id
        );
        if (!validationResult.isValid) {
          return validationResult;
        }
      }

      // validate function nodes
      set({
        pairedEndNodes: new Map<string, string>(),
        pairedStartNodes: new Map<string, string>(),
      });
      let validationResult = validateFunctionNodes(
        get().nodes,
        get().edges,
        get().pairedEndNodes,
        get().pairedStartNodes
      );
      if (!validationResult.isValid) {
        return validationResult;
      }

      return { isValid: true, validationMessage: null };
    },
    pairedEndNodes: new Map<string, string>(),
    pairedStartNodes: new Map<string, string>(),
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
    setAllNodesAndEdges: (nodes: Node<NodeData>[], edges: Edge[]) => {
      set({
        nodes: nodes,
        edges: edges,
      });
    },
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
        const isLoopNode = get().nodes.find(
          (node) => node.id === source && node.type === "roundedrectangle"
        );
        if (
          isLoopNode &&
          sourceHandle.endsWith("loop-body") &&
          targetHandle.endsWith("loop-end")
        ) {
          // Allow loop-body to loop-end connection for loop nodes
          return true;
        } else {
          get().onToastOpen("A node cannot connect to itself!", "error");
          return false;
        }
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
        edges: get().edges.filter((edge) => {
          return edge.source !== nodeId && edge.target !== nodeId;
        }),
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
