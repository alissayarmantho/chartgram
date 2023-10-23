import "./CircleNode.css";
import "../../IconButton.css";
import "../../FormField.css";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import { memo } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
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
  // const onAdd = useStore((state) => state.addNode);
  return (
    <div className="circle-node">
      <NodeToolbar>
        <button className="icon-button" onClick={() => onDelete(id)}>
          <DeleteIcon />
        </button>
      </NodeToolbar>
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
          style={{ width: "150px" }}
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
        position={Position.Top}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        id={id + "-prev"}
        isConnectable={isConnectable}
      />
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

export default memo(CircleNode);
