import "./RunFlow.css";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AnimatePresence, motion } from "framer-motion";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import { Send } from "@mui/icons-material";

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
const RunFlow = ({ isOpen, onClose, textAreaValue, onChangeInput }: any) => {
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
            Run Flow
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
                style={{
                  resize: "none",
                  width: "400px",
                  marginRight: "10px",
                }}
                placeholder="Input Here"
              />
              <IconButton type="button" sx={{ p: "20px" }} aria-label="Send">
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