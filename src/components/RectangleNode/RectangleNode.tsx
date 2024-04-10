import "./RectangleNode.css";
import "../../IconButton.css";
import "../../FormField.css";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import { memo } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextareaAutosize } from "@mui/base/TextareaAutosize";
import useStore, { NodeData } from "../../stores/store";
export const RectangleNode: React.FC<NodeProps<NodeData>> = ({
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
    <div
      className="text-updater-node"
      style={{ borderColor: data.hasError ? "red" : undefined }}
    >
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
          Statement
        </label>
        <TextareaAutosize
          id={id}
          className="form__field nodrag"
          value={data.label}
          placeholder="some_variable = 1"
          onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange(id, evt.target.value)
          }
        />
      </div>
      <Handle
        type="target"
        id={id + "-prev"}
        position={Position.Top}
        isValidConnection={isValidConnection}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        id={id + "-next"}
        position={Position.Bottom}
        isValidConnection={isValidConnection}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(RectangleNode);
