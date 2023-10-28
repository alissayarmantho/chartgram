import "./ParallelogramNode.css";
import "../../FormField.css";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import { memo } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import useStore, { NodeData } from "../../stores/store";
export const ParallelogramNode: React.FC<NodeProps<NodeData>> = ({
  id,
  data,
  isConnectable,
}: NodeProps<NodeData>) => {
  const onChange = useStore((state) => state.updateNodeLabel);
  const onConnect = useStore((state) => state.onConnect);
  const onDelete = useStore((state) => state.deleteNode);
  const onChangeInputType = useStore((state) => state.changeInputType);
  const isValidConnection = useStore((state) => state.isValidConnection);
  return (
    <>
      <NodeToolbar>
        <button className="icon-button" onClick={() => onDelete(id)}>
          <DeleteIcon />
        </button>
      </NodeToolbar>
      <div className="parallelogram">
        <div className="unskew-parallelogram">
          <div className="form__group">
            <RadioGroup
              row
              style={{ justifyContent: "center" }}
              aria-labelledby="input-output-buttons-group"
              name="input-output-buttons-group"
              value={data.inputType ?? "input"}
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                onChangeInputType(id, evt.target.value);
              }}
            >
              <FormControlLabel
                value="input"
                control={<Radio className="form__label" />}
                label="Input"
              />
              <FormControlLabel
                value="output"
                control={<Radio className="form__label" />}
                label="Output"
              />
            </RadioGroup>
            <input
              id={id}
              className="form__field nodrag"
              value={data.label}
              placeholder="Insert Text Here"
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
                onChange(id, evt.target.value)
              }
            />
          </div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        id={id + "-prev"}
        style={{ top: 3 }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={id + "-next"}
        style={{ bottom: 3 }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
    </>
  );
};

export default memo(ParallelogramNode);
