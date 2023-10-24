import "./CircleNode.css";
import "../../IconButton.css";
import "../../FormField.css";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import { memo } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import useStore, { NodeData } from "../../stores/store";

export const CircleNode: React.FC<NodeProps<NodeData>> = ({
  data,
  id,
  isConnectable,
}: NodeProps<NodeData>) => {
  const onChange = useStore((state) => state.updateNodeLabel);
  const onConnect = useStore((state) => state.onConnect);
  const onDelete = useStore((state) => state.deleteNode);
  const isValidConnection = useStore((state) => state.isValidConnection);
  const onChangeFunctionType = useStore((state) => state.changeFunctionType);
  // const onAdd = useStore((state) => state.addNode);

  const styles = (canConnect: boolean, handleType: string) => {
    return {
      backgroundColor:
        handleType === "target"
          ? canConnect
            ? "#784be8"
            : "#C2B5E5"
          : canConnect
          ? "#2061ee"
          : "#99B1E5",
    };
  };
  return (
    <div className="circle-node">
      <NodeToolbar>
        <button
          className="icon-button"
          style={{ marginBottom: 13 }}
          onClick={() => onDelete(id)}
        >
          <DeleteIcon />
        </button>
      </NodeToolbar>
      <div className="form__group">
        <RadioGroup
          row
          style={{ justifyContent: "center" }}
          aria-labelledby="input-output-buttons-group"
          name="input-output-buttons-group"
          value={data.functionType ?? "start"}
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
            onChangeFunctionType(id, evt.target.value);
          }}
        >
          <FormControlLabel
            value="start"
            control={<Radio className="form__label" />}
            label="Start"
          />
          <FormControlLabel
            value="end"
            control={<Radio className="form__label" />}
            label="End"
          />
        </RadioGroup>
        <label className="form__label" htmlFor={id}>
          Function
        </label>
        <TextareaAutosize
          id={id}
          maxRows={2}
          style={{ width: "170px", resize: "none" }}
          className="form__field nodrag"
          value={data.label}
          placeholder="Insert Text Here"
          onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange(id, evt.target.value)
          }
        />
      </div>
      <Handle
        type="target"
        style={styles((data.functionType ?? "start") === "end", "target")}
        position={Position.Top}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        id={id + "-prev"}
        isConnectable={(data.functionType ?? "start") === "end"}
      />
      <Handle
        type="source"
        style={styles((data.functionType ?? "start") === "start", "source")}
        position={Position.Bottom}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        id={id + "-next"}
        isConnectable={(data.functionType ?? "start") === "start"}
      />
    </div>
  );
};

export default memo(CircleNode);
