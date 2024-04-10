import "./RoundedRectangleNode.css";
import "../../Handle.css";
import "../../IconButton.css";
import "../../FormField.css";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import { memo } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import useStore, { NodeData } from "../../stores/store";
export const RoundedRectangleNode: React.FC<NodeProps<NodeData>> = ({
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
    <div className="rounded-rectangle-node">
      <NodeToolbar>
        <button className="icon-button" onClick={() => onDelete(id)}>
          <DeleteIcon />
        </button>
      </NodeToolbar>
      <div className="form__group">
        <label className="form__label" htmlFor={id}>
          Loop
        </label>
        <TextareaAutosize
          id={id}
          className="form__field nodrag"
          value={data.label}
          placeholder="for i in range(10)"
          onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange(id, evt.target.value)
          }
        />
      </div>
      <Handle
        type="target"
        id={id + "-prev"}
        position={Position.Top}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id={id + "-loop-end"}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={id + "-continue"}
        style={{ left: "25%" }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={id + "-loop-body"}
        style={{ left: "75%" }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(RoundedRectangleNode);
