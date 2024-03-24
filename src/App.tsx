import React, { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Node,
  MiniMap,
  Background,
  Controls,
  ReactFlowProvider,
  ReactFlowInstance,
  Edge,
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
import useStore, { Flow, RFState } from "./stores/store";
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
