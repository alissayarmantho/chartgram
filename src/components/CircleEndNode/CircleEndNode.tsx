import "./CircleEndNode.css";
import "../../IconButton.css";
import "../../FormField.css";
import { Handle, Position, NodeProps } from "reactflow";
import { memo } from "react";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import useStore, { NodeData } from "../../stores/store";

export const CircleEndNode: React.FC<NodeProps<NodeData>> = ({
  data,
  id,
  isConnectable,
}: NodeProps<NodeData>) => {
  const onConnect = useStore((state) => state.onConnect);
  const isValidConnection = useStore((state) => state.isValidConnection);
  // const onAdd = useStore((state) => state.addNode);
  return (
    <div className="circle-end-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

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
          placeholder="0"
          disabled
        />
      </div>
      <Handle
        type="target"
        position={Position.Top}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        id={id + "-prev"}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(CircleEndNode);
