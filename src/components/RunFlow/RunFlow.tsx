import "./RunFlow.css";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AnimatePresence, motion } from "framer-motion";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import { Autorenew, Redo, Send, SkipNext, Stop } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";

const Root = styled("div")(({ theme }) => ({
  width: "100%",
  fontSize: "1.2rem",
  display: "flex",
  flexDirection: "column",
  fontWeight: "bold",
  "& > :not(style) ~ :not(style)": {
    marginTop: theme.spacing(2),
  },
}));
const RunFlow = ({
  isOpen,
  onClose,
  runOutput,
  onChangeInput,
  inputValue,
  sendInput,
  runNextLine,
  stopExecution,
  isRunning,
  isReady,
  runOutputErr,
  isAwaitingInput,
  prompt,
}: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            zIndex: 5,
          }}
          className="run-flow"
        >
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          {isReady ? (
            <Root>
              <div style={{ display: "flex", alignItems: "center" }}>
                Run Flow
                {/*<Tooltip title="Run flow to the end" placement="top">
                  <IconButton
                    size="large"
                    type="button"
                    sx={{ p: "10px", marginLeft: "5px", color: "green" }}
                    aria-label="Run All Flow"
                    onClick={runFlow}
                    disabled={
                      isRunning ||
                      isAwaitingInput ||
                      runOutput === "Running Flow..."
                    }
                  >
                    <SkipNext />
                  </IconButton>
                </Tooltip>
                  */}
                {/*
                TODO: Implement step next, currently it is not quite possible to do it with react-py the python runner im using
                since it has a repl functionality, but like, I cannot step into the while loop step by step which is what is needed
                probably will have to think more about how to actually implement it
                  <Tooltip
                    title="Step to run next flowchart element"
                    placement="top"
                  >
                    <IconButton
                      size="large"
                      type="button"
                      sx={{ p: "10px", marginLeft: "5px" }}
                      aria-label="Step Next"
                      onClick={runNextLine}
                      disabled={
                        isRunning ||
                        isAwaitingInput ||
                        textAreaValue === "Running Flow..."
                      }
                    >
                      <Redo />
                    </IconButton>
                </Tooltip>
                */}
                <Tooltip title="Stop execution" placement="top">
                  <IconButton
                    size="large"
                    type="button"
                    sx={{ p: "10px", marginLeft: "5px", color: "red" }}
                    aria-label="Step Next"
                    onClick={() => stopExecution()}
                    disabled={!isRunning}
                  >
                    <Stop />
                  </IconButton>
                </Tooltip>{" "}
                <Tooltip title="Refresh python engine" placement="top">
                  <IconButton
                    size="large"
                    type="button"
                    sx={{ p: "10px", marginLeft: "5px", color: "#0056b3" }}
                    aria-label="Refresh Python Engine"
                    onClick={() => stopExecution()}
                  >
                    <Autorenew />
                  </IconButton>
                </Tooltip>
              </div>
              <Divider />
              <div className="output-div-wrapper">
                {runOutputErr ? (
                  <TextareaAutosize
                    id="run-flow-err-output"
                    maxRows={15}
                    className="output nodrag"
                    value={runOutputErr}
                    disabled={true}
                    style={{
                      resize: "none",
                      color: "red",
                      backgroundColor: "#FFDFE1AB",
                      opacity: 0.8,
                    }}
                    placeholder="Output Here"
                  />
                ) : (
                  <TextareaAutosize
                    id="run-flow-output"
                    maxRows={15}
                    className="output nodrag"
                    value={runOutput}
                    disabled={true}
                    style={{ resize: "none" }}
                    placeholder="Output Here"
                  />
                )}
                {isAwaitingInput && (
                  <div>
                    <div
                      style={{
                        fontWeight: 500,
                        width: "400px",
                        padding: "10px",
                      }}
                    >
                      {prompt}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <TextareaAutosize
                        id="run-flow-input"
                        className="input-textbox nodrag"
                        maxRows={1}
                        value={inputValue}
                        style={{
                          resize: "none",
                          width: "400px",
                          marginRight: "10px",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && sendInput()}
                        onChange={(
                          evt: React.ChangeEvent<HTMLTextAreaElement>
                        ) => onChangeInput(evt.target.value)}
                        placeholder="Input Here"
                      />
                      <IconButton
                        type="button"
                        sx={{ p: "20px", color: "#0056b3" }}
                        onClick={(
                          e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                        ) => {
                          e.preventDefault();
                          sendInput();
                        }}
                        aria-label="Send"
                      >
                        <Send />
                      </IconButton>
                    </div>
                  </div>
                )}
              </div>
            </Root>
          ) : (
            <Root>Python is not ready yet</Root>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RunFlow;
