import "./RunFlow.css";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AnimatePresence, motion } from "framer-motion";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import { Redo, Send, SkipNext } from "@mui/icons-material";
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
  textAreaValue,
  onChangeInput,
  inputValue,
  sendInput,
  runFlow,
  runNextLine,
}: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: "absolute", zIndex: 5 }}
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
          <Root>
            <div style={{ display: "flex", alignItems: "center" }}>
              Run Flow
              <Tooltip title="Run flow to the end" placement="top">
                <IconButton
                  type="button"
                  sx={{ p: "10px", marginLeft: "5px" }}
                  aria-label="Run All Flow"
                  onClick={runFlow}
                >
                  <SkipNext />
                </IconButton>
              </Tooltip>
              <Tooltip
                title="Step to run next flowchart element"
                placement="top"
              >
                <IconButton
                  type="button"
                  sx={{ p: "10px", marginLeft: "5px" }}
                  aria-label="Step Next"
                  onClick={runNextLine}
                >
                  <Redo />
                </IconButton>
              </Tooltip>
            </div>
            <Divider />
            <TextareaAutosize
              id="run-flow-output"
              maxRows={15}
              className="output nodrag"
              value={textAreaValue}
              disabled={true}
              style={{ resize: "none" }}
              placeholder="Output Here"
            />
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
                onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChangeInput(evt.target.value)
                }
                placeholder="Input Here"
              />
              <IconButton
                type="button"
                sx={{ p: "20px" }}
                onClick={sendInput}
                aria-label="Send"
              >
                <Send />
              </IconButton>
            </div>
          </Root>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RunFlow;
