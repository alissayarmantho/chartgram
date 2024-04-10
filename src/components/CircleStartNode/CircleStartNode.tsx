import "./CircleStartNode.css";
import "../../IconButton.css";
import "../../FormField.css";
import { Handle, Position, NodeProps } from "reactflow";
import { memo } from "react";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import useStore, { NodeData } from "../../stores/store";

export const CircleStartNode: React.FC<NodeProps<NodeData>> = ({
  data,
  id,
  isConnectable,
}: NodeProps<NodeData>) => {
  const onConnect = useStore((state) => state.onConnect);
  const isValidConnection = useStore((state) => state.isValidConnection);
  // const onAdd = useStore((state) => state.addNode);
  return (
    <div
      className="circle-start-node"
      style={{ borderColor: data.hasError ? "red" : undefined }}
    >
      <div className="form__group">
        <label className="form__label" htmlFor={id}>
          Function
        </label>
        <TextareaAutosize
          id={id}
          maxRows={2}
          style={{ width: "170px", resize: "none" }}
          className="form__field nodrag"
          value={data.label}
          placeholder="main"
          disabled
        />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        id={id + "-next"}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(CircleStartNode);
