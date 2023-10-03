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
  const onAdd = useStore((state) => state.addNode);
  const onDelete = useStore((state) => state.deleteNode);
  return (
    <>
      <NodeToolbar>
        <button className="icon-button" onClick={() => onDelete(id)}>
          <DeleteIcon />
        </button>
      </NodeToolbar>
      <div className="hexagon">
        <div className="form__group">
          <label className="form__label" htmlFor={id} style={{ zIndex: 1 }}>
            Loops
          </label>
          <input
            style={{ zIndex: 1 }}
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
      <Handle
        type="target"
        position={Position.Top}
        id="a"
        style={{ background: "#555" }}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="a"
        style={{ background: "#555", right: "-45px" }}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{ background: "#555" }}
        onConnect={onConnect}
        isConnectable={isConnectable}
      />
    </>
  );
};

export default memo(HexagonNode);
