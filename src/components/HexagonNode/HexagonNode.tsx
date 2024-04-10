import "./HexagonNode.css";
import "../../FormField.css";
import { Handle, Position, NodeToolbar, NodeProps } from "reactflow";
import DeleteIcon from "@mui/icons-material/Delete";
import React, { memo } from "react";
import useStore, { NodeData } from "../../stores/store";
export const HexagonNode: React.FC<NodeProps<NodeData>> = ({
  data,
  id,
  isConnectable,
}: NodeProps<NodeData>) => {
  const onChange = useStore((state) => state.updateNodeLabel);
  const onConnect = useStore((state) => state.onConnect);
  // const onAdd = useStore((state) => state.addNode);
  const onDelete = useStore((state) => state.deleteNode);
  const isValidConnection = useStore((state) => state.isValidConnection);
  return (
    <>
      <NodeToolbar>
        <button
          className="icon-button"
          style={{ marginBottom: 13 }}
          onClick={() => onDelete(id)}
        >
          <DeleteIcon />
        </button>
      </NodeToolbar>
      <div
        className="hexagon"
        style={{ borderColor: data.hasError ? "red" : undefined }}
      >
        <div className="form__group">
          <label className="form__label" htmlFor={id} style={{ zIndex: 1 }}>
            Loops
          </label>
          <input
            style={{ zIndex: 1 }}
            id={id}
            className="form__field nodrag"
            value={data.label}
            placeholder="while i < 10"
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
              onChange(id, evt.target.value)
            }
          />
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        id={id + "-prev"}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id={id + "-loop"}
        style={{ right: "-45px" }}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={id + "-body"}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        isConnectable={isConnectable}
      />
    </>
  );
};

export default memo(HexagonNode);
